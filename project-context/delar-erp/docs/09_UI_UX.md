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
