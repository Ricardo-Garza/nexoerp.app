import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { getSoleilDemoDataset } from "@/lib/copilot/data/dataset"
import { evaluate } from "@/lib/copilot/eval/run"

/**
 * Evaluación del copiloto contra el banco de preguntas con oráculo independiente.
 * `npm run copilot:eval` imprime el informe (y lo guarda con COPILOT_EVAL_REPORT=<ruta>).
 */
const report = evaluate(getSoleilDemoDataset())

describe("Nexo Intelligence — banco de evaluación", () => {
  it("el banco tiene al menos 120 preguntas en todas las categorías pedidas", () => {
    expect(report.total).toBeGreaterThanOrEqual(120)
    for (const cat of ["ventas", "clientes", "productos", "inventario", "finanzas", "crm", "analitica", "multiturno", "adversarial"]) {
      expect(report.byCategory[cat]?.total, cat).toBeGreaterThan(0)
    }
  })

  it("ejecuta correctamente al menos 95% del banco completo", () => {
    const detail = report.failures.map((f) => `${f.id} «${f.question}» → ${f.reason}`).join("\n")
    expect(report.executionRate, detail).toBeGreaterThanOrEqual(0.95)
  })

  it("ejecuta correctamente al menos 95% de las preguntas RESERVADAS (holdout)", () => {
    const detail = report.failures.filter((f) => f.split === "holdout").map((f) => `${f.id} «${f.question}» → ${f.reason}`).join("\n")
    expect(report.bySplit.holdout.rate, detail).toBeGreaterThanOrEqual(0.95)
  })

  it("ninguna respuesta con cifras sale sin evidencia de respaldo", () => {
    expect(report.outcomes.filter((o) => o.unbacked).map((o) => o.id)).toEqual([])
  })

  it("el híbrido no es peor que el baseline de reglas", () => {
    const rules = report.classifier.find((c) => c.mode === "rules")!
    const hybrid = report.classifier.find((c) => c.mode === "hybrid")!
    expect(hybrid.accuracy).toBeGreaterThanOrEqual(rules.accuracy)
  })

  it("escribe el informe cuando se solicita", () => {
    const out = process.env.COPILOT_EVAL_REPORT
    if (!out) return
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, JSON.stringify(report, null, 2))
    expect(join(out)).toBeTruthy()
  })
})
