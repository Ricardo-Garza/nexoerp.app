import { expect, test, type Page } from "@playwright/test"

/**
 * E2E del vertical slice DELAR (modo demo, datos semilla canónicos).
 * Cubre los criterios de aceptación de docs/TEST_STRATEGY.md.
 */

const consoleErrors: string[] = []

test.beforeEach(({ page }) => {
  consoleErrors.length = 0
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })
})

async function loginAs(page: Page, email: string) {
  await page.goto("/login")
  await page.getByLabel("Correo Electrónico").fill(email)
  await page.getByLabel("Contraseña").fill("demo")
  await page.getByRole("button", { name: /iniciar sesión/i }).click()
  await page.waitForURL("**/dashboard")
}

async function loginAsAdmin(page: Page) {
  await loginAs(page, "admin@delarfoods.mx")
}

async function switchUser(page: Page, email: string) {
  await page.context().clearCookies()
  await page.evaluate(() => window.localStorage.clear())
  await loginAs(page, email)
}

function criticalErrors(): string[] {
  // Se ignoran fallos de red a servicios externos no configurados en demo
  return consoleErrors.filter(
    (e) => !e.includes("firebase") && !e.includes("Failed to load resource") && !e.includes("net::"),
  )
}

test("login demo muestra branding DELAR y autentica", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("img", { name: "Nexo ERP" })).toBeVisible()
  await expect(page.getByTestId("demo-mode-notice")).toBeVisible()
  await expect(page.locator("body")).not.toContainText("florister")
  await loginAsAdmin(page)
  await expect(page).toHaveURL(/dashboard/)
  expect(criticalErrors()).toEqual([])
})

test("catálogo: buscar Ranch muestra múltiples presentaciones distintas", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto("/dashboard/catalogo")
  await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible()

  await page.getByLabel("Buscar en el catálogo").fill("Ranch")
  const count = page.getByTestId("catalog-count")
  await expect(count).not.toContainText(/^0 de/)

  // Presentaciones diferentes de la familia Ranch (regla funcional §4)
  await expect(page.getByTestId("catalog-row-CC-RANCH-20KG")).toBeVisible()
  await expect(page.getByTestId("catalog-row-CC-RANCHHAB-3.4KG")).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("detalle de SKU muestra empaque, precios históricos y FEFO", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto("/dashboard/catalogo/CC-RANCH-20KG")
  await expect(page.getByRole("heading", { name: /Aderezo Ranch 20 kg/ })).toBeVisible()
  await expect(page.getByText("Datos históricos: requieren validación")).toBeVisible()
  await expect(page.getByText(/Orden FEFO sugerido/)).toBeVisible()
  // El lote en cuarentena aparece pero NO en el orden FEFO
  await expect(page.getByText("LOT-TEST-R3")).toBeVisible()
  const fefoLine = await page.getByText(/Orden FEFO sugerido/).textContent()
  expect(fefoLine).not.toContain("LOT-TEST-R3")
  expect(criticalErrors()).toEqual([])
})

test("listas de precios: Menudeo y Mayoreo con aviso histórico y regla 40k", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto("/dashboard/listas-precios")
  await expect(page.getByTestId("historical-warning")).toBeVisible()
  await expect(page.getByTestId("historical-warning")).toContainText("40,000")
  await expect(page.getByText("RETAIL-2025-01-27")).toBeVisible()
  await expect(page.getByText("WHOLESALE-2025-01-27")).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("inventario: lote en cuarentena y lote vencido no son asignables", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto("/dashboard/inventario-lotes")

  const quarantineRow = page.getByTestId("lot-row-LOT-TEST-R3")
  await expect(quarantineRow.getByTestId("lot-status-quarantine")).toBeVisible()
  await expect(quarantineRow.getByText("No asignable")).toBeVisible()

  const expiredRow = page.getByTestId("lot-row-LOT-TEST-B1")
  await expect(expiredRow.getByText(/Vencido hace/)).toBeVisible()
  await expect(expiredRow.getByText("No asignable")).toBeVisible()

  const usableRow = page.getByTestId("lot-row-LOT-TEST-R1")
  await expect(usableRow.getByText("Sí (FEFO)")).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("recepción de lote es idempotente y entra en cuarentena", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "tablet", "flujo de mutación solo en desktop")
  await loginAsAdmin(page)
  await page.goto("/dashboard/inventario-lotes")

  const lotCode = `LOT-E2E-${Date.now().toString(36).toUpperCase()}`
  await page.getByLabel("SKU a recibir").click()
  await page.getByRole("option", { name: /CC-ALITAS-20KG/ }).click()
  await page.getByLabel("Código de lote").fill(lotCode)
  await page.getByLabel("Cantidad (pzas)").fill("5")
  await page.getByLabel("Caducidad").fill("2027-12-31")
  await page.getByRole("button", { name: "Registrar recepción" }).click()

  await expect(page.getByTestId("action-ok")).toContainText("cuarentena")
  const newRow = page.getByTestId(`lot-row-${lotCode}`)
  await expect(newRow.getByTestId("lot-status-quarantine")).toBeVisible()

  // Reintento con el MISMO payload y clave de idempotencia: no duplica efecto
  await page.getByLabel("SKU a recibir").click()
  await page.getByRole("option", { name: /CC-ALITAS-20KG/ }).click()
  await page.getByLabel("Código de lote").fill(lotCode)
  await page.getByLabel("Cantidad (pzas)").fill("5")
  await page.getByLabel("Caducidad").fill("2027-12-31")
  await page.getByRole("button", { name: "Registrar recepción" }).click()
  await expect(page.getByTestId("action-ok")).toContainText("idempotencia")
  await expect(page.getByTestId(`lot-row-${lotCode}`)).toHaveCount(1)
  expect(criticalErrors()).toEqual([])
})

test("segregación: almacén recibe, calidad libera con motivo auditado", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "tablet", "flujo de mutación solo en desktop")

  // 1) Recepción con rol autorizado para recibir (org_admin)
  await loginAsAdmin(page)
  await page.goto("/dashboard/inventario-lotes")
  const lotCode = `LOT-E2E-REL-${Date.now().toString(36).toUpperCase()}`
  await page.getByLabel("SKU a recibir").click()
  await page.getByRole("option", { name: /CC-MH-20KG/ }).click()
  await page.getByLabel("Código de lote").fill(lotCode)
  await page.getByLabel("Cantidad (pzas)").fill("8")
  await page.getByLabel("Caducidad").fill("2027-06-30")
  await page.getByRole("button", { name: "Registrar recepción" }).click()
  await expect(page.getByTestId(`lot-row-${lotCode}`).getByTestId("lot-status-quarantine")).toBeVisible()

  // org_admin NO tiene lot.release: el botón Liberar no debe existir (segregación)
  await expect(page.getByTestId(`lot-row-${lotCode}`).getByRole("button", { name: "Liberar" })).toHaveCount(0)

  // 2) Liberación con rol de Calidad
  await switchUser(page, "calidad@delarfoods.mx")
  await page.goto("/dashboard/inventario-lotes")
  page.on("dialog", (dialog) => dialog.accept("Inspección E2E conforme"))
  await page.getByTestId(`lot-row-${lotCode}`).getByRole("button", { name: "Liberar" }).click()
  await expect(page.getByTestId("action-ok")).toContainText("liberado")
  await expect(page.getByTestId(`lot-row-${lotCode}`).getByTestId("lot-status-released")).toBeVisible()
  await expect(page.getByTestId(`lot-row-${lotCode}`).getByText("Sí (FEFO)")).toBeVisible()
  expect(criticalErrors()).toEqual([])
})

test("responsive: catálogo sin desbordamiento horizontal", async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto("/dashboard/catalogo")
  await expect(page.getByRole("heading", { name: "Catálogo" })).toBeVisible()
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1)
  expect(overflow).toBe(false)
})
