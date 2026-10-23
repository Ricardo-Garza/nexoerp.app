import { buildDataView, type DataView } from "../analytics/view"
import { runCopilot } from "../engine"
import { IntentClassifier } from "../nlu/classifier"
import { extractEntities } from "../nlu/entities"
import { INTENT_IDS, type IntentId } from "../nlu/training"
import type { SessionMemory } from "../schema"
import type { DemoDataset } from "../types"
import { buildBank, type EvalCase } from "./bank"
import { makeOracle } from "./oracle"

export interface CaseOutcome {
  id: string
  category: string
  split: EvalCase["split"]
  question: string
  expected: string
  got: string
  status: string
  confidence: number
  intentOk: boolean
  checkOk: boolean
  ok: boolean
  reason: string | null
  unbacked: boolean
}

export interface ClassifierScores {
  mode: string
  n: number
  accuracy: number
  macroF1: number
}

export interface EvalReport {
  total: number
  executedOk: number
  executionRate: number
  byCategory: Record<string, { total: number; ok: number }>
  bySplit: Record<string, { total: number; ok: number; rate: number }>
  outcomes: CaseOutcome[]
  failures: CaseOutcome[]
  unbackedAnswers: number
  classifier: ClassifierScores[]
  confusions: { expected: string; got: string; count: number }[]
  calibration: { bucket: string; n: number; accuracy: number | null }[]
  looAccuracy: Record<string, number>
  trainingSize: number
}

export function runCase(view: DataView, ds: DemoDataset, c: EvalCase, oracle = makeOracle(ds)): CaseOutcome {
  let memory: SessionMemory | undefined
  for (const q of c.before ?? []) memory = runCopilot({ question: q, memory, view, source: "eval" }).memory
  const { result } = runCopilot({ question: c.question, memory, view, source: "eval" })
  const expectedIntent = c.intent
  const intentOk = expectedIntent === undefined || expectedIntent.split("|").includes(result.intent)
  const reason = c.check ? c.check(result, oracle, ds) : null
  const checkOk = reason === null
  const unbacked = result.status === "ok" && (result.kpis.length > 0 || !!result.table || !!result.chart) && !result.evidence && !/^system\./.test(result.intent)
  return {
    id: c.id,
    category: c.category,
    split: c.split,
    question: c.question,
    expected: expectedIntent ?? c.status ?? "(check)",
    got: result.intent,
    status: result.status,
    confidence: Number(result.confidence.toFixed(3)),
    intentOk,
    checkOk,
    ok: intentOk && checkOk,
    reason: !intentOk ? `intención ${result.intent} ≠ ${expectedIntent}` : reason,
    unbacked,
  }
}

function macroF1(pairs: { expected: string; got: string }[]): number {
  const labels = [...new Set(pairs.map((p) => p.expected))]
  const f1s = labels.map((l) => {
    const tp = pairs.filter((p) => p.expected === l && p.got === l).length
    const fp = pairs.filter((p) => p.expected !== l && p.got === l).length
    const fn = pairs.filter((p) => p.expected === l && p.got !== l).length
    const prec = tp + fp ? tp / (tp + fp) : 0
    const rec = tp + fn ? tp / (tp + fn) : 0
    return prec + rec ? (2 * prec * rec) / (prec + rec) : 0
  })
  return f1s.reduce((a, b) => a + b, 0) / (f1s.length || 1)
}

export function evaluate(ds: DemoDataset): EvalReport {
  const view = buildDataView(ds)
  const oracle = makeOracle(ds)
  const bank = buildBank(ds)
  const outcomes = bank.map((c) => runCase(view, ds, c, oracle))
  const ok = outcomes.filter((o) => o.ok)

  const byCategory: EvalReport["byCategory"] = {}
  const bySplit: EvalReport["bySplit"] = {}
  for (const o of outcomes) {
    byCategory[o.category] ??= { total: 0, ok: 0 }
    byCategory[o.category].total++
    if (o.ok) byCategory[o.category].ok++
    bySplit[o.split] ??= { total: 0, ok: 0, rate: 0 }
    bySplit[o.split].total++
    if (o.ok) bySplit[o.split].ok++
  }
  for (const s of Object.values(bySplit)) s.rate = s.total ? s.ok / s.total : 0

  // Clasificador aislado: solo preguntas de un turno con intención de consulta esperada
  const clf = new IntentClassifier()
  const labelled = bank.filter((c) => !c.before && c.intent && (INTENT_IDS as string[]).includes(c.intent))
  const ctx = { ref: ds.meta.referenceDate, customers: ds.customers, products: ds.products }
  const texts = labelled.map((c) => extractEntities(c.question, ctx).maskedText)
  const variants = [
    { mode: "rules" as const, label: "rules", refine: false },
    { mode: "tfidf" as const, label: "tfidf", refine: false },
    { mode: "hybrid" as const, label: "hybrid-sin-refinador", refine: false },
    { mode: "hybrid" as const, label: "hybrid", refine: true },
  ]
  const classifier: ClassifierScores[] = variants.map((v) => {
    const pairs = labelled.map((c, i) => ({ expected: c.intent as string, got: clf.classify(texts[i], { mode: v.mode, refine: v.refine }).intent as string }))
    const ok = pairs.filter((p, i) => labelled[i].intent!.split("|").includes(p.got)).length
    return { mode: v.label, n: pairs.length, accuracy: ok / pairs.length, macroF1: macroF1(pairs.map((p, i) => ({ expected: labelled[i].intent!.split("|").includes(p.got) ? p.got : p.expected, got: p.got }))) }
  })

  const hybridPairs = labelled.map((c, i) => {
    const r = clf.classify(texts[i])
    const exp = c.intent!.split("|").includes(r.intent) ? r.intent : c.intent!.split("|")[0]
    return { expected: exp as string, got: r.intent as string, conf: r.confidence }
  })
  const confMap = new Map<string, number>()
  for (const p of hybridPairs) if (p.expected !== p.got) confMap.set(`${p.expected}→${p.got}`, (confMap.get(`${p.expected}→${p.got}`) ?? 0) + 1)
  const confusions = [...confMap.entries()].map(([k, count]) => ({ expected: k.split("→")[0], got: k.split("→")[1], count })).sort((a, b) => b.count - a.count)
  const buckets = [
    { bucket: "< 0.30", lo: 0, hi: 0.3 },
    { bucket: "0.30 – 0.50", lo: 0.3, hi: 0.5 },
    { bucket: "0.50 – 0.70", lo: 0.5, hi: 0.7 },
    { bucket: "≥ 0.70", lo: 0.7, hi: 2 },
  ]
  const calibration = buckets.map((b) => {
    const sel = hybridPairs.filter((p) => p.conf >= b.lo && p.conf < b.hi)
    return { bucket: b.bucket, n: sel.length, accuracy: sel.length ? sel.filter((p) => p.expected === p.got).length / sel.length : null }
  })

  return {
    total: outcomes.length,
    executedOk: ok.length,
    executionRate: ok.length / outcomes.length,
    byCategory,
    bySplit,
    outcomes,
    failures: outcomes.filter((o) => !o.ok),
    unbackedAnswers: outcomes.filter((o) => o.unbacked).length,
    classifier,
    confusions,
    calibration,
    looAccuracy: { rules: clf.looAccuracy("rules"), tfidf: clf.looAccuracy("tfidf"), hybrid: clf.looAccuracy("hybrid") },
    trainingSize: clf.trainingSize,
  }
}

export type { IntentId }
