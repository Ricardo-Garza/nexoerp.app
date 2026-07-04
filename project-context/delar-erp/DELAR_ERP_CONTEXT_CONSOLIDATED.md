# DELAR ERP — contexto consolidado


---

## Archivo: `README_FIRST.md`

# DELAR ERP — paquete de contexto para Claude Code

Este paquete convierte el prototipo actual **Nexo ERP** en una plataforma operativa para una empresa que distribuye y puede fabricar salsas, aderezos, sazonadores, condimentos e ingredientes food-service.

## Objetivo real

No se busca copiar SAP, Oracle u Odoo. Se busca un ERP especializado que sea superior para esta operación concreta: menos clics, trazabilidad total, inventario por lote y caducidad, compras, ventas, POS, producción, calidad, costos, cobranza, entregas y automatización con IA bajo control humano.

## Cómo usarlo

1. Clona o abre en Claude Code el repositorio que despliega `https://v0-flower-shop-erp-ricky.vercel.app/`.
2. Copia esta carpeta completa dentro del repositorio como `project-context/delar-erp/`.
3. Copia también los tres videos originales a `project-context/delar-erp/reference/videos/` si los tienes disponibles localmente.
4. Abre Claude Code en la raíz del repositorio.
5. Selecciona el modelo de programación más capaz disponible y razonamiento alto.
6. Pega el contenido de `MASTER_PROMPT_CLAUDE_CODE.md`.
7. Permite que Claude inspeccione el repositorio antes de modificarlo. No le pidas que “haga todo de una vez” fuera del ciclo de verificación definido en el prompt.

## Orden de lectura obligatorio para Claude

1. `MASTER_PROMPT_CLAUDE_CODE.md`
2. `CLAUDE.md`
3. `docs/01_PRODUCT_VISION.md`
4. `docs/02_BUSINESS_CONTEXT.md`
5. `docs/03_FUNCTIONAL_SCOPE.md`
6. `docs/04_DOMAIN_MODEL.md`
7. `docs/05_DATABASE_BLUEPRINT.md`
8. `docs/06_WORKFLOWS.md`
9. `docs/07_RBAC_APPROVALS.md`
10. `docs/08_AI_AUTOMATION.md`
11. `docs/09_UI_UX.md`
12. `docs/10_SECURITY_AUDIT.md`
13. `docs/11_TESTING_ACCEPTANCE.md`
14. `docs/12_ROADMAP.md`
15. `docs/13_MIGRATION_DEPLOYMENT.md`
16. `docs/14_OPEN_QUESTIONS.md`
17. `docs/15_REFERENCE_EVIDENCE.md`
18. Archivos de `data/`

## Decisiones que ya quedan fijadas

- Idioma inicial: español de México.
- Zona horaria de negocio: `America/Monterrey`.
- Moneda base: MXN.
- Arquitectura web: preservar el stack compatible que ya exista; si el repositorio es Next.js/TypeScript, mantenerlo y endurecerlo.
- Base de datos objetivo preferente: PostgreSQL administrado mediante Supabase, con RLS real y migraciones versionadas.
- Despliegue web: Vercel.
- Modelo de inventario: libro mayor inmutable de movimientos, no un simple campo de existencia editable.
- Trazabilidad: lotes obligatorios para productos configurados, FEFO, caducidad, bloqueo de calidad y rastreo hacia atrás/hacia adelante.
- Dinero: `numeric/decimal`, nunca `float`.
- Operaciones críticas: idempotencia, auditoría y transacciones.
- IA: copiloto con confirmación humana; nunca publica, factura, paga, ajusta inventario o libera calidad sin autorización explícita.

## Importante sobre los datos

Las listas de precios incluidas están fechadas en 2025 y se consideran **datos históricos para sembrado y pruebas**, no precios vigentes. El sistema debe manejar vigencias, versiones y aprobación de listas. Las discrepancias detectadas están documentadas en `data/data_quality_issues.csv`.


---

## Archivo: `CLAUDE.md`

# Reglas permanentes del proyecto DELAR ERP

## Misión

Construir un ERP food-service industrial, mantenible y auditable sobre el repositorio actual. El producto debe servir a distribución, punto de venta, comercio B2B, inventarios por lote, producción de condimentos, calidad, compras, finanzas operativas y automatización asistida por IA.

## Forma de trabajo obligatoria

1. Inspecciona antes de editar.
2. Conserva lo que esté correcto; refactoriza por capas, no mediante reescritura impulsiva.
3. Antes de cada fase, documenta alcance, riesgos, archivos afectados y criterios de aceptación.
4. Implementa vertical slices completos: UI + dominio + persistencia + permisos + auditoría + pruebas.
5. Ejecuta lint, typecheck, unit tests, integration tests y build en cada hito.
6. No declares éxito con mocks visuales, botones sin acción, datos hardcodeados o tablas sin políticas.
7. No introduzcas secretos al repositorio.
8. No ejecutes cambios destructivos en producción.
9. Cuando falte un dato de negocio, conviértelo en configuración o registra una decisión pendiente; no inventes cifras silenciosamente.
10. Mantén un `docs/IMPLEMENTATION_STATUS.md` actualizado con hecho, pendiente, riesgos y evidencia.

## Estándares técnicos

- TypeScript estricto; evitar `any` y casts no justificados.
- Validación de entrada en frontera con esquemas tipados.
- Separación explícita entre UI, aplicación, dominio e infraestructura.
- Server-side authorization en cada operación; ocultar botones no sustituye permisos.
- RLS en tablas multiempresa y sensibles.
- UUID/ULID para identificadores internos; folios de negocio separados y legibles.
- Timestamps UTC; conversión a `America/Monterrey` en presentación/reglas de calendario.
- Cantidades y dinero con precisión decimal configurable.
- Movimientos de inventario y asientos contables son append-only; reversas mediante movimientos compensatorios.
- Toda transición de estado debe validar precondiciones.
- Operaciones externas con idempotency keys, retry seguro y outbox/event log.
- Archivos en storage privado con URLs firmadas y metadatos de auditoría.
- Accesibilidad por teclado, foco visible, contraste y etiquetas.

## Definition of Done

Una función está terminada solo si:

- satisface el flujo y criterios de aceptación;
- respeta permisos y RLS;
- genera auditoría;
- maneja errores y estados vacíos;
- tiene pruebas pertinentes;
- no rompe build ni pruebas existentes;
- está documentada;
- funciona con datos reales sembrados, no solo con placeholders.

## Prohibiciones

- No copiar la interfaz de Odoo.
- No usar una tabla genérica JSON para todo el dominio.
- No calcular existencias a partir de campos manualmente editables.
- No permitir stock negativo salvo política explícita y permiso especial.
- No permitir vender lotes bloqueados, vencidos o no liberados.
- No acoplar CFDI a un PAC específico; usar adaptador.
- No exponer service-role keys al cliente.
- No afirmar cumplimiento fiscal, sanitario o contable sin validación profesional.


---

## Archivo: `docs/01_PRODUCT_VISION.md`

# Visión de producto

## Propuesta

Unificar en una sola plataforma la operación comercial, logística, productiva y financiera de un negocio food-service que distribuye y eventualmente fabrica salsas, aderezos, sazonadores, condimentos e ingredientes.

## Principios

- **Especialización antes que amplitud vacía:** resolver con profundidad los flujos de alimentos, lotes, caducidad, empaques y producción.
- **Una sola fuente de verdad:** producto, lote, precio, cliente, proveedor y documento con identidades consistentes.
- **Libro mayor operativo:** inventario y contabilidad trazables mediante eventos/movimientos compensables.
- **Menos clics con más control:** defaults, automatización y búsqueda rápida sin perder aprobaciones.
- **Configuración, no forks:** reglas por organización, canal, almacén y cliente.
- **Explicable:** cada saldo, costo, precio y recomendación debe poder rastrearse.
- **Escalable:** comenzar con una empresa y quedar listo para sucursales, marcas, canales y compañías adicionales.

## Usuarios objetivo

- Dirección general/comercial.
- Ventas B2B y atención por WhatsApp.
- Cajero/POS.
- Compras.
- Almacén y reparto.
- Planeación/producción.
- Calidad.
- Finanzas, cuentas por cobrar/pagar y administración.
- Auditoría/soporte.

## KPIs iniciales

- Ventas y margen por día, canal, vendedor, cliente, familia y SKU.
- Pedidos por entregar y OTIF.
- Stock disponible, reservado, cuarentena, vencido y próximo a vencer.
- Rotación, días de inventario y merma.
- Fill rate y faltantes.
- Compra pendiente/atrasada.
- Rendimiento real vs estándar de producción.
- Lotes no liberados y desviaciones de calidad.
- Cartera vencida y días de cobranza.
- Caja por método de pago y diferencias.


---

## Archivo: `docs/02_BUSINESS_CONTEXT.md`

# Contexto del negocio

## Perfil operativo inferido de la evidencia

DELAR Foods comercializa productos food-service de múltiples marcas y presentaciones: Custom Culinary, La Pócima, Culinaire/Ventura Foods, INUSA, Ingredion y otras. El catálogo contiene salsas, aderezos, condimentos, sazonadores, empanizadores, consomés y materias primas.

La operación combina:

- menudeo y mayoreo;
- venta por pieza, caja y presentaciones de peso/volumen;
- atención por mensaje/WhatsApp;
- cotización y pedido anticipado;
- entrega local y recolección en almacén;
- POS y facturación;
- inventario por lote/caducidad;
- posible manufactura o desarrollo propio de condimentos.

## Reglas comerciales de referencia

- Lista Menudeo.
- Lista Mayoreo; material histórico indica compra mayor a MXN 40,000 en una sola exhibición.
- Posibles precios especiales por cliente, volumen, canal, contrato o promoción.
- La lista debe tener vigencia, moneda, impuestos y aprobación.
- Precios cargados en este paquete: referencia de 27-ene-2025; requieren validación antes de producción.

## Reglas logísticas de referencia

- Almacén/pickup: Clavel 2499, Col. Moderna.
- Atención/pickup: lunes a viernes, 09:00–17:00.
- Entrega: 10:00–16:00 en días hábiles.
- Entrega local sin costo a partir de MXN 800.
- Pedido con un día hábil de anticipación.
- Zonas declaradas: Monterrey, Guadalupe, San Nicolás, San Pedro y Apodaca hasta Paseo La Fe.
- Estas reglas deben ser configurables por fecha, zona, cliente y canal.

## Complejidades que el modelo debe resolver

- Mismo sabor en múltiples presentaciones.
- Peso neto, volumen comercial y empaque por caja no siempre equivalentes.
- EAN por unidad y DUN por caja.
- Productos de reventa frente a productos fabricados/reempacados.
- Unidades kg/g/L/mL/pieza/caja y conversiones controladas.
- Fechas de caducidad y FEFO.
- Precios históricos contradictorios entre documentos.
- Stock por ubicación, lote y estado de calidad.
- Costos de compra variables y costos de producción.
- Venta inmediata POS y venta B2B a crédito.
- CFDI PUE/PPD y condiciones de pago, mediante integración futura validada.


---

## Archivo: `docs/03_FUNCTIONAL_SCOPE.md`

# Alcance funcional objetivo

## 1. Plataforma y organización

- Multiempresa preparada desde el modelo; una organización activa inicialmente.
- Sucursales, almacenes, ubicaciones, cajas, canales y centros de costo.
- Usuarios, roles, permisos, aprobación y delegación temporal.
- Configuración fiscal/logística desacoplada.

## 2. Catálogo y PIM

- Marca, familia/sabor, producto y SKU/presentación.
- Tipo: reventa, fabricado, maquilado, reempacado, kit, servicio.
- UOM base, venta y compra; conversiones por SKU/empaque.
- Presentación, contenido neto, piezas por caja, palletización opcional.
- EAN, DUN, SKU interno, código de proveedor, UNSPSC/SAT cuando se valide.
- Imágenes, documentos, fichas técnicas, alérgenos, nutrición y etiquetado.
- Sustitutos, equivalentes y cross-sell.

## 3. Precios

- Listas por canal, cliente, moneda y vigencia.
- Precio unitario y de caja.
- Reglas por cantidad, importe, familia, margen mínimo y contrato.
- Promociones y cupones con límites.
- Simulación de margen antes de aprobar.
- Historial y aprobación de cambios.

## 4. CRM, ventas y POS

- Leads/contactos/clientes y múltiples direcciones.
- Cotización, versión, aceptación/firma, pedido, backorder, entrega, factura/cobro.
- POS táctil, barcode, múltiples órdenes, pago dividido, cuenta cliente, devolución y cierre.
- Reservas por lote y FEFO.
- Crédito, límite, términos y cartera.
- Plantillas PDF/email y portal de seguimiento.

## 5. Compras y proveedores

- Solicitud, RFQ, comparación, aprobación, PO y recepción.
- Proveedor-producto, lead time, MOQ, empaque y precio.
- Recepción parcial, tolerancias, lote/caducidad, cuarentena y devolución.
- Factura de proveedor y 3-way match preparado.

## 6. Inventarios y logística

- Ledger inmutable de movimientos.
- Disponible, reservado, comprometido, en tránsito, cuarentena y rechazado.
- Lotes, caducidad, FEFO/FIFO, ubicaciones y transferencias.
- Conteos cíclicos, inventario físico y ajustes aprobados.
- Reabastecimiento min/max, cobertura y sugerencia de compra.
- Picking, packing, shipping, rutas/ventanas y prueba de entrega.
- Recall y trazabilidad hacia atrás/adelante.

## 7. Producción y formulación

- Fórmulas/BOM versionadas y confidenciales.
- Componentes, sustitutos aprobados, escalado y redondeo.
- Operaciones, recursos, tiempos, capacidad y limpieza/cambio.
- Orden y batch de producción.
- Consumo real por lote, output, coproducto, merma, retrabajo y yield.
- Costeo estándar/real y variaciones.

## 8. Calidad e inocuidad

- Especificaciones por materia prima, empaque, proceso y producto terminado.
- Planes de muestreo, resultados, COA, adjuntos y firma.
- Cuarentena, liberación, rechazo, desviación, CAPA y hold.
- Campos configurables como pH, Brix, viscosidad, color, temperatura, peso neto y microbiología.
- Alérgenos y segregación.
- Retain samples y simulacro de recall.

## 9. Finanzas operativas

- Cuentas por cobrar/pagar.
- Caja/bancos y conciliación preparada.
- Impuestos configurables.
- Asientos de doble partida generados por eventos aprobados.
- Costos, margen, valuación y cierres por periodo.
- Integración CFDI/PAC como adaptador, no como lógica central.

## 10. E-commerce, marketplace y mensajería

- Catálogo publicable, disponibilidad, precio por canal y pedido.
- Conectores para WhatsApp, marketplaces y tienda.
- Inbox unificado y conversión asistida a cotización/pedido.
- SEO/etiquetas comerciales separados del PIM transaccional.

## Fuera de alcance inmediato, pero con arquitectura preparada

- Nómina completa.
- Mantenimiento industrial avanzado.
- WMS de robotización.
- Planeación MRP/APS de alta complejidad.
- Consolidación financiera multinacional.


---

## Archivo: `docs/04_DOMAIN_MODEL.md`

# Modelo de dominio

## Identidades principales

### Catálogo

- `ProductFamily`: concepto comercial/sabor, por ejemplo Ranch o Mango Habanero.
- `Product`: producto lógico por marca/familia.
- `SKU`: presentación vendible/comprable concreta.
- `Packaging`: relación pieza/caja/pallet y códigos EAN/DUN.
- `Uom` y `UomConversion`: unidad y conversión exacta con alcance.

### Inventario

- `Warehouse` → `Location`.
- `Lot`: SKU, lote proveedor/interno, fabricación, caducidad y estado de calidad.
- `InventoryMovement`: entrada/salida/transferencia/reserva/liberación/ajuste/producción.
- `StockProjection`: vista reconstruible agrupada por organización, ubicación, SKU, lote y estado.

### Comercial

- `Customer`, `Address`, `Contact`, `CreditProfile`.
- `PriceList`, `PriceRule`, `Promotion`.
- `Quote` → `SalesOrder` → `Allocation` → `Shipment` → `Invoice` → `Payment`.
- `PosSession`, `PosOrder`, `CashMovement`.

### Abasto

- `Vendor`, `VendorSKU`.
- `PurchaseRequest` → `PurchaseOrder` → `GoodsReceipt` → `VendorBill`.

### Manufactura

- `Formula` → `FormulaVersion` → `FormulaComponent`.
- `ProductionOrder` → `ProductionBatch`.
- `BatchConsumption`, `BatchOutput`, `YieldRecord`, `WasteRecord`.

### Calidad

- `QualitySpec`, `QualityPlan`, `QualityInspection`, `QualityResult`.
- `Disposition`: quarantine/released/rejected/conditional.
- `Deviation`, `Capa`, `RecallCase`.

### Finanzas y control

- `JournalEntry`, `JournalLine`.
- `ApprovalRequest`, `AuditEvent`, `OutboxEvent`, `Attachment`.

## Invariantes

1. Un SKU tiene una UOM base única; conversiones vigentes no pueden ser ambiguas.
2. Un movimiento confirmado no se edita ni elimina; se revierte con otro movimiento.
3. La suma del ledger determina stock; no existe “editar existencia”.
4. Un lote de venta obligatoria no puede quedar sin lote.
5. Un lote no liberado no puede asignarse a ventas ni consumo, salvo permiso y flujo de desviación.
6. Cantidad reservada no puede exceder cantidad utilizable.
7. Un documento confirmado conserva snapshot de precio, impuestos, condiciones y UOM.
8. Una fórmula liberada es inmutable; un cambio crea nueva versión.
9. Un batch terminado debe reconciliar consumos, outputs, merma y variación.
10. Un asiento confirmado cuadra débitos y créditos y no se edita.
11. Toda transición crítica registra actor, razón y correlation ID.
12. Todo registro transaccional pertenece a una organización.

## Estados sugeridos

- Quote: draft, sent, accepted, rejected, expired, cancelled.
- SalesOrder: draft, approved, confirmed, allocated, partially_shipped, shipped, closed, cancelled.
- PurchaseOrder: draft, submitted, approved, sent, partially_received, received, closed, cancelled.
- Lot quality: quarantine, pending, released, conditional, rejected, expired, recalled.
- ProductionOrder: draft, planned, released, in_progress, quality_hold, completed, closed, cancelled.
- Invoice: draft, issued, partially_paid, paid, overdue, cancelled.


---

## Archivo: `docs/05_DATABASE_BLUEPRINT.md`

# Blueprint de base de datos

El archivo `database/000_domain_blueprint.sql` es un mapa de entidades, no debe aplicarse ciegamente. Claude debe adaptarlo al stack y producir migraciones pequeñas, reversibles y probadas.

## Convenciones

- PK internas UUID.
- `organization_id` obligatorio en datos de negocio.
- `created_at`, `updated_at`, `created_by`, `updated_by` donde corresponda.
- `version` para optimistic locking en documentos.
- `numeric(20,6)` para cantidades; `numeric(20,4)` o política central para dinero.
- Códigos y folios de negocio con secuencias por organización/tipo.
- Soft delete solo en maestros; transacciones nunca se borran.
- JSONB únicamente para extensiones o snapshots, no para reemplazar relaciones centrales.

## Índices mínimos

- organización + estado + fecha en documentos.
- SKU/código/barcode normalizado.
- lote por SKU, expiración y calidad.
- ledger por SKU/lote/ubicación/fecha.
- búsqueda de cliente/proveedor por RFC, nombre y contacto.
- documentos por folio y external ID.
- auditoría por entidad/actor/fecha/correlation ID.

## RLS

- La sesión obtiene organizaciones permitidas desde membresías, no desde un `organization_id` enviado libremente por cliente.
- Usuario de almacén se restringe a ubicaciones asignadas cuando aplique.
- Fórmulas, costos y finanzas tienen políticas adicionales por permiso.
- Service-role solo en backend confiable y jobs; jamás en navegador.

## Funciones transaccionales prioritarias

- `post_inventory_movement`
- `reserve_stock_fefo`
- `release_reservation`
- `confirm_goods_receipt`
- `confirm_pos_sale`
- `reverse_pos_sale`
- `issue_production_materials`
- `receive_production_output`
- `change_lot_disposition`
- `post_journal_entry`

Cada función debe aceptar idempotency key, validar estado/permisos y devolver un resultado tipado.


---

## Archivo: `docs/06_WORKFLOWS.md`

# Flujos operativos

## Cotización a cobro

1. Seleccionar cliente/canal.
2. Resolver lista de precios y reglas vigentes.
3. Capturar SKU, cantidad y UOM; convertir a base.
4. Verificar disponibilidad y fecha prometida.
5. Calcular subtotal, descuento, impuesto, flete y margen.
6. Aprobar excepciones.
7. Enviar PDF/link y registrar evidencia.
8. Aceptar y convertir a pedido con snapshot.
9. Reservar FEFO; crear backorder si falta.
10. Pick/pack/ship o pickup.
11. Emitir documento fiscal mediante adaptador cuando esté configurado.
12. Registrar pago/cartera y cerrar.

## POS

1. Abrir sesión con fondo.
2. Escanear/buscar SKU y elegir presentación.
3. Seleccionar cliente opcional.
4. Aplicar precio autorizado.
5. Confirmar lote FEFO o asignación automática.
6. Cobrar efectivo/tarjeta/cuenta/mixto.
7. Confirmar transacción atómica: venta + inventario + pago + asiento.
8. Imprimir/enviar ticket con QR.
9. Devolución referenciada al ticket y disposición de inventario.
10. Cierre con conteo, diferencias y aprobación.

## Compra a disponibilidad

1. Sugerencia o solicitud de compra.
2. RFQ/comparación y aprobación.
3. PO con empaque/UOM/lead time.
4. Recepción parcial o total.
5. Captura de lote proveedor, caducidad y documentos.
6. Entrada a cuarentena.
7. Inspección y liberación/rechazo.
8. Disponibilidad o devolución.
9. Match con factura y pago.

## Producción por lote

1. Seleccionar fórmula/version liberada.
2. Definir cantidad objetivo y fecha.
3. Explosionar necesidades y reservar materias primas FEFO.
4. Liberar orden con check de materiales/calidad.
5. Emitir lotes a batch; registrar pesadas reales.
6. Registrar controles de proceso.
7. Recibir output, merma, retrabajo y muestras.
8. Crear lote terminado en cuarentena.
9. Inspección y liberación.
10. Calcular rendimiento y costo real.

## Recall

1. Abrir caso y bloquear lote(s).
2. Trazar ingredientes/proveedores hacia atrás.
3. Trazar clientes, pedidos, POS y envíos hacia adelante.
4. Cuantificar producido, en stock, vendido, devuelto y perdido.
5. Generar lista de contactos/acciones.
6. Registrar comunicaciones, recuperación y cierre.


---

## Archivo: `docs/07_RBAC_APPROVALS.md`

# Roles, permisos y aprobaciones

## Roles base

- `super_admin`: plataforma; no implica acceso silencioso a datos sensibles.
- `org_admin`: configuración de organización y usuarios.
- `director`: lectura ejecutiva y aprobaciones de alto nivel.
- `sales_manager`, `sales_rep`.
- `cashier`, `pos_supervisor`.
- `purchasing_manager`, `buyer`.
- `warehouse_manager`, `warehouse_operator`.
- `production_manager`, `production_operator`.
- `quality_manager`, `quality_analyst`.
- `finance_manager`, `ar_specialist`, `ap_specialist`.
- `auditor`: lectura y evidencia, sin operación.

## Permisos granulares de ejemplo

- `price.override`, `discount.approve`, `margin.view`.
- `stock.adjust.request`, `stock.adjust.approve`.
- `lot.release`, `lot.reject`, `lot.override_fefo`.
- `purchase.approve`, `vendor.change_terms`.
- `formula.view`, `formula.edit`, `formula.release`.
- `production.issue`, `production.close`.
- `pos.refund`, `pos.cash_difference.approve`.
- `invoice.issue`, `payment.apply`, `journal.post`.
- `audit.export`, `user.manage`.

## Matriz de segregación mínima

- Quien solicita un ajuste no lo aprueba cuando supera umbral.
- Quien captura resultado de calidad no libera su propia desviación crítica.
- Quien crea proveedor/cuenta bancaria no aprueba el primer pago.
- Quien modifica fórmula no libera esa misma versión sin segundo rol.
- Cajero no cambia precio ni anula después de cierre sin supervisor.

## Motor de aprobación

Debe soportar reglas por:

- tipo de documento;
- importe/margen/descuento;
- familia/SKU;
- proveedor/cliente de riesgo;
- almacén/sucursal;
- lote/calidad;
- rol y cadena de reemplazo;
- expiración y escalamiento.


---

## Archivo: `docs/08_AI_AUTOMATION.md`

# IA y automatización

## Casos prioritarios

### 1. Pedido conversacional

Entrada: “Mándame 4 cajas de ranch galón y 2 porrones de alitas para mañana”.

El asistente propone:

- cliente y dirección;
- SKU exacto y UOM;
- cantidades/cajas;
- lista de precios;
- disponibilidad;
- ventana de entrega;
- total y advertencias.

El usuario confirma antes de crear cotización/pedido.

### 2. Document intelligence

- Extraer líneas de OC/factura/COA.
- Comparar con documento del ERP.
- Resaltar diferencias y solicitar confirmación.
- Conservar documento, extracción, confianza y aprobador.

### 3. Inventario y compra

- Detectar riesgo de quiebre, exceso y caducidad.
- Proponer transferencias, promociones o compras.
- Explicar demanda, lead time, stock utilizable y supuestos.

### 4. Margen y precio

- Alertar cuando costo nuevo rompe margen.
- Simular precio por canal/presentación.
- Nunca publicar cambios sin flujo de aprobación.

### 5. Consultas seguras

- Preguntas naturales traducidas a consultas autorizadas.
- Plantillas/semantic layer, límites y auditoría.
- No permitir SQL libre desde navegador ni fuga entre organizaciones.

## Arquitectura

- `AiProvider` desacoplado.
- Herramientas deterministas con esquemas estrictos.
- Contexto derivado de datos autorizados.
- Redacción de PII/secrets.
- Registro de prompt version, modelo/proveedor, tool calls, usuario, aprobación y resultado.
- Evaluaciones offline con casos reales.

## Acciones que siempre requieren confirmación

- enviar comunicación externa;
- crear/confirmar pedido;
- publicar precio;
- ajustar o transferir stock;
- liberar/rechazar lote;
- emitir/cancelar CFDI;
- aplicar pago;
- publicar asiento;
- modificar fórmula.


---

## Archivo: `docs/09_UI_UX.md`

# Especificación UI/UX

## Diseño global

- App shell con sidebar colapsable y búsqueda global.
- Breadcrumbs y command palette.
- Centro de tareas/alertas.
- Tema claro y oscuro.
- Densidad cómoda/compacta por usuario.
- Fechas y moneda locales.

## Página de SKU

Encabezado: imagen, nombre, marca, presentación, SKU, EAN/DUN, estado.

Resumen: disponible, reservado, cuarentena, próximo a vencer, costo, precio, margen.

Tabs:

- General.
- Empaques y códigos.
- Precios.
- Proveedores.
- Inventario/lotes.
- Producción/fórmula, si aplica.
- Calidad/documentos.
- Contabilidad.
- Actividad/auditoría.

## Lista de inventario

- Agrupar por SKU, almacén, ubicación, lote y estado.
- Filtros persistentes.
- FEFO visible.
- Semáforos accesibles acompañados de texto.
- Drill-down hasta movimiento origen.

## POS

- Botones táctiles grandes, barcode y búsqueda tolerante.
- Categorías/favoritos.
- Carrito siempre visible.
- Teclado numérico y shortcuts.
- Operación rápida sin esconder stock, precio o cliente.
- Offline queue con identificadores locales e idempotencia, solo si el stack lo permite de forma segura.

## Dashboards por rol

- Dirección: ventas, margen, caja, stock, vencimiento, cartera y OTIF.
- Ventas: oportunidades, cotizaciones, pedidos y cobranza propia.
- Almacén: recepciones, picking, transferencias, conteos y lotes.
- Producción: plan, materiales, batches, rendimiento y hold.
- Calidad: inspecciones, lotes pendientes, desviaciones y recall.

## Antipatrones a evitar

- formularios gigantes sin secciones;
- modal dentro de modal;
- color como único indicador;
- acciones irreversibles sin confirmación;
- dashboards llenos de tarjetas sin decisión asociada;
- copiar la navegación de Odoo;
- ocultar errores con toast genérico.


---

## Archivo: `docs/10_SECURITY_AUDIT.md`

# Seguridad, auditoría y resiliencia

## Amenazas principales

- fuga entre organizaciones/sucursales;
- IDOR en documentos, archivos y folios;
- escalamiento de rol;
- modificación directa de precio/stock;
- duplicación por reintentos;
- carrera en reservas y POS;
- exposición de fórmulas/costos;
- archivos maliciosos;
- secretos en cliente/logs;
- acciones de IA sin autorización.

## Controles

- autorización backend y RLS;
- políticas deny-by-default;
- validación y normalización en frontera;
- CSP y protección XSS/CSRF acorde al framework;
- signed URLs y antivirus/validación de archivos cuando se incorpore upload externo;
- rate limits y protección de endpoints públicos;
- idempotency keys y unique constraints;
- transacciones y locking apropiado;
- audit log append-only;
- backups, PITR según plan y restore drills;
- ambientes separados dev/staging/prod;
- migrations con revisión y preview deployments.

## Audit event mínimo

- organization_id;
- actor/user/service;
- action;
- entity_type/entity_id;
- timestamp UTC;
- correlation_id/request_id;
- reason;
- before/after redactado o diff;
- source channel/device/IP/user-agent cuando aplique;
- approval reference;
- hash/metadata para archivos críticos.

## Retención y privacidad

Definir políticas formales antes de producción. Evitar almacenar datos innecesarios. Exportaciones y borrados de maestros deben respetar obligaciones fiscales y de auditoría; transacciones se anonimizan o restringen, no se eliminan arbitrariamente.


---

## Archivo: `docs/11_TESTING_ACCEPTANCE.md`

# Estrategia de pruebas y aceptación

## Pirámide

- Unitarias: dinero, UOM, reglas, estados, FEFO, costos.
- Integración: DB, RLS, funciones transaccionales, outbox.
- Contract: adapters de email, CFDI, mensajería, pagos.
- E2E: flujos críticos en navegador.
- Seguridad: permisos negativos, aislamiento y archivos.
- Migración: reconciliación de catálogos, saldos y documentos.

## Casos de aceptación esenciales

1. Crear familia Ranch y cuatro SKUs distintos sin duplicar identidad.
2. Comprar una caja y recibir piezas/base exactas según empaque.
3. Resolver precio Menudeo/Mayoreo por vigencia y regla, conservando snapshot.
4. Bloquear override que deja margen bajo; aprobarlo con rol y motivo.
5. Recibir producto por lote/caducidad en cuarentena y liberarlo.
6. Vender por FEFO excluyendo lote vencido/rechazado.
7. Procesar cotización → pedido → reserva → entrega → pago.
8. POS con pago dividido, ticket, devolución y cierre con diferencia.
9. Registrar PO parcial y mantener pendiente correctamente.
10. Transferir lote entre ubicaciones sin alterar total de organización.
11. Ajuste de inventario con solicitud/aprobación y movimiento compensatorio.
12. Producir lote terminado consumiendo múltiples lotes y calcular yield.
13. Lote terminado no vendible hasta liberación de calidad.
14. Recall muestra proveedor/ingredientes y clientes/documentos afectados.
15. Usuario de Ventas no ve fórmula ni costo restringido.
16. Usuario de otra organización no puede leer ni mutar registros por ID.
17. Reintentar el mismo pago/recepción no duplica efecto.
18. Build de Vercel funciona sin secretos cliente.
19. Seed puede ejecutarse dos veces sin duplicar.
20. Reporte de stock se reconcilia con el ledger.

## Calidad mínima del release piloto

- cero errores TypeScript;
- lint verde;
- pruebas críticas verdes;
- sin vulnerabilidades críticas conocidas en dependencias directas;
- RLS verificada con tests negativos;
- backup/restore documentado;
- logs y alertas mínimas;
- rollback de deployment y migración practicado;
- usuarios piloto capacitados con datos de prueba separados.


---

## Archivo: `docs/12_ROADMAP.md`

# Roadmap por vertical slices

## Fase 0 — auditoría y base

- diagnóstico del repo;
- rebranding configurable;
- arquitectura, auth/RBAC, RLS, auditoría;
- CI básico y entornos.

## Fase 1 — maestros, precios e inventario

- organización/almacenes;
- PIM y empaques;
- listas de precios;
- lotes, movimientos y stock;
- importación inicial.

## Fase 2 — ventas, POS y entrega

- clientes/cotizaciones/pedidos;
- reserva FEFO;
- POS, pagos, cierre y devolución;
- PDF/email;
- reglas de entrega/pickup.

## Fase 3 — compras y recepción

- proveedores/RFQ/PO;
- recepción parcial;
- cuarentena y factura proveedor;
- reabastecimiento.

## Fase 4 — producción y calidad

- fórmulas/versiones;
- batches, consumos, outputs, merma y yield;
- inspecciones, COA, liberación y recall.

## Fase 5 — finanzas e integraciones

- AR/AP;
- ledger contable;
- bancos/conciliación;
- adaptador CFDI/PAC;
- WhatsApp, marketplace y e-commerce.

## Fase 6 — inteligencia y optimización

- pedido conversacional;
- OCR/document matching;
- forecast y reabastecimiento;
- margen, caducidad y anomalías;
- consulta natural autorizada.

## Fase 7 — hardening y expansión

- carga, resiliencia, seguridad y DR;
- multi-sucursal;
- portal cliente/proveedor;
- white-label/multiempresa comercializable.

Cada fase termina con migración, pruebas, documentación, demo con datos reales anonimizados y aceptación del usuario operativo.


---

## Archivo: `docs/13_MIGRATION_DEPLOYMENT.md`

# Migración y despliegue

## Estrategia de datos

1. Inventariar fuentes: prototipo, hojas, Odoo/ALPHA, PDFs, catálogos, POS y archivos contables.
2. Definir data dictionary y reglas de identidad.
3. Staging tables por fuente.
4. Normalización y detección de duplicados.
5. Validación de UOM/empaques, precios, lotes y saldos.
6. Dry run con reportes de discrepancias.
7. Cutover con ventana, snapshot y rollback.
8. Reconciliar stock, cartera, proveedores, clientes y documentos abiertos.

No migrar historial innecesario sin estrategia. Puede mantenerse archivo de consulta read-only.

## Entornos

- Local: datos sintéticos.
- Preview por PR: DB aislada o schema/branch cuando el proveedor lo permita.
- Staging: integración y UAT.
- Production: acceso restringido, backups y observabilidad.

## Vercel

- Conservar el proyecto actual solo después de identificar repo/team correctos.
- Preview deployments por PR.
- Variables por ambiente.
- Functions con límites conocidos; procesos largos van a jobs/background worker.
- Health/readiness endpoints sin datos sensibles.
- Rollback documentado.

## Supabase/PostgreSQL

- Migraciones en repo.
- RLS y tests.
- Storage privado.
- Backups/PITR según criticidad.
- Jobs programados con patrón idempotente.
- Nunca usar service role desde componentes cliente.

## Integraciones

Toda integración usa:

- adapter interface;
- credentials por ambiente;
- idempotency/external IDs;
- retries con backoff;
- dead-letter/reconciliation queue;
- webhooks firmados;
- logs redactados.


---

## Archivo: `docs/14_OPEN_QUESTIONS.md`

# Preguntas pendientes — no deben bloquear los cimientos

Modelar como configuración o dejar decision record hasta obtener respuesta:

1. Nombre final del producto: Nexo Foods ERP, DELAR ERP u otro.
2. Razón social, RFC, régimen, certificados y PAC.
3. Qué artículos se fabrican, maquilan, reempacan o solo revenden.
4. Fórmulas, rendimientos, operaciones y parámetros reales.
5. Almacenes, ubicaciones, cajas, rutas y usuarios definitivos.
6. Política exacta de lotes/caducidad por SKU.
7. Métodos de valuación aprobados fiscalmente/contablemente.
8. Listas de precios vigentes y reglas actuales; las incluidas son históricas.
9. Clientes, proveedores, crédito, saldos y documentos abiertos.
10. Bancos, terminales y conciliación.
11. Marketplace/e-commerce/WhatsApp provider.
12. Impresoras, lectores, básculas y operación offline POS.
13. Pruebas de calidad reales y límites por producto.
14. Retención documental, privacidad y permisos sindicales/operativos.
15. Volumen: SKUs, usuarios, pedidos/día, líneas/día, almacenes y crecimiento.
16. Contabilidad completa dentro del ERP o integración con sistema externo en primera etapa.
17. Aprobadores y umbrales de descuento, compra, ajuste, merma y pago.
18. Datos EAN/DUN inconsistentes o faltantes que deben verificarse contra etiqueta/fabricante.

Claude no debe inventar estas respuestas. Debe crear defaults seguros, flags y pantallas de configuración, y registrar la deuda de datos.


---

## Archivo: `docs/15_REFERENCE_EVIDENCE.md`

# Evidencia de referencia analizada

## Prototipo público

- URL: `https://v0-flower-shop-erp-ricky.vercel.app/`
- Observado: Next.js generado/iniciado desde v0, título “Nexo ERP - Sistema de Gestión”, descripción todavía orientada a floristerías, `AuthProvider` y Vercel Analytics en el HTML público.
- Limitación: la URL pública no revela la implementación completa, esquema, permisos ni calidad. Claude debe inspeccionar el repositorio real.

## Propuesta ALPHA

Las capturas muestran precios/licenciamiento y diagramas de software administrativo/ERP para PyMES. Sirven como benchmark comercial y de cobertura, no como especificación ni diseño a copiar.

## Odoo demo

Las capturas y videos muestran:

- ficha de producto con venta/compra/POS;
- UOM, costo, precio e IVA;
- inventario por lote, caducidad y FEFO;
- categorías y cuentas;
- proveedores y lead time;
- POS, pago, recibo/QR, devolución y cierre;
- compras, recepción y lote;
- reporte de trazabilidad;
- cotización, términos, PDF y correo;
- cuentas por cobrar/reportes.

Se deben conservar capacidades útiles, pero rediseñar la experiencia para ser más simple y específica.

## Catálogo y precios

Se recibieron:

- lista menudeo;
- lista mayoreo con regla histórica > MXN 40,000;
- páginas de catálogo con presentaciones, EAN y DUN;
- imágenes de productos;
- texto de marketplace, zonas, horarios, teléfono y precios.

## Videos

Los tres videos originales no se duplican en este ZIP por tamaño. El paquete incluye contact sheets. Para un análisis profundo, copiar localmente:

- `ScreenRecording_12-18-2025 09-11-31_1.mp4`
- `ScreenRecording_12-18-2025 09-21-01_1.mp4`
- `ScreenRecording_12-18-2025 10-00-04_3.mp4`

## Criterio de precedencia

1. Datos confirmados actualmente por negocio.
2. Etiqueta/ficha técnica del fabricante.
3. Lista aprobada con vigencia.
4. Texto comercial recibido.
5. Capturas/demo histórica.

Las contradicciones no se resuelven silenciosamente; se registran y se validan.


---

## Archivo: `MASTER_PROMPT_CLAUDE_CODE.md`

# PROMPT MAESTRO DEFINITIVO — DELAR ERP

Actúa simultáneamente como arquitecto principal de software empresarial, ingeniero senior de producto, especialista en ERP de alimentos, diseñador de datos PostgreSQL, experto en seguridad SaaS y líder de implementación. Estás trabajando dentro del repositorio real que despliega el prototipo público `https://v0-flower-shop-erp-ricky.vercel.app/`.

Tu tarea no es producir una maqueta ni imitar Odoo. Debes transformar de manera incremental, verificable y segura el proyecto actual —hoy identificado públicamente como “Nexo ERP” y todavía descrito para floristerías— en un ERP especializado para DELAR Foods y operaciones equivalentes de salsas, aderezos, sazonadores, condimentos e ingredientes food-service.

## 1. Fuentes obligatorias

Lee por completo, en este orden:

1. `project-context/delar-erp/CLAUDE.md`
2. todos los archivos de `project-context/delar-erp/docs/`
3. todos los CSV/JSON de `project-context/delar-erp/data/`
4. `project-context/delar-erp/database/000_domain_blueprint.sql`
5. `project-context/delar-erp/reference/` como evidencia visual y funcional

Los documentos de contexto gobiernan el objetivo de producto. El repositorio real gobierna la verdad técnica actual. No supongas stack, autenticación, base de datos ni integraciones: compruébalos.

## 2. Resultado esperado

Construye una plataforma empresarial moderna, rápida y auditada que cubra progresivamente:

- catálogo multi-presentación y conversiones de unidad;
- marcas, familias, EAN/DUN/SKU y empaques;
- listas de precios por canal, cliente, volumen y vigencia;
- CRM, cotizaciones, pedidos, POS, devoluciones y cobranza;
- compras, proveedores, recepción y cuentas por pagar;
- inventario multi-almacén por ubicación, lote, caducidad y estado de calidad;
- FEFO, reabastecimiento, transferencias, conteos y ajustes aprobados;
- formulaciones/BOM, versiones, producción por lote, rendimientos, mermas y retrabajo;
- calidad, especificaciones, liberación, cuarentena, COA, alérgenos y recall;
- costos estándar y reales, margen, submayores y contabilidad de doble partida extensible;
- entregas locales, pickup, zonas, mínimo de compra y planeación;
- documentos PDF, correo, portal de cliente y firma/aceptación;
- auditoría completa y automatizaciones de IA con human-in-the-loop.

La meta “mejor que SAP/Odoo/Oracle” significa: mejor ajuste a esta operación, menor fricción, trazabilidad verificable, automatización útil y arquitectura sostenible. No significa prometer alcance ilimitado ni sacrificar controles empresariales.

## 3. Protocolo de ejecución — empieza ahora

### Fase A — auditoría sin cambios funcionales

1. Crea una rama segura, por ejemplo `feat/delar-erp-foundation`, salvo que ya estés en una rama de trabajo apropiada.
2. Inspecciona:
   - framework y versiones;
   - estructura de rutas y componentes;
   - autenticación y autorización;
   - proveedor de datos y esquema actual;
   - variables de entorno referenciadas, sin imprimir secretos;
   - integraciones, storage y analytics;
   - pruebas, lint, typecheck y build;
   - configuración de Vercel;
   - deuda técnica, mocks, hardcodes y riesgos.
3. Ejecuta los comandos existentes de instalación, lint, typecheck, tests y build. Registra resultados reales.
4. Crea:
   - `docs/CURRENT_STATE_AUDIT.md`
   - `docs/TARGET_ARCHITECTURE.md`
   - `docs/IMPLEMENTATION_STATUS.md`
   - `docs/DECISIONS/0001-foundation.md`
5. Presenta un resumen corto de hallazgos, pero no esperes aprobación salvo que exista riesgo irreversible, falta un secreto imprescindible o el repositorio no corresponda al deployment.

### Fase B — saneamiento y cimientos

Implementa el primer vertical slice productivo:

1. Rebranding configurable:
   - nombre por variable/configuración, valor inicial `Nexo Foods ERP`;
   - eliminar lenguaje de floristería;
   - metadatos, navegación, login, favicon y copy de dominio alimentario;
   - conservar la posibilidad de white-label/multiempresa.
2. Base de arquitectura:
   - módulos por dominio;
   - esquema de errores;
   - validación tipada;
   - autorización server-side;
   - audit logger;
   - idempotency helper;
   - feature flags/configuración de negocio.
3. Persistencia:
   - migraciones versionadas para organización, sucursales, almacenes, ubicaciones, usuarios/roles, unidades, marcas, productos, empaques, códigos, listas de precios, lotes, movimientos y auditoría;
   - RLS y políticas mínimas;
   - funciones transaccionales para movimientos de inventario;
   - seed idempotente usando `data/`.
4. UI funcional:
   - shell empresarial;
   - dashboard inicial;
   - catálogo con búsqueda y filtros;
   - detalle de SKU/presentación;
   - listas de precios con vigencia;
   - inventario por almacén/lote;
   - timeline de actividad.
5. Pruebas:
   - conversiones de unidad;
   - cálculo de precio;
   - política mayorista;
   - RLS/roles;
   - movimientos de inventario e idempotencia;
   - build de producción.

### Fase C — flujo comercial y POS

Después de que Fase B esté verde:

- cotización → aprobación/envío → pedido;
- cliente, direcciones, condiciones y lista de precios;
- POS táctil, lector de código, múltiples órdenes, pagos divididos, devolución y cierre de caja;
- reserva de stock por lote FEFO;
- documento PDF y envío por correo mediante adaptador;
- regla de entrega local configurable;
- auditoría y pruebas E2E.

### Fase D — compras, producción y calidad

Posteriormente:

- solicitud/orden de compra → recepción → lote → factura de proveedor;
- inspección y cuarentena;
- fórmula versionada y confidencial;
- orden/lote de producción;
- consumo de lotes de materias primas;
- salida de lote terminado, rendimiento, merma y costo;
- liberación de calidad y trazabilidad completa;
- simulacro de recall hacia atrás y hacia adelante.

No avances una fase si la anterior no tiene build, pruebas y criterios de aceptación verdes. Sí puedes dejar preparada la arquitectura y backlog.

## 4. Reglas funcionales obligatorias

- Distingue producto/familia de SKU/presentación. “Ranch” no es el mismo registro que “Ranch 460 g”, “Ranch pouch 2 kg”, “Ranch galón 3.4 kg” o “Ranch porrón 20 kg”.
- Modela pieza, caja, kg, g, L, mL, galón, bolsa, sobre, bote, cubeta, saco y porrón mediante UOM y empaques, no mediante texto libre.
- Un SKU puede tener EAN de pieza y DUN de caja.
- El precio de caja debe poder derivarse de piezas por caja, pero también admitir override versionado.
- Las listas Menudeo y Mayoreo incluidas son históricas. Mayoreo tiene como referencia una compra superior a MXN 40,000 en una sola exhibición; conviértelo en regla configurable y aprobable, no hardcode disperso.
- Regla logística de referencia: entrega local sin costo en días hábiles, 10:00–16:00, compra mínima MXN 800, pedido con un día hábil de anticipación, zonas Monterrey/Guadalupe/San Nicolás/San Pedro/Apodaca; pickup en Clavel 2499, Col. Moderna, 09:00–17:00. Todo debe ser parametrizable.
- No asumas que todos los artículos son fabricados. Soporta comprado para reventa, fabricado, maquilado, reempacado, kit y servicio.
- Lotes bloqueados, vencidos, en cuarentena o rechazados no son asignables a venta.
- FEFO debe sugerir lote; el override requiere permiso, motivo y auditoría.
- Inventario se deriva del ledger de movimientos. Los saldos son proyecciones/vistas reconstruibles.
- Toda devolución define disposición: reintegrable, cuarentena, merma o devolución a proveedor.
- Las fórmulas y costos sensibles requieren permisos restringidos y trazabilidad de acceso/cambio.
- CFDI, PAC, bancos, marketplace y WhatsApp se implementan mediante puertos/adaptadores; no acoples el núcleo.

## 5. Seguridad y calidad

- Aplica RLS real por `organization_id` y, cuando corresponda, por sucursal/almacén.
- Separa roles de captura, aprobación, liberación y administración.
- Auditoría append-only con actor, acción, entidad, antes/después redactado, motivo, IP/user-agent cuando sea aplicable y correlation ID.
- No almacenes contraseñas ni secretos propios.
- Evita XSS, inyección, IDOR, mass assignment, URLs de storage públicas y escalamiento horizontal de privilegios.
- Usa transacciones para reserva/confirmación, recepción, producción, ajuste, devolución y contabilización.
- Agrega controles de concurrencia u optimistic locking en documentos editables.
- Implementa estados explícitos y máquinas de transición comprobables.

## 6. UX

Diseña una experiencia de 2027, no una copia de ERP legado:

- búsqueda global y command palette;
- navegación por áreas: Inicio, Ventas, POS, Compras, Inventario, Producción, Calidad, Finanzas, CRM, E-commerce, Reportes, Configuración;
- vistas tabla y tarjetas cuando aporten valor;
- acciones rápidas con teclado;
- formularios progresivos con defaults inteligentes;
- estados, errores y bloqueos explicados en lenguaje operativo;
- responsive para escritorio/tablet; POS como PWA instalable y con cola offline segura cuando sea viable;
- modo claro/oscuro y accesibilidad WCAG práctica;
- dashboards por rol, no un tablero genérico saturado.

## 7. IA y automatización

Prepara una capa de copiloto desacoplada. Prioriza:

1. captura de pedido desde texto de WhatsApp/email;
2. sugerencia de SKU, cliente, precio y entrega;
3. lectura de órdenes/facturas con revisión humana;
4. alertas de caducidad, margen, faltantes y anomalías;
5. pronóstico/reabastecimiento con explicación;
6. consultas en lenguaje natural sobre datos autorizados;
7. borradores de cotización, cobranza y seguimiento.

Toda acción propuesta debe mostrar evidencia y diff antes de ejecutarse. Nunca permitas que un LLM publique movimientos contables, libere lotes, ajuste stock, envíe pagos o cambie precios sin aprobación determinista.

## 8. Entregables de cada ciclo

Al terminar cada ciclo entrega:

- resumen de lo implementado;
- archivos/migraciones modificados;
- decisiones técnicas;
- comandos ejecutados y resultados;
- pruebas agregadas;
- capturas o rutas para verificar;
- riesgos y deuda restante;
- siguiente vertical slice recomendado.

No me entregues solamente un plan. Empieza con la auditoría real del repositorio y continúa con Fase B siguiendo el protocolo. Solo detente cuando necesites una credencial, una decisión irreversible o exista una contradicción que no pueda parametrizarse.
