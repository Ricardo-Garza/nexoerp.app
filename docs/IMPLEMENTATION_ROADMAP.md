# Roadmap de implementación — Nexo ERP

Mapa del menú objetivo (§6 del prompt de producción) contra el estado real. Regla: ningún módulo entra al menú sin vertical slice funcional (sin botones falsos).

## Estado por módulo

| Módulo | Estado v0.2.0 | Siguiente slice |
| --- | --- | --- |
| Dashboard | legacy funcional (KPIs demo) | KPIs reales del dominio + drill-down |
| Clientes / CRM | legacy Firestore + **CRM Momentum sandbox** (puerto+mock+contratos) | activar HTTP adapter con URL aprobada; dedupe UI |
| Ventas y Pedidos | legacy Firestore (cotización→pedido→remisión→factura interna) | reserva FEFO del dominio + snapshot de precios (Fase C) |
| Catálogo | ✅ dominio nuevo (57 SKUs seed, búsqueda/filtros/detalle) | fotos, fichas técnicas, alérgenos |
| Listas de Precios | ✅ dominio nuevo (vigencias, histórico, regla 40k) | flujo de aprobación de listas + simulador margen |
| Inventario por Lote | ✅ dominio nuevo (ledger, FEFO, calidad, recepción demo) | persistencia durable + transferencias/conteos |
| Almacenes | legacy | unificar con dominio de ubicaciones |
| Proveedores y Compras | legacy | requisición→OC→recepción→3-way match (Fase D) |
| Facturación | ❌ (fuera del menú) | adaptador PAC + MockPacAdapter + CFDI sandbox |
| Cobranza | parcial dentro de CRM legacy | CxC, antigüedad, complementos (Fase E) |
| Punto de Venta | ❌ (fuera del menú) | POS táctil con FEFO y cierre de caja (Fase C) |
| Bancos / Tesorería | legacy Firestore | conciliación + aplicación CxC/CxP |
| Producción | legacy tabs | fórmulas versionadas + batches + yield (Fase D) |
| Mantenimiento | legacy (tipos saneados este ciclo) | odómetro/horómetro auditado |
| Centro de Soporte | legacy (renombrado) | tickets con SLA y tenant |
| Contabilidad | legacy Firestore (pólizas/cuentas) | asientos automáticos desde eventos del dominio |
| Nómina / RRHH | legacy demo | expedientes + vacaciones devengadas |
| Configuración | ✅ nueva (calidad de datos + reglas comerciales + módulos auxiliares) | editor de roles visual + branding por tenant |
| Business Intelligence | legacy demo | asistente con permisos/tenant y citas de registros |
| ERP Web / Móvil | legacy demo | PWA + escaneo |
| E-Commerce | legacy demo | catálogo publicable por canal |

## Fases siguientes (orden recomendado)

1. **Persistencia durable + RLS** (desbloqueo Supabase) — convierte el dominio DELAR en operación real multiusuario.
2. **Fase C comercial**: cotización→pedido con reserva FEFO transaccional, POS, PDF/email por adaptador.
3. **Fase D abasto/producción/calidad**.
4. **Fase E finanzas + CFDI sandbox**.
5. **Control Center multi-tenant + BI asistente**.
