"use client"

import { useState } from "react"
import { useBiData } from "@/hooks/use-bi-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, List, Sparkles, Map, Calendar, Download, Plus } from "lucide-react"
import { DashboardsTab } from "@/components/bi/dashboards-tab"
import { QueriesTab } from "@/components/bi/queries-tab"
import { AssistantTab } from "@/components/bi/assistant-tab"
import { MapsTab } from "@/components/bi/maps-tab"
import { ScheduledTab } from "@/components/bi/scheduled-tab"
import { useAuth } from "@/contexts/auth-context"

const tabs = [
  { id: "dashboards", name: "Tablero", icon: BarChart3 },
  { id: "queries", name: "Consultas", icon: List },
  { id: "assistant", name: "Asistente", icon: Sparkles },
  { id: "maps", name: "Mapas", icon: Map },
  { id: "scheduled", name: "Programados", icon: Calendar },
]

export default function BusinessIntelligencePage() {
  const { user, loading: authLoading } = useAuth()
  const companyId = user?.companyId || ""
  const userId = user?.uid || ""

  console.log("[v0] BusinessIntelligence - companyId:", companyId, "userId:", userId)

  const [activeTab, setActiveTab] = useState("dashboards")

  const {
    queries,
    dashboards,
    reports,
    exports: biExports,
    loading,
    metrics,
    addQuery,
    updateQuery,
    deleteQuery,
    addDashboard,
    updateDashboard,
    deleteDashboard,
    addReport,
    updateReport,
    deleteReport,
    createExport,
    getDataSource,
  } = useBiData(companyId)

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <h2 className="text-xl font-semibold">Configuración requerida</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Para usar Business Intelligence, necesitas estar asociado a una empresa.
            </p>
            <p className="text-sm text-muted-foreground">
              CompanyId: {companyId || "No disponible"}
              <br />
              UserId: {userId}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Recargar página
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
<Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Consulta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <List className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <span>+6</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Consultas Activas</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : metrics.consultasActivas}</p>
              <p className="text-xs text-muted-foreground mt-1">Guardadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <span>+2</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Tableros Creados</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : metrics.tablerosCreados}</p>
              <p className="text-xs text-muted-foreground mt-1">Dashboards</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <span>+3</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Reportes Programados</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : metrics.reportesProgramados}</p>
              <p className="text-xs text-muted-foreground mt-1">Activos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <span>+45</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Exportaciones</p>
              <p className="text-2xl font-bold mt-1">{loading ? "..." : metrics.exportaciones}</p>
              <p className="text-xs text-muted-foreground mt-1">Completadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "dashboards" && (
            <DashboardsTab
              dashboards={dashboards}
              loading={loading}
              onAddDashboard={addDashboard}
              onUpdateDashboard={updateDashboard}
              onDeleteDashboard={deleteDashboard}
            />
          )}

          {activeTab === "queries" && (
            <QueriesTab
              queries={queries}
              loading={loading}
              onAddQuery={async (q) => { await addQuery(q) }}
              onUpdateQuery={async (id, q) => { await updateQuery(id, q) }}
              onDeleteQuery={async (id) => { await deleteQuery(id) }}
              getDataSource={async (c: string) => getDataSource(c)}
            />
          )}

          {activeTab === "assistant" && <AssistantTab onAddQuery={async (q) => { await addQuery(q) }} onAddDashboard={async (d) => { await addDashboard(d) }} />}

          {activeTab === "maps" && (
            <MapsTab queries={queries} getDataSource={async (c: string) => getDataSource(c)} onCreateExport={async (e: any) => { await createExport(e) }} />
          )}

          {activeTab === "scheduled" && (
            <ScheduledTab
              reports={reports}
              loading={loading}
              onAddReport={async (r) => { await addReport(r) }}
              onUpdateReport={async (id, r) => { await updateReport(id, r) }}
              onDeleteReport={async (id) => { await deleteReport(id) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
