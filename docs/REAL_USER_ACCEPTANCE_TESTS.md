# Pruebas de aceptación reales (autenticadas)

Fecha: 2026-07-06. No se valida solo `/login`: se opera DENTRO del sistema con
sesión real (modo demo = mismos componentes que producción).

## Suites y resultados

| Suite | Archivo | Resultado |
| --- | --- | --- |
| Control Plane, importación, CRM, asistente, aislamiento | `tests/e2e/nexo-control-plane.spec.ts` | ✅ 9/9 (desktop) |
| Fundación DELAR (catálogo, precios, lotes, recepción) | `tests/e2e/delar-foundation.spec.ts` | ✅ 8/8 (desktop) |
| Unitarias (dominio, RBAC, CRM, reglas) | `tests/unit/*` | ✅ 45/45 |
| Typecheck estricto | `tsc --noEmit` | ✅ 0 errores |
| Build de producción | `next build` | ✅ compila 41 rutas |

## Flujos autenticados verificados (E2E)

1. Login real y branding.
2. `operaciones@nexo.com` es admin de plataforma y ve el Control Plane.
3. Un usuario normal NO entra al Control Plane (aviso de acceso restringido).
4. Crear un tenant nuevo y verlo en la tabla.
5. Entrar a un tenant (impersonación) y ver el indicador de universo activo.
6. Activar/desactivar módulos de un tenant y guardar (queda auditado).
7. Importación masiva: dry-run valida (2 válidas, 1 error) y confirma (2 creados).
8. CRM: config visible, sincronización sandbox, abrir embed y regresar a Nexo.
9. Asistente flotante: abre, busca un módulo y navega.
10. Tablas SAP: búsqueda, selector de columnas y exportación.
11. Recepción de lote idempotente y segregación de calidad (almacén recibe /
    calidad libera con motivo auditado).

## Clasificación de botones (§6: cero botones falsos)

| Botón / acción | Estado | Nota |
| --- | --- | --- |
| Crear empresa / Guardar tenant | ✅ funcional | escribe + audita |
| Entrar a tenant / Regresar a Nexo | ✅ funcional | impersonación + indicador |
| Activar/desactivar módulo | ✅ funcional | `planned` deshabilitado con motivo |
| Descargar plantilla / Importar / Dry-run / Confirmar | ✅ funcional | motor real |
| Descargar errores CSV | ✅ funcional | |
| Buscar / Filtrar / Exportar / Columnas / Densidad (tablas) | ✅ funcional | `DataTablePro` |
| Sincronizar CRM (sandbox) | ✅ funcional | adaptador mock con contrato |
| Abrir CRM / Regresar a Nexo | ✅ funcional | embed + fallback pestaña |
| Asistente flotante | ✅ funcional | reglas |
| Historial / Auditoría por registro | ✅ funcional | `RecordAuditSheet` |
| Guardar IA por tenant | ✅ funcional | sin exponer API key |
| Recepción de lote / Liberar calidad | ✅ funcional (demo) | mutaciones DELAR requieren sesión server (ver limitaciones) |
| Módulos `planned` (Punto de Venta) | ⛔ deshabilitado | switch off con etiqueta "planned", no se vende como listo |

## Cómo reproducir

```bash
npm install
npm run build
npx playwright test tests/e2e/nexo-control-plane.spec.ts --project=desktop
npx playwright test tests/e2e/delar-foundation.spec.ts --project=desktop
npm test
```

## Validación en producción real (Firebase)

El smoke autenticado contra producción se ejecuta con credenciales reales por
variable de entorno (nunca en el repo). El diagnóstico de producción con
evidencia directa (Vercel, bundle, Firebase REST) está en
`docs/PRODUCTION_REALITY_AUDIT.md`.
