# Uso de Plugins, Skills, MCP y conectores — evidencia real

Descubrimiento ejecutado el 2026-07-03 con `ListPlugins`/`ListSkills` y pruebas reales. Sin conexiones inventadas.

## Plugins habilitados (claude.ai)

engineering, operations, finance, sales, data, human-resources, legal, pdf-viewer (los 8 del prompt §3) + figma, zapier, twilio-developer-kit, desktop-commander, brand-voice.

**Aplicación en este ciclo**: sus funciones de revisión se materializaron con las skills locales invocables del entorno: `/security-review` (revisión de seguridad del release, puerta previa al merge) y `/code-review`. Las recomendaciones se convirtieron en código/pruebas/documentación verificable, no en menciones.

## Skills relevantes disponibles

mcp-builder, skill-creator, web-artifacts-builder, pdf/docx/xlsx/pptx, doc-coauthoring, theme-factory, dataviz, verify, code-review, security-review. Además skills personales del usuario (momentum-whatsapp-growth, sap-*), no aplicables a este ciclo.

**Decisión sobre Skill Creator**: no se crearon skills nuevas este ciclo — las candidatas (`nexo-erp-release-gate`, `nexo-erp-tenant-security`) tendrán valor cuando el pipeline se repita con Supabase activo; crearlas hoy sería decorativo (§3: "No crees Skills decorativas").

## Servidores MCP — estado verificado

| MCP | Estado | Uso real este ciclo |
| --- | --- | --- |
| GitHub | ✅ | PRs #1/#2/final, checks, merge |
| Supabase | ✅ read-only | verificación: único proyecto existente es ajeno (`SenorFlores-Ecommerce`) → creación bloqueada por costo (ADR 0002) |
| Vercel | ⚠ parcial | `list_projects`/`web_fetch_vercel_url` sin acceso al team; deploys verificados vía commit status de GitHub |
| Playwright MCP | ❌ no conectado | fallback `@playwright/test` local con Chromium preinstalado (16 E2E) |
| Gmail / Google Drive / Lovable / Zapier vía conectores | disponibles, no requeridos por este ciclo | — |
| Canva | requiere OAuth (no autorizado en esta sesión) | — |

## Otras herramientas

- **MarkItDown CLI**: conversiones del paquete de contexto (14 archivos).
- **git + clone externo**: `Hainrixz/auto-crm` clonado y analizado para la integración CRM (modelo/endpoints reales).
