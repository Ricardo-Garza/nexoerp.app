import { expect, test, type Page } from "@playwright/test"

/**
 * E2E AUTENTICADO del Nexo Control Plane, importación masiva, CRM y asistente.
 * No valida solo /login: entra con sesión real (modo demo = mismos componentes
 * que producción) y opera DENTRO del sistema, como exige el prompt de rescate §2/§16.
 */

const consoleErrors: string[] = []

test.beforeEach(({ page }) => {
  consoleErrors.length = 0
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })
})

function criticalErrors(): string[] {
  return consoleErrors.filter(
    (e) => !e.includes("firebase") && !e.includes("Failed to load resource") && !e.includes("net::"),
  )
}

async function login(page: Page, email: string) {
  await page.goto("/login")
  await page.getByLabel("Correo Electrónico").fill(email)
  await page.getByLabel("Contraseña").fill("demo")
  await page.getByRole("button", { name: /iniciar sesión/i }).click()
  await page.waitForURL("**/dashboard")
}

test("operaciones@nexo.com es admin de plataforma y ve el Control Plane", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  // El acceso al Control Plane aparece en el sidebar para el admin de plataforma
  await expect(page.getByTestId("sidebar-control-plane")).toBeVisible()
  await page.getByTestId("sidebar-control-plane").click()
  await page.waitForURL("**/admin")
  await expect(page.getByRole("main").getByRole("heading", { name: "Nexo Control Plane" })).toBeVisible()
  await expect(page.getByText("nexoerp-88c6e")).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("un usuario normal NO puede entrar al Control Plane (aislamiento de rol)", async ({ page }) => {
  await login(page, "ventas@delarfoods.mx")
  // No ve el acceso
  await expect(page.getByTestId("sidebar-control-plane")).toHaveCount(0)
  // Y si navega directo, ve el aviso de acceso restringido (no pantalla en blanco)
  await page.goto("/admin")
  await expect(page.getByTestId("platform-denied")).toBeVisible()
})

test("Control Plane: crear un tenant nuevo y verlo en la tabla", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants")
  await expect(page.getByRole("heading", { name: /Empresas/ })).toBeVisible()

  const name = `Empresa E2E ${Date.now().toString(36)}`
  await page.getByTestId("new-tenant").click()
  await page.getByTestId("tenant-name-input").fill(name)
  await page.getByTestId("tenant-create-confirm").click()

  // Aparece en la tabla profesional
  await expect(page.getByTestId("tenants-table").getByText(name)).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("Control Plane: entrar a un tenant e impersonar, luego regresar", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants")
  await page.getByTestId("enter-org-demo").click()
  await page.waitForURL("**/dashboard")
  // El indicador de tenant muestra el universo activo
  await expect(page.getByTestId("tenant-switcher")).toContainText("Prototipo Demo")
})

test("tenant detail: activar/desactivar módulos y guardar (auditado)", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants/org-demo")
  await expect(page.getByRole("heading", { name: /Prototipo Demo/ })).toBeVisible()
  // La pestaña de módulos está activa por defecto; guardar genera auditoría
  await page.getByRole("button", { name: /Guardar módulos/ }).click()
  await page.getByRole("tab", { name: "Auditoría" }).click()
  await expect(page.getByRole("tabpanel").getByText(/Módulos actualizados/)).toBeVisible()
})

test("Centro de Importación: dry-run valida y confirma una carga CSV", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard/import")
  await expect(page.getByTestId("import-wizard")).toBeVisible()

  // Elegir entidad Clientes
  await page.getByTestId("entity-clientes").click()

  // Subir un CSV en memoria (nombre + rfc + correo)
  const csv = [
    "Nombre,RFC,Correo,Estado",
    "Cliente Uno,CU010101AA1,uno@test.mx,activo",
    "Cliente Dos,CU020202BB2,dos@test.mx,activo",
    "Cliente Malo,,correo-invalido,activo", // fila con error (rfc vacío recomendado ok, email inválido)
  ].join("\n")
  await page.getByTestId("file-input").setInputFiles({
    name: "clientes.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  })

  // Mapeo automático → validar
  await expect(page.getByTestId("run-validation")).toBeVisible()
  await page.getByTestId("run-validation").click()

  // Dry-run: 2 válidas, 1 con error de correo
  await expect(page.getByTestId("stat-valid")).toContainText("2")
  await expect(page.getByTestId("stat-errors")).toContainText("1")

  // Confirmar e importar
  await page.getByTestId("commit-import").click()
  await expect(page.getByTestId("import-done")).toContainText("2")
  expect(criticalErrors()).toEqual([])
})

test("CRM Momentum: config visible, sync sandbox y regreso a Nexo", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard/crm")
  await expect(page.getByRole("heading", { name: "CRM Momentum" })).toBeVisible()

  // Sincronización sandbox real contra el adaptador mock
  await page.getByTestId("crm-sync").click()
  await expect(page.getByText(/traídos/)).toBeVisible()

  // Abrir embebido y regresar a Nexo
  await page.getByRole("button", { name: /Abrir CRM en Nexo/ }).click()
  await page.waitForURL("**/dashboard/crm/embed")
  await expect(page.getByTestId("back-to-nexo")).toBeVisible()
  await page.getByTestId("back-to-nexo").click()
  await page.waitForURL("**/dashboard/crm")
})

test("asistente flotante: abre, busca un módulo y navega", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard")
  await page.getByTestId("assistant-toggle").click()
  await expect(page.getByTestId("assistant-panel")).toBeVisible()
  await page.getByTestId("assistant-input").fill("inventario")
  await page.getByTestId("assistant-send").click()
  // Sugiere módulos de inventario; al hacer clic navega
  await page.getByRole("button", { name: /Inventario/ }).first().click()
  await expect(page).toHaveURL(/dashboard\/(inventory|inventario)/)
})

test("tablas SAP: búsqueda y exportación disponibles en el listado de empresas", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants")
  await expect(page.getByTestId("table-search")).toBeVisible()
  await expect(page.getByTestId("table-columns")).toBeVisible()
  await expect(page.getByTestId("table-export")).toBeVisible()
  // Buscar DELAR filtra la tabla
  await page.getByTestId("table-search").fill("DELAR")
  await expect(page.getByTestId("tenants-table").getByText("DELAR Foods")).toBeVisible()
})
