# PROMPT DEFINITIVO — NEXO ERP LISTO PARA PRODUCCIÓN
## Productización multiempresa, operación completa, CRM Momentum, Plugins de Claude, Skills, MCP, Playwright, GitHub, Vercel y despliegue final

## 0. Autorización y objetivo

Actúa como arquitecto principal de ERP SaaS, líder técnico full-stack, especialista en seguridad multi-tenant, procesos empresariales, UX de sistemas operativos, integración, fiscalidad mexicana, contabilidad, nómina, operaciones, datos, QA automatizado y despliegue productivo.

Tu objetivo es terminar **Nexo ERP** como un producto empresarial vendible y utilizable día con día, especializado inicialmente para **DELAR Foods**, pero diseñado como plataforma SaaS multiempresa y configurable para otros clientes.

Este prompt constituye autorización expresa para:

- continuar el desarrollo completo;
- corregir diseño y arquitectura;
- modificar el código necesario;
- ejecutar migraciones seguras;
- crear y actualizar PRs;
- fusionar a `main` cuando todas las puertas de calidad estén verdes;
- desplegar a producción en Vercel cuando el release esté validado;
- actualizar documentación, configuración y pruebas;
- utilizar Plugins, Skills, MCP y conectores disponibles.

No solicites confirmación adicional para merge o deploy cuando todo esté verde. Solo detente ante falta real de permisos, credenciales indispensables, riesgo de pérdida de datos, costo no autorizado o una decisión fiscal/legal que requiera intervención humana.

No te detengas después de generar documentación, una maqueta o un vertical parcial. Avanza hasta dejar un release funcional, probado, fusionado a `main` y desplegado en producción.

---

## 1. Contexto obligatorio

Lee íntegramente antes de tocar código:

1. `CLAUDE.md`
2. `project-context/delar-erp/README_FIRST.md`
3. `project-context/delar-erp/MASTER_PROMPT_CLAUDE_CODE.md`
4. `project-context/delar-erp/DELAR_ERP_CONTEXT_CONSOLIDATED.md`
5. Todo `project-context/delar-erp/specs/`
6. Todo `project-context/delar-erp/data/`
7. Todo `project-context/delar-erp/markdown/`
8. Todo `project-context/delar-erp/reference/`
9. Todo `project-context/delar-erp/nexo-v2/`
10. `docs/CURRENT_STATE_AUDIT.md`
11. `docs/TARGET_ARCHITECTURE.md`
12. `docs/TEST_STRATEGY.md`
13. `docs/SECURITY_MODEL.md`
14. Todos los ADR existentes
15. Todos los PRs, ramas y commits relacionados con DELAR/Nexo ERP
16. Este prompt

Cuando exista contradicción, este documento tiene prioridad.

No inventes información del negocio. Los datos históricos deben marcarse como históricos o pendientes de validación. Los datos mock deben identificarse claramente.

---

## 2. Descubrimiento de herramientas

Antes de programar:

1. Detecta qué Skills, Plugins, conectores y servidores MCP están realmente disponibles.
2. Prueba cada uno antes de afirmar que funciona.
3. Registra nombre, estado, capacidad, uso previsto y limitaciones.
4. Usa la terminal y el repositorio como fuente de verdad.
5. No inventes conexiones, APIs, credenciales ni resultados.

Herramientas esperadas:

- Claude Code
- GitHub
- Vercel
- Supabase/PostgreSQL
- Playwright MCP
- Playwright local como respaldo
- MarkItDown
- Skills de páginas/web
- Skills de artefactos web
- MCP Builder
- Skills de ERP/software
- Plugins Anthropic instalados

Si Playwright MCP no aparece, usa `@playwright/test` local. Si un conector no está disponible, intenta una alternativa segura. Solo detente si el bloqueo impide realmente producción.

---

## 3. Uso obligatorio de Plugins de Claude

Utiliza los Plugins instalados como revisores especializados. No basta con mencionarlos.

### Engineering

Úsalo para arquitectura, auditoría de código, revisión de PR, seguridad, deuda técnica, incidentes, observabilidad, release y runbooks.

### Operations

Úsalo para compras, proveedores, inventarios, almacenes, lotes, producción, mantenimiento, SOP, capacidad y riesgos operativos.

### Finance

Úsalo para contabilidad, pólizas, doble partida, CxC, CxP, bancos, conciliación, flujo, costos, COGS, márgenes, presupuestos y estados financieros.

### Sales

Úsalo para clientes, prospectos, oportunidades, cotizaciones, pedidos, descuentos, listas de precios, pipeline, actividades, CRM y métricas comerciales.

### Data

Úsalo para modelo de datos, SQL, migraciones, RLS, deduplicación, métricas, BI, dashboards, performance, retención y exportación.

### Human Resources

Úsalo para empleados, beneficios, vacaciones, incidencias, asistencia, prestaciones, políticas y seguridad de datos personales.

### Legal

Úsalo para privacidad, segregación, retención, consentimiento, acceso privilegiado, auditoría, contratos y riesgos regulatorios. Sus resultados son orientación, no asesoría legal definitiva.

### PDF Viewer

Úsalo para validar cotizaciones, remisiones, facturas, notas de crédito, complementos, tickets, órdenes de compra, producción, nómina y etiquetas.

### Claude Code Setup

Úsalo para revisar hooks, MCP, Skills, scripts, estándares, comandos, entornos y automatizaciones.

### Skill Creator

Crea Skills reutilizables cuando aporten automatización real, por ejemplo:

- `nexo-erp-domain-review`
- `nexo-erp-release-gate`
- `nexo-erp-tenant-security`
- `nexo-erp-playwright-regression`
- `nexo-erp-accounting-validation`
- `nexo-erp-crm-sync-review`

No crees Skills decorativas.

Toda recomendación de Plugins debe convertirse en requisitos, código, pruebas o documentación verificable.

---

## 4. Git, PRs, merge y producción

### Inspección inicial

Ejecuta:

- `git status`
- `git branch -a`
- `git log --oneline --decorate --graph --all`
- revisión de PR #1 y PR #2
- comparación contra `main`
- revisión de checks y deploys

No destruyas historia útil.

### Estrategia

1. Determina la rama con el trabajo más completo.
2. Integra correctamente contexto y fundación.
3. Crea una rama final como `claude/nexo-erp-production-release`.
4. Mantén commits pequeños y trazables.
5. Abre o actualiza un PR final.
6. Resuelve conflictos y comentarios.
7. Ejecuta todas las puertas de calidad.
8. Cuando todo esté verde:
   - fusiona a `main`;
   - crea tag de release;
   - despliega producción;
   - ejecuta smoke tests;
   - monitorea errores.

### Puertas obligatorias para merge

- lint verde;
- typecheck verde;
- unitarias verdes;
- integración verde;
- contratos verdes;
- RLS verde;
- autorización verde;
- E2E Playwright verde;
- accesibilidad básica;
- regresión visual;
- PDFs validados;
- build verde;
- preview Vercel Ready;
- migraciones validadas;
- backup o snapshot;
- rollback documentado;
- cero secretos;
- cero errores críticos/altos;
- consola limpia;
- documentación actualizada.

### Producción

Después del merge:

1. Despliega a producción.
2. Valida login, navegación, permisos, registros, flujos, PDFs, integraciones sandbox, logs, métricas y aislamiento tenant.
3. Ejecuta Playwright no destructivo contra producción.
4. Ante falla crítica, revierte, corrige y vuelve a desplegar.
5. Entrega URL, commit, tag, migraciones y resultado de smoke tests.

---

## 5. Diseño y experiencia

El diseño predeterminado debe recuperar el estilo oscuro profesional de Nexo ERP:

- fondo azul marino o casi negro;
- paneles azul profundo;
- acento turquesa/cian;
- navegación lateral compacta;
- tablas densas y legibles;
- KPIs claros;
- jerarquía empresarial coherente.

Debe poder personalizarse por tenant:

- tema oscuro/claro;
- logotipo;
- nombre;
- colores;
- favicon;
- textos;
- orden del menú;
- módulos;
- plantillas;
- documentos.

Reglas:

1. Tema oscuro predeterminado.
2. Tema claro opcional.
3. No uses una interfaz genérica desconectada del diseño existente.
4. No rompas la lógica por rediseñar.
5. Desktop, tablet y móvil sin overflow accidental.
6. Estados loading, empty, error, offline, retry, success y no-permission.
7. Accesibilidad AA, teclado, foco y labels.
8. White-label bajo la plataforma madre Nexo ERP.
9. Navegación consistente, ordenada y configurable.
10. Todos los módulos deben verse como un solo producto.

---

## 6. Menú objetivo

### Módulos principales

- Dashboard
- Clientes / CRM
- Ventas y pedidos
- Facturación
- Cobranza
- Proveedores y compras
- Inventario
- Almacenes y lotes
- Punto de venta
- Bancos / Tesorería

### Operaciones

- Producción
- Mantenimiento
- Servicio / Soporte

### Administración

- Contabilidad
- Nómina / RRHH
- Usuarios, roles y permisos
- Configuración

### Analítica y canales

- Business Intelligence
- ERP Web / Móvil
- E-Commerce

### Eliminar del menú principal

- Calidad de Datos y Reglas Comerciales
- Field Services
- E-Procurement
- Atributos como módulo independiente

La calidad de datos debe mantenerse como control interno dentro de Configuración o Control Center. Los atributos viven dentro de Catálogo/Configuración. Servicio será el Centro de Soporte Nexo.

---

## 7. Multi-tenancy y Control Center

Nexo ERP debe funcionar como SaaS multiempresa.

### Control Center Nexo

Solo para operadores autorizados:

- alta de tenants;
- branding;
- módulos;
- feature flags;
- planes y límites;
- dominios;
- salud;
- versiones;
- migraciones;
- errores;
- integraciones;
- plantillas;
- configuración fiscal/PAC;
- administradores;
- soporte;
- auditoría;
- acceso privilegiado temporal con motivo y vencimiento.

### Universo privado de cada empresa

Implementa:

- `tenant_id` obligatorio;
- RLS real;
- autorización server-side;
- almacenamiento segregado;
- caché segregada;
- jobs con tenant;
- webhooks con tenant;
- búsquedas con tenant;
- pruebas cross-tenant;
- restricciones contra referencias cruzadas;
- exportación y eliminación controladas;
- auditoría de impersonación.

Un usuario de un tenant jamás debe acceder a datos de otro por UI, URL, API, búsqueda, exportación, archivo, job o integración.

---

## 8. Trazabilidad total

Cada cambio relevante debe registrar:

- tenant;
- módulo;
- entidad e ID;
- acción;
- actor y rol;
- fecha UTC y zona local;
- antes y después;
- motivo;
- origen;
- IP y user-agent cuando aplique;
- correlation ID;
- idempotency key;
- documento relacionado;
- resultado;
- error;
- aprobación;
- evidencia.

No borres físicamente documentos fiscales, contables, inventarios o auditoría. Usa cancelación, reversa, nota, ajuste o soft delete según dominio. Cada entidad debe tener timeline.

---

## 9. Roles y permisos

Construye un editor visual fácil de configurar con permisos por:

- visualizar;
- crear;
- editar;
- aprobar;
- cancelar;
- eliminar lógicamente;
- exportar;
- imprimir;
- ver costos;
- ver márgenes;
- ver fiscal;
- timbrar;
- cobrar;
- conciliar;
- liberar lote;
- ajustar inventario;
- administrar usuarios;
- configurar;
- usar IA;
- ejecutar sincronizaciones.

Incluye plantillas, roles personalizados, herencia controlada, permisos por sucursal/almacén/caja/centro, segregación de funciones, simulador, vista previa, permisos temporales, auditoría y denegación explícita tanto en UI como servidor.

---

## 10. Módulos funcionales

### Dashboard

KPIs reales de ventas, COGS, utilidad, margen, cobranza, vencidos, inventario, rotación, caducidad, producción, compras, bancos, mantenimiento y RRHH. Con filtros, alertas y drill-down.

### Clientes / CRM

Clientes, contactos, direcciones, RFC, fiscal, crédito, listas, términos, actividades, notas, adjuntos, oportunidades, cotizaciones, historial, deduplicación, consentimientos e integración con CRM Momentum.

### Ventas y pedidos

Flujo completo:

`cliente → cotización → aprobación → pedido → reserva FEFO → surtido → remisión → factura → cobranza → cierre`

Con listas, monedas, descuentos, aprobaciones, disponibilidad, backorder, parciales, devoluciones, cancelaciones, firmas, evidencias, PDFs, estados y trazabilidad.

### Facturación

Preparada para México mediante adaptador PAC:

- CFDI vigente;
- emisor y receptor;
- RFC;
- régimen;
- CP fiscal;
- uso CFDI;
- objeto de impuesto;
- claves SAT;
- unidad;
- impuestos;
- moneda;
- PUE/PPD;
- forma y método;
- series y folios;
- CSD;
- UUID;
- XML;
- PDF;
- QR;
- notas de crédito;
- cancelación;
- factura global;
- complemento de pago;
- relaciones;
- estatus;
- reintentos;
- bitácora;
- sandbox.

Implementa `FiscalProviderPort`, `MockPacAdapter`, contratos, fixtures, pruebas, configuración, validación e idempotencia. No timbres productivamente sin credenciales válidas ya configuradas.

### Documentos e impresión

Configurador para cotización, pedido, remisión, surtido, factura, nota de crédito, complemento, recibo, ticket, OC, recepción, lote, producción y nómina. Con branding, campos, columnas, firmas, QR, tamaños, vista previa, PDF, impresión y envío por adaptadores.

### Cobranza

CxC, antigüedad, vencimientos, promesas, parciales, aplicación, saldos, notas, complementos, alertas, crédito, bloqueos, conciliación y trazabilidad.

### Proveedores y compras

`requisición → cotizaciones → comparación → aprobación → OC → recepción → inspección → factura → CxP → pago`

Con parciales, devoluciones, lotes, caducidad, three-way match, costos, adjuntos y auditoría.

### Inventario, almacenes y lotes

Ledger append-only, stock derivado, múltiples almacenes, ubicaciones, transferencias, conteos, ajustes, reservas, FEFO, lotes, caducidad, cuarentena, liberado, rechazado, bloqueado, vencido, EAN/DUN, conversiones, trazabilidad, recall, costos, disponible, comprometido, tránsito y proyectado.

### Punto de venta

Apertura, cierre, arqueo, efectivo, tarjeta, transferencia, crédito, pagos mixtos, descuentos, devolución, cancelación, ticket, factura, códigos, cliente mostrador, listas, offline limitado, reconciliación, lotes, FEFO y auditoría.

### Bancos / Tesorería

Cuentas, estados, movimientos, conciliación, transferencias, ingresos, egresos, aplicación CxC/CxP, flujo, forecast, reglas, partidas e idempotencia.

### Contabilidad

Catálogo, pólizas, doble partida, periodos, cierres, centros, sucursales, monedas, impuestos, presupuestos, CxC, CxP, bancos, inventario, COGS, costos, asientos automáticos, reversas, conciliación, balanza, mayor, diario, balance, resultados, flujo, auxiliares, razones, exportación y trazabilidad documento-asiento.

### Producción

Fórmulas/BOM confidenciales, versiones, vigencias, rendimientos, escalado, materias, empaques, consumos, mermas, WIP, órdenes, planificación, reservas, lotes consumidos/producidos, genealogía, QC, liberación, caducidad, costo estándar/real, mano de obra, indirectos, reproceso, scrap, aprobaciones y seguridad de fórmulas. No inventes fórmulas reales.

### Mantenimiento

Unidades, vehículos y activos con placa, serie, marca, modelo, año, responsable, odómetro, horómetro, historial, planes por fecha/km/horas, preventivo, correctivo, alertas, solicitudes, órdenes, diagnóstico, tareas, refacciones, proveedores, costos, downtime, evidencias, próxima fecha/lectura y métricas. Todo cambio de odómetro/horómetro requiere antes, después, motivo, evidencia y usuario.

### Servicio / Soporte

Centro de Soporte Nexo con ticket, módulo, descripción, pasos, impacto, prioridad, adjuntos, navegador, dispositivo, tenant, usuario, SLA, comentarios, asignación, solución, causa raíz, versión, cierre, satisfacción e historial.

### Nómina / RRHH

Empleados, puestos, departamentos, centros, contratos, expedientes, documentos, salario, conceptos, beneficios, prestaciones, horarios, asistencia, incidencias, permisos, incapacidades, vacaciones devengadas/tomadas/disponibles/proyectadas, políticas, antigüedad, solicitudes, aprobaciones, calendario, evaluación, capacitación, bajas, flujos de finiquito, recibos, exportaciones y auditoría. Reglas efectivas por fecha y configurables.

### Business Intelligence y asistente inteligente

Debe analizar todos los módulos y ofrecer lenguaje natural, KPIs, recomendaciones, anomalías, alertas, forecast, inventario lento, riesgo de caducidad, cartera, margen, compras, producción, mantenimiento, ausentismo, capacidad, oportunidades, resúmenes y tareas.

Debe respetar permisos y tenant, citar registros, explicar recomendaciones, indicar confianza, distinguir dato/inferencia/recomendación, no inventar, pedir confirmación antes de acciones sensibles y auditar.

### Web / Móvil y E-Commerce

PWA, móvil, escaneo, inventario, pedidos, entregas, aprobaciones, notificaciones, catálogo, disponibilidad, precios por canal, pedidos online y trazabilidad sin duplicar lógica de negocio.

---

## 11. CRM Momentum

Aplicación:
`https://crm-momentum.vercel.app/`

Repositorio:
`https://github.com/Hainrixz/auto-crm.git`

Analiza el repositorio real antes de implementar:

```bash
git clone https://github.com/Hainrixz/auto-crm.git
cd auto-crm
npm install
npm run dev
```

Sincronización bidireccional de:

- clientes;
- contactos;
- prospectos;
- oportunidades;
- actividades;
- cotizaciones;
- pedidos;
- estatus comerciales.

Requisitos:

- adaptador desacoplado;
- no compartir base;
- no inventar endpoints;
- IDs externos;
- mapeo;
- idempotencia;
- deduplicación;
- outbox/inbox;
- reintentos;
- backoff;
- dead-letter;
- webhooks firmados;
- correlation ID;
- auditoría;
- errores;
- health;
- replay;
- conflictos;
- fuente principal configurable;
- soft delete;
- versionado;
- pruebas de contrato;
- observabilidad.

Primero sandbox/mock. No modifiques datos reales sin credenciales y configuración aprobada.

---

## 12. Arquitectura técnica

- Next.js y TypeScript estricto;
- puertos y adaptadores;
- PostgreSQL/Supabase;
- migraciones versionadas;
- RLS;
- transacciones;
- outbox;
- jobs idempotentes;
- dinero exacto;
- UTC + zona;
- Zod;
- autorización server-side;
- secretos solo servidor;
- tenant derivado de sesión confiable;
- logs estructurados;
- métricas;
- tracing;
- manejo de errores;
- ADRs;
- OpenAPI;
- backups;
- rollback;
- seeds demo;
- `.env.example`.

No uses `ignoreBuildErrors`. No introduzcas errores TypeScript nuevos. Reduce deuda legacy.

---

## 13. Plan de ejecución

1. Baseline: Git, Plugins, Skills, MCP, pruebas, arquitectura y matriz conservar/refactorizar/eliminar.
2. Restauración visual y menú.
3. Multi-tenant, RLS, RBAC y auditoría.
4. Flujo comercial completo.
5. Compras, inventario, bancos y contabilidad.
6. Producción y mantenimiento.
7. RRHH, soporte, móvil y e-commerce.
8. BI inteligente.
9. CRM Momentum sandbox.
10. Hardening, performance, seguridad, backup, release, merge y producción.

Trabaja por vertical slices reales. No dejes botones falsos ni placeholders presentados como terminados.

---

## 14. Flujos de aceptación

- venta completa;
- compra completa;
- producción completa;
- POS completo;
- mantenimiento completo;
- RRHH/vacaciones;
- CRM sandbox;
- aislamiento multi-tenant;
- facturación y PDFs;
- contabilización automática;
- cobranza y complementos;
- cierre de caja;
- conciliación bancaria;
- reintentos sin duplicados;
- permisos denegados correctamente.

---

## 15. Pruebas obligatorias

- lint;
- typecheck;
- unitarias;
- integración;
- contratos;
- migraciones;
- RLS;
- autorización;
- idempotencia;
- E2E Playwright;
- responsive;
- accesibilidad;
- regresión visual;
- PDFs;
- carga;
- seguridad;
- consola limpia;
- build;
- preview;
- smoke en producción.

Playwright debe probar rutas reales, permisos, errores, responsive y flujos completos.

---

## 16. Documentación

Crea o actualiza:

- `docs/PRODUCT_REQUIREMENTS_V2.md`
- `docs/MULTITENANCY_ARCHITECTURE.md`
- `docs/AUDIT_TRACEABILITY.md`
- `docs/RBAC_PERMISSION_MODEL.md`
- `docs/FISCAL_AND_PRINTING_ARCHITECTURE.md`
- `docs/CRM_MOMENTUM_INTEGRATION.md`
- `docs/BI_ASSISTANT.md`
- `docs/UI_DESIGN_SYSTEM.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/KNOWN_GAPS.md`
- `docs/PRODUCTION_RUNBOOK.md`
- `docs/ROLLBACK_PLAN.md`
- `docs/BACKUP_RESTORE.md`
- `docs/PLUGIN_AND_SKILL_USAGE.md`
- ADRs;
- OpenAPI;
- diagramas Mermaid;
- `.env.example`;
- manual de tenant;
- manual de soporte;
- manual de release.

---

## 17. Reporte por ciclo

Informa:

1. rama;
2. commits;
3. PR;
4. preview;
5. Plugins usados;
6. Skills usados;
7. MCP usados;
8. módulos;
9. flujos;
10. migraciones;
11. pruebas;
12. evidencia visual;
13. seguridad;
14. deuda;
15. bloqueos;
16. decisiones;
17. siguiente vertical slice.

Distingue implementado, probado, sandbox, pendiente, bloqueado y validación profesional requerida.

---

## 18. Reporte final de producción

No cierres hasta entregar:

- commit de `main`;
- tag;
- URL productiva;
- estado Vercel;
- estado de base;
- migraciones;
- backup;
- rollback;
- pruebas;
- smoke tests;
- monitoreo;
- errores abiertos;
- módulos funcionales;
- configuraciones faltantes;
- guía de acceso;
- guía de soporte;
- versión del release.

No declares “listo para producción” si existen mocks críticos no reemplazados, persistencia temporal, permisos inseguros, datos cruzados, migraciones no aplicadas, errores TypeScript, botones falsos, timbrado ficticio presentado como real, errores críticos o producción en rojo.

---

## 19. Instrucción de inicio

Comienza ahora:

1. Lee todo el contexto.
2. Audita Git, PRs y ramas.
3. Descubre y prueba Plugins, Skills, MCP y conectores.
4. Ejecuta baseline.
5. Define plan corto.
6. Crea la rama final.
7. Corrige diseño y menú.
8. Implementa multi-tenancy, permisos y auditoría.
9. Completa vertical slices funcionales.
10. Integra CRM Momentum en sandbox.
11. Ejecuta pruebas.
12. Corrige hasta verde.
13. Abre o actualiza PR.
14. Valida preview.
15. Fusiona a `main`.
16. Despliega producción.
17. Ejecuta smoke tests.
18. Entrega reporte final.

No vuelvas a detenerte tras documentación o pantallas. Continúa hasta que el producto esté realmente operativo, probado, actualizado en `main` y desplegado en producción.
