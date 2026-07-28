import { expect, test, type Page } from "@playwright/test"

const consoleErrors: string[] = []

test.beforeEach(({ page }) => {
  consoleErrors.length = 0
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })
})

function criticalErrors(): string[] {
  return consoleErrors.filter(
    (error) => !error.includes("firebase") && !error.includes("Failed to load resource") && !error.includes("net::"),
  )
}

async function login(page: Page, email: string) {
  await page.goto("/login")
  await page.getByLabel("Correo Electrónico").fill(email)
  await page.getByLabel("Contraseña").fill("demo")
  await page.getByRole("button", { name: /iniciar sesión/i }).click()
  await page.waitForURL("**/dashboard")
}

test("asistente entiende ayuda sin acentos ni signos y responde por pantalla", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard/listas-precios")
  await page.getByTestId("assistant-toggle").click()
  await page.getByTestId("assistant-input").fill("q puedo hacer aqui")
  await page.getByTestId("assistant-send").click()
  await expect(page.getByTestId("assistant-panel")).toContainText("Listas de Precios")
  await expect(page.getByTestId("assistant-panel")).toContainText("comparar menudeo contra mayoreo")
})

test("operaciones@nexo.com es Administrador Nexo y ve Administración Nexo", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await expect(page.getByTestId("sidebar-control-plane")).toBeVisible()
  await page.getByTestId("sidebar-control-plane").click()
  await page.waitForURL("**/admin")
  await expect(page.getByRole("main").getByRole("heading", { name: "Administración Nexo" })).toBeVisible()
  await expect(page.getByText("nexoerp-88c6e")).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("un usuario normal no puede entrar a Administración Nexo ni recibirla como recomendación", async ({ page }) => {
  await login(page, "ventas@delarfoods.mx")
  await expect(page.getByTestId("sidebar-control-plane")).toHaveCount(0)
  await page.getByTestId("assistant-toggle").click()
  await expect(page.getByTestId("assistant-panel")).toBeVisible()
  await expect(page.getByTestId("assistant-panel")).not.toContainText("Administración Nexo")
  await expect(page.getByTestId("assistant-panel")).not.toContainText("Panel Nexo")
  await expect(page.getByTestId("assistant-panel")).not.toContainText("Crear empresa")
  await page.goto("/admin")
  await expect(page.getByTestId("platform-denied")).toBeVisible()
})

test("Administración Nexo: crear una empresa nueva y verla en la tabla", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants")
  await expect(page.getByRole("heading", { name: "Empresas" })).toBeVisible()

  const name = `Empresa E2E ${Date.now().toString(36)}`
  await page.getByTestId("new-tenant").click()
  await page.getByTestId("tenant-name-input").fill(name)
  await page.getByTestId("tenant-create-confirm").click()

  await expect(page.getByTestId("tenants-table").getByText(name)).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("Administración Nexo: entrar a una empresa como soporte y regresar", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants")
  await page.getByTestId("enter-org-demo").click()
  await page.waitForURL("**/dashboard")
  await expect(page.getByTestId("tenant-switcher")).toContainText("Prototipo Demo")
})

test("detalle de empresa: activar/desactivar módulos y guardar con auditoría", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants/org-demo")
  await expect(page.getByRole("heading", { name: /Prototipo Demo/ })).toBeVisible()
  await page.getByRole("button", { name: /Guardar módulos/ }).click()
  await page.getByRole("tab", { name: "Auditoría" }).click()
  await expect(page.getByRole("tabpanel").getByText(/Módulos actualizados/)).toBeVisible()
})

test("Centro de Importación: prueba previa valida y confirma una carga CSV", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard/import")
  await expect(page.getByTestId("import-wizard")).toBeVisible()

  await page.getByTestId("entity-clientes").click()

  const csv = [
    "Nombre,RFC,Correo,Estado",
    "Cliente Uno,CU010101AA1,uno@test.mx,activo",
    "Cliente Dos,CU020202BB2,dos@test.mx,activo",
    "Cliente Malo,,correo-invalido,activo",
  ].join("\n")
  await page.getByTestId("file-input").setInputFiles({
    name: "clientes.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  })

  await expect(page.getByTestId("run-validation")).toBeVisible()
  await page.getByTestId("run-validation").click()

  await expect(page.getByTestId("stat-valid")).toContainText("2")
  await expect(page.getByTestId("stat-errors")).toContainText("1")

  await page.getByTestId("commit-import").click()
  await expect(page.getByTestId("import-done")).toContainText("2")
  expect(criticalErrors()).toEqual([])
})

test("Configurar dashboard: sin scroll horizontal y secciones claras", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.getByTestId("configure-dashboard").click()
  const dialog = page.getByTestId("dashboard-editor-dialog")
  await expect(dialog).toBeVisible()
  await expect(page.getByText("Bloques activos")).toBeVisible()
  await expect(page.getByText("Disponibles para agregar")).toBeVisible()
  await expect(page.getByText("Vista previa")).toBeVisible()
  await expect(dialog).toContainText("Personalizar panel de control")
  await expect(dialog).not.toContainText("value")
  await expect(dialog).not.toContainText("Por conectar")
  await expect(dialog).not.toContainText("Personalizar dashboard")

  const overflow = await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1)
  expect(overflow).toBe(false)
  expect(criticalErrors()).toEqual([])
})

test("Preferencias: idioma y tema se aplican y persisten", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard/configuracion")
  await expect(page.getByTestId("user-preferences-card")).toBeVisible()

  await page.getByTestId("pref-theme").click()
  await page.getByRole("option", { name: "Claro" }).click()
  await expect(page.locator("html")).not.toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByTestId("user-preferences-card")).toBeVisible()
  await expect(page.locator("html")).not.toHaveClass(/dark/)

  await page.getByTestId("pref-theme").click()
  await page.getByRole("option", { name: "Oscuro" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByTestId("user-preferences-card")).toBeVisible()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await page.getByTestId("pref-language").click()
  await page.getByRole("option", { name: "English" }).click()
  await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "Settings" })).toBeVisible()
  await page.goto("/dashboard")
  await expect(page.getByTestId("configure-dashboard")).toContainText("Configure")
  await page.reload()
  await expect(page.getByTestId("configure-dashboard")).toContainText("Configure")

  await page.goto("/dashboard/configuracion")
  await page.getByTestId("pref-language").click()
  await page.getByRole("option", { name: "Spanish" }).click()
  await page.goto("/dashboard")
  await expect(page.getByTestId("configure-dashboard")).toContainText("Configurar")
  expect(criticalErrors()).toEqual([])
})

test("Configurar dashboard: cambiar tamaño, guardar y persistir", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.getByTestId("configure-dashboard").click()
  const firstRowSize = page.getByRole("combobox").first()
  await firstRowSize.click()
  await page.getByRole("option", { name: "Grande" }).click()
  await page.getByRole("button", { name: "Guardar configuración" }).click()
  await expect(page.getByTestId("dashboard-editor-dialog")).toBeHidden()

  // Reabrir y confirmar que el tamaño se conservó (persistido, no solo en memoria)
  await page.getByTestId("configure-dashboard").click()
  await expect(page.getByRole("combobox").first()).toContainText("Grande")
})

test("Configurar dashboard: Cancelar no guarda cambios", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.getByTestId("configure-dashboard").click()
  const countBefore = await page.getByTestId("dashboard-visible-count").textContent()
  await page.getByRole("switch").first().click()
  await page.getByRole("button", { name: "Cancelar" }).click()
  await expect(page.getByTestId("dashboard-editor-dialog")).toBeHidden()

  await page.getByTestId("configure-dashboard").click()
  await expect(page.getByTestId("dashboard-visible-count")).toHaveText(countBefore ?? "")
})

test("Configurar dashboard: no deja activar más de 12 bloques", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.getByTestId("configure-dashboard").click()

  for (let i = 0; i < 20; i++) {
    const addButtons = page.getByRole("button", { name: "Agregar" })
    if ((await addButtons.count()) === 0) break
    const warningVisible = await page.getByTestId("dashboard-limit-warning").isVisible().catch(() => false)
    if (warningVisible) break
    await addButtons.first().click()
  }

  const addButtons = page.getByRole("button", { name: "Agregar" })
  if ((await addButtons.count()) > 0) {
    await addButtons.first().click()
    await expect(page.getByTestId("dashboard-limit-warning")).toBeVisible()
  }
  await expect(page.getByTestId("dashboard-visible-count")).toContainText("12 de 12")
})

test("Configurar dashboard: Restaurar predeterminado vuelve al set inicial", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.getByTestId("configure-dashboard").click()
  const countBefore = await page.getByTestId("dashboard-visible-count").textContent()
  await page.getByRole("button", { name: "Agregar" }).first().click()
  await expect(page.getByTestId("dashboard-visible-count")).not.toHaveText(countBefore ?? "")
  await page.getByRole("button", { name: "Restaurar predeterminado" }).click()
  await expect(page.getByTestId("dashboard-visible-count")).toHaveText(countBefore ?? "")
})

test("CRM Momentum: configuración visible, sincronización de prueba y regreso a Nexo", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard/crm")
  await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "CRM Momentum" })).toBeVisible()

  await page.getByTestId("crm-sync").click()
  await expect(page.getByText(/recibidos/)).toBeVisible()

  await page.getByRole("button", { name: /Abrir CRM en Nexo/ }).click()
  await page.waitForURL("**/dashboard/crm/embed")
  await expect(page.getByTestId("back-to-nexo")).toBeVisible()
  await page.getByTestId("back-to-nexo").click()
  await page.waitForURL("**/dashboard/crm")
})

test("asistente flotante: abre, busca inventario y navega", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/dashboard")
  await page.getByTestId("assistant-toggle").click()
  await expect(page.getByTestId("assistant-panel")).toBeVisible()
  await page.getByTestId("assistant-input").fill("inventario")
  await page.getByTestId("assistant-send").click()
  await page.getByRole("button", { name: /Buscar producto/ }).click()
  await expect(page).toHaveURL(/dashboard\/(inventory|inventario)/)
})

test("tablas empresariales: búsqueda y exportación disponibles en empresas", async ({ page }) => {
  await login(page, "operaciones@nexo.com")
  await page.goto("/admin/tenants")
  await expect(page.getByTestId("table-search")).toBeVisible()
  await expect(page.getByTestId("table-columns")).toBeVisible()
  await expect(page.getByTestId("table-export")).toBeVisible()
  await page.getByTestId("table-search").fill("DELAR")
  await expect(page.getByTestId("tenants-table").getByText("DELAR Foods")).toBeVisible()
})
