"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { IMPORT_TEMPLATES, getTemplate, type EntityTemplate } from "@/lib/import/templates"
import {
  parseFile,
  autoMap,
  validate,
  buildTemplateWorkbook,
  errorsToCsv,
  downloadBlob,
  type ParsedFile,
  type ValidationResult,
} from "@/lib/import/engine"
import { bulkInsert, appendImportRun, appendAudit } from "@/lib/platform/tenant-store"
import { usePlatform } from "@/contexts/platform-context"
import { useAuth } from "@/contexts/auth-context"

type Step = "select" | "upload" | "map" | "review" | "done"

export function ImportWizard({ initialEntity }: { initialEntity?: string }) {
  const { activeTenantId } = usePlatform()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>(initialEntity ? "upload" : "select")
  const [entity, setEntity] = useState<string>(initialEntity ?? "")
  const [parsed, setParsed] = useState<ParsedFile | null>(null)
  const [fileName, setFileName] = useState("")
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [committed, setCommitted] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const template = entity ? getTemplate(entity) : undefined

  function reset() {
    setStep(initialEntity ? "upload" : "select")
    setEntity(initialEntity ?? "")
    setParsed(null)
    setFileName("")
    setMapping({})
    setResult(null)
    setCommitted(null)
    setProgress(0)
  }

  function downloadTemplate(t: EntityTemplate) {
    downloadBlob(buildTemplateWorkbook(t), `plantilla-${t.entity}.xlsx`)
    toast.success(`Plantilla de ${t.label} descargada`)
  }

  const handleFile = useCallback(
    async (file: File, t: EntityTemplate) => {
      setBusy(true)
      setFileName(file.name)
      try {
        const pf = await parseFile(file)
        if (pf.rows.length === 0) {
          toast.error("El archivo no tiene filas de datos")
          setBusy(false)
          return
        }
        const auto = autoMap(t, pf.headers)
        setParsed(pf)
        setMapping(auto)
        setStep("map")
      } catch {
        toast.error("No se pudo leer el archivo. Usa CSV o XLSX.")
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  function runValidation() {
    if (!template || !parsed) return
    const res = validate(template, parsed.rows, mapping)
    setResult(res)
    setStep("review")
  }

  async function commit() {
    if (!template || !result) return
    setBusy(true)
    setProgress(10)
    try {
      const written = await bulkInsert(activeTenantId, template.collection, result.validRows)
      setProgress(80)
      const run = {
        tenantId: activeTenantId,
        entity: template.entity,
        fileName,
        actorEmail: user?.email ?? "usuario",
        status: "committed" as const,
        totalRows: result.totalRows,
        validRows: result.validRows.length,
        errorRows: result.errors.length,
        duplicateRows: result.duplicates.length,
        createdRows: written,
      }
      await appendImportRun(run)
      await appendAudit({
        tenantId: activeTenantId,
        actorEmail: user?.email ?? "usuario",
        actorRole: "importer",
        action: "import.commit",
        entityType: template.label,
        entityId: template.entity,
        summary: `Importación de ${written} ${template.label.toLowerCase()} desde ${fileName}`,
        after: { created: written, errors: result.errors.length },
        source: "import",
      })
      setCommitted(written)
      setProgress(100)
      setStep("done")
      toast.success(`${written} registros importados`)
    } catch {
      toast.error("Error al ejecutar la importación")
    } finally {
      setBusy(false)
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: "select", label: "Entidad" },
    { id: "upload", label: "Archivo" },
    { id: "map", label: "Mapeo" },
    { id: "review", label: "Validación" },
    { id: "done", label: "Resultado" },
  ]
  const currentIdx = steps.findIndex((s) => s.id === step)

  return (
    <div className="space-y-4" data-testid="import-wizard">
      {/* Stepper */}
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                i === currentIdx
                  ? "bg-primary text-primary-foreground"
                  : i < currentIdx
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < currentIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
              {s.label}
            </div>
            {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* STEP: select entity */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>¿Qué quieres importar?</CardTitle>
            <CardDescription>Elige la entidad. Cada una tiene su plantilla con columnas guiadas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {IMPORT_TEMPLATES.map((t) => (
              <button
                key={t.entity}
                onClick={() => {
                  setEntity(t.entity)
                  setStep("upload")
                }}
                data-testid={`entity-${t.entity}`}
                className="text-left rounded-lg border p-4 hover:border-primary hover:bg-muted/40 transition-colors"
              >
                <FileSpreadsheet className="w-6 h-6 text-primary mb-2" />
                <p className="font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* STEP: upload */}
      {step === "upload" && template && (
        <Card>
          <CardHeader>
            <CardTitle>Importar {template.label}</CardTitle>
            <CardDescription>Descarga la plantilla, llénala y súbela. Detectamos las columnas por ti.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => downloadTemplate(template)} data-testid="download-template">
                <Download className="w-4 h-4 mr-1" /> Descargar plantilla ({template.label})
              </Button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFile(f, template)
              }}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              {busy ? (
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Arrastra tu archivo aquí o</p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      data-testid="file-input"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFile(f, template)
                      }}
                    />
                    <span className="inline-flex items-center px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium cursor-pointer hover:bg-primary/90">
                      Seleccionar archivo
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-3">CSV o Excel (.xlsx)</p>
                </>
              )}
            </div>

            {/* Guía de columnas */}
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Columna</th>
                    <th className="text-left px-3 py-2 font-semibold">Nivel</th>
                    <th className="text-left px-3 py-2 font-semibold">Ejemplo</th>
                  </tr>
                </thead>
                <tbody>
                  {template.fields.map((f) => (
                    <tr key={f.key} className="border-b last:border-0">
                      <td className="px-3 py-1.5 font-medium">{f.label}</td>
                      <td className="px-3 py-1.5">
                        <Badge
                          variant={f.level === "required" ? "default" : f.level === "recommended" ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {f.level === "required" ? "obligatoria" : f.level === "recommended" ? "recomendada" : "opcional"}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{f.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: map */}
      {step === "map" && template && parsed && (
        <Card>
          <CardHeader>
            <CardTitle>Mapeo de columnas</CardTitle>
            <CardDescription>
              Detectamos {Object.keys(mapping).length} de {template.fields.length} columnas. Ajusta lo que falte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {template.fields.map((f) => (
              <div key={f.key} className="flex items-center gap-3 flex-wrap">
                <div className="w-48 shrink-0">
                  <span className="font-medium text-sm">{f.label}</span>
                  {f.level === "required" && <span className="text-destructive ml-1">*</span>}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <Select
                  value={mapping[f.key] ?? "__none__"}
                  onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger className="w-64" data-testid={`map-${f.key}`}>
                    <SelectValue placeholder="Sin mapear" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin mapear —</SelectItem>
                    {parsed.headers.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mapping[f.key] && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Atrás
              </Button>
              <Button onClick={runValidation} data-testid="run-validation">
                Validar y previsualizar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: review (dry-run) */}
      {step === "review" && template && result && (
        <Card>
          <CardHeader>
            <CardTitle>Validación (dry-run)</CardTitle>
            <CardDescription>Nada se ha guardado todavía. Revisa el resultado antes de confirmar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Total" value={result.totalRows} />
              <Stat label="Válidas" value={result.validRows.length} tone="ok" testId="stat-valid" />
              <Stat label="Errores" value={result.errors.length} tone="error" testId="stat-errors" />
              <Stat label="Duplicados" value={result.duplicates.length} tone="warn" />
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Filas con error (no se importarán)
                  </p>
                  <Button size="sm" variant="outline" onClick={() => downloadBlob(errorsToCsv(result.errors), "errores.csv")}>
                    <Download className="w-4 h-4 mr-1" /> Descargar errores
                  </Button>
                </div>
                <div className="rounded-lg border max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 border-b sticky top-0">
                      <tr>
                        <th className="text-left px-2 py-1.5">Fila</th>
                        <th className="text-left px-2 py-1.5">Columna</th>
                        <th className="text-left px-2 py-1.5">Valor</th>
                        <th className="text-left px-2 py-1.5">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.slice(0, 100).map((e, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-2 py-1">{e.row}</td>
                          <td className="px-2 py-1">{e.field}</td>
                          <td className="px-2 py-1 text-muted-foreground">{e.value || "—"}</td>
                          <td className="px-2 py-1 text-destructive">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {result.duplicates.length > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> {result.duplicates.length} duplicados detectados por clave natural (se omiten).
              </p>
            )}

            {busy && <Progress value={progress} />}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("map")}>
                Ajustar mapeo
              </Button>
              <Button
                onClick={commit}
                disabled={busy || result.validRows.length === 0}
                data-testid="commit-import"
              >
                {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                Confirmar e importar {result.validRows.length} registros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP: done */}
      {step === "done" && template && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold" data-testid="import-done">
                {committed} registros importados
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {template.label} agregados al universo activo. Quedó registrado en auditoría e importaciones.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="w-4 h-4 mr-1" /> Importar otra cosa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
  testId,
}: {
  label: string
  value: number
  tone?: "ok" | "error" | "warn"
  testId?: string
}) {
  const color =
    tone === "ok"
      ? "text-emerald-500"
      : tone === "error"
        ? "text-destructive"
        : tone === "warn"
          ? "text-amber-500"
          : "text-foreground"
  return (
    <div className="rounded-lg border p-3 text-center" data-testid={testId}>
      <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
