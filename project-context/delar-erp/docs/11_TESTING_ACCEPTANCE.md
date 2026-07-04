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
