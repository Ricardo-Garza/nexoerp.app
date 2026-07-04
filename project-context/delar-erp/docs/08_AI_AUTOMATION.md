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
