/**
 * Pronóstico estadístico simple: regresión lineal por mínimos cuadrados sobre
 * los últimos meses COMPLETOS. No es machine learning y no se presenta como tal;
 * incluye una banda ±1.28σ de los residuos (≈80% si los residuos son normales).
 */
export interface ForecastPoint {
  index: number
  predicted: number
  low: number
  high: number
}

export interface LinearForecast {
  slope: number
  intercept: number
  residualSd: number
  r2: number
  points: ForecastPoint[]
}

export function linearForecast(series: number[], horizon: number): LinearForecast | null {
  const n = series.length
  if (n < 6) return null
  const xs = series.map((_, i) => i)
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = series.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (series[i] - my)
    sxx += (xs[i] - mx) ** 2
  }
  const slope = sxx ? sxy / sxx : 0
  const intercept = my - slope * mx
  const resid = series.map((y, i) => y - (intercept + slope * i))
  const sse = resid.reduce((a, r) => a + r * r, 0)
  const sst = series.reduce((a, y) => a + (y - my) ** 2, 0)
  const residualSd = Math.sqrt(sse / Math.max(1, n - 2))
  const points: ForecastPoint[] = []
  for (let h = 1; h <= horizon; h++) {
    const index = n - 1 + h
    const predicted = Math.max(0, intercept + slope * index)
    points.push({ index, predicted, low: Math.max(0, predicted - 1.28 * residualSd), high: predicted + 1.28 * residualSd })
  }
  return { slope, intercept, residualSd, r2: sst ? 1 - sse / sst : 0, points }
}
