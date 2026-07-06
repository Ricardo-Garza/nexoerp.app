"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Boxes,
  ScrollText,
  Upload,
  Activity,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  listTenants,
  listAudit,
  listImportRuns,
} from "@/lib/platform/tenant-store";
import { MODULE_CATALOG } from "@/lib/platform/modules";
import type { Tenant } from "@/lib/platform/types";

export default function AdminOverviewPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [auditCount, setAuditCount] = useState(0);
  const [importCount, setImportCount] = useState(0);

  useEffect(() => {
    listTenants().then(setTenants);
    listAudit(null, 500).then((a) => setAuditCount(a.length));
    listImportRuns(null, 200).then((i) => setImportCount(i.length));
  }, []);

  const active = tenants.filter((t) => t.status === "active").length;
  const stableModules = MODULE_CATALOG.filter(
    (m) => m.maturity === "stable",
  ).length;

  const kpis = [
    {
      label: "Empresas",
      value: tenants.length,
      sub: `${active} activas`,
      icon: Building2,
      href: "/admin/tenants",
    },
    {
      label: "Módulos disponibles",
      value: MODULE_CATALOG.length,
      sub: `${stableModules} estables`,
      icon: Boxes,
      href: "/admin/modules",
    },
    {
      label: "Eventos de auditoría",
      value: auditCount,
      sub: "sesión actual",
      icon: ScrollText,
      href: "/admin/audit",
    },
    {
      label: "Importaciones",
      value: importCount,
      sub: "corridas registradas",
      icon: Upload,
      href: "/admin/imports",
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Administración Nexo</h1>
          <p className="mt-1 text-muted-foreground">
            Administración central de las empresas configuradas en Nexo.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants">
            Gestionar empresas <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {k.label}
                  </CardTitle>
                  <k.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{k.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Salud del sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            {
              label: "Autenticación Firebase",
              detail: "Proyecto nexoerp-88c6e",
            },
            {
              label: "Persistencia Firestore",
              detail: "Datos organizados por empresa",
            },
            {
              label: "Separación por empresa",
              detail: "Reglas de seguridad versionadas",
            },
            { label: "CRM Momentum", detail: "Modo de prueba por empresa" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresas configuradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {tenants.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tenants/${t.id}`}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ background: t.branding.primaryColor }}
                >
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.modules.length} módulos · v{t.version}
                  </p>
                </div>
              </div>
              <Badge variant={t.status === "active" ? "default" : "secondary"}>
                {t.status}
              </Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
