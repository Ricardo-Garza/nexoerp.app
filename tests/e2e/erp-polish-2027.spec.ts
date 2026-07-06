import { expect, test, type Page } from "@playwright/test"

/**
 * Pulido ERP 2027: tablas empresariales con filtros, totales, vistas,
 * importar/exportar, ayuda e historial en los módulos operativos.
 */

async function login(page: Page, email = "operaciones@nexo.com") {
  await page.goto("/login")
  await page.getByLabel("Correo Electrónico").fill(email)
  await page.getByLabel("Contraseña").fill("demo")
  await page.getByRole("button", { name: /iniciar sesión/i }).click()
  await page.waitForURL("**/dashboard")
}

test("Ventas: tabla con totales, vistas, importar, imprimir e historial", async ({ page }) => {
  await login(page)
  await page.goto("/dashboard/ventas/ordenes")

  const table = page.getByTestId("sales-orders-table")
  await expect(table).toBeVisible()
  await expect(table.getByTestId("table-search")).toBeVisible()
  await expect(table.getByTestId("table-filters")).toBeVisible()
  await expect(table.getByTestId("table-totals")).toBeVisible()
  await expect(table.getByTestId("table-views")).toBeVisible()
  await expect(table.getByTestId("table-import")).toBeVisible()
  await expect(table.getByTestId("table-print")).toBeVisible()
  await expect(table.getByTestId("table-export")).toBeVisible()
  await expect(table.getByTestId("table-recent-changes")).toBeVisible()
  await expect(table.getByTestId("table-help")).toBeVisible()
  await expect(table.getByTestId("table-metrics")).toBeVisible()
})

test("Ventas: guardar una vista con nombre y restaurar la predeterminada", async ({ page }) => {
  await login(page)
  await page.goto("/dashboard/ventas/ordenes")

  await page.getByTestId("table-views").click()
  await page.getByTestId("table-view-name").fill("Mi corte diario")
  await page.getByTestId("table-view-save").click()
  await expect(page.getByTestId("table-view-Mi corte diario")).toBeVisible()
  await page.getByTestId("table-view-restore").click()
})

test("Nómina: empleados con importar, exportar, filtros y ayuda", async ({ page }) => {
  await login(page)
  await page.goto("/dashboard/payroll")

  const table = page.getByTestId("payroll-employees-table")
  await expect(table).toBeVisible()
  await expect(table.getByTestId("table-import")).toBeVisible()
  await expect(table.getByTestId("table-export")).toBeVisible()
  await expect(table.getByTestId("table-filters")).toBeVisible()
  await expect(table.getByTestId("table-help")).toBeVisible()
  await expect(page.getByRole("button", { name: /Nuevo Empleado/ }).first()).toBeVisible()
})

test("Bancos: pestaña Movimientos con totales de ingresos y egresos", async ({ page }) => {
  await login(page)
  await page.goto("/dashboard/banking")

  await page.getByRole("tab", { name: "Movimientos" }).click()
  const table = page.getByTestId("banking-movements-table")
  await expect(table).toBeVisible()
  await expect(table.getByTestId("table-totals")).toBeVisible()
  await expect(table.getByTestId("table-import")).toBeVisible()
  await expect(table.getByTestId("table-export")).toBeVisible()
})

test("Contabilidad: catálogo de cuentas con importación y ayuda para cargarlo", async ({ page }) => {
  await login(page)
  await page.goto("/dashboard/accounting")

  const table = page.getByTestId("accounting-accounts-table")
  await expect(table).toBeVisible()
  await expect(table.getByTestId("table-import")).toBeVisible()
  await table.getByTestId("table-help").click()
  await expect(page.getByText(/descarga la plantilla/i)).toBeVisible()
})

test("Asistente: preguntas de totales y filtros responden con guía de la tabla", async ({ page }) => {
  await login(page)
  await page.goto("/dashboard/ventas/ordenes")

  await page.getByTestId("assistant-toggle").click()
  await page.getByTestId("assistant-input").fill("sumar ventas")
  await page.getByTestId("assistant-send").click()
  await expect(page.getByTestId("assistant-panel")).toContainText("Totales")

  await page.getByTestId("assistant-input").fill("como filtro por fecha")
  await page.getByTestId("assistant-send").click()
  await expect(page.getByTestId("assistant-panel")).toContainText("Filtros")
})

test("Frontend sin lenguaje técnico prohibido en pantallas operativas", async ({ page }) => {
  await login(page)

  for (const route of ["/dashboard/import", "/dashboard/payroll", "/dashboard/banking"]) {
    await page.goto(route)
    await expect(page.locator("body")).not.toContainText(/universo|persistencia durable|deuda D3|mutaciones/i)
  }
})
