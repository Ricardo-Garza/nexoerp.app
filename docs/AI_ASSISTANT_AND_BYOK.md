# Asistente inteligente flotante + IA por cliente (BYOK)

Fecha: 2026-07-06.

## Asistente flotante

Componente: `components/assistant/floating-assistant.tsx`. Montado en el layout
del dashboard como ícono flotante siempre disponible.

Ayuda a (basado en reglas, **sin costo ni API key**):

- encontrar y navegar a módulos (búsqueda por nombre/descripción);
- explicar la pantalla actual ("¿qué puedo hacer aquí?");
- iniciar tareas (importar datos, abrir CRM);
- sugerir acciones y accesos rápidos.

Respeta el rol: a un admin de plataforma le ofrece abrir el Control Plane; a los
demás no. Cuando el tenant active IA (BYOK), el asistente puede delegar al
proveedor configurado; por ahora responde con reglas deterministas.

### Prueba E2E

`tests/e2e/nexo-control-plane.spec.ts` abre el asistente, busca "inventario" y
navega al módulo sugerido.

## IA por cliente (BYOK)

Ruta: `/admin/ai`. Configuración por tenant (`tenant.ai`):

- Activar/desactivar (kill switch).
- Proveedor: Ninguno / Claude (Anthropic) / OpenAI.
- Modelo permitido.
- Presupuesto mensual (USD).
- Estado de la API key **server-side** (con máscara).

### Seguridad de claves

Las API keys **nunca** se guardan en el frontend ni en el repositorio. El
documento del tenant solo almacena `hasServerKey: boolean` y metadatos
(proveedor, modelo, presupuesto). La clave real se configura por variable de
entorno / secret manager del lado servidor, con máscara y auditoría. El campo de
la UI es de solo lectura e indica si hay clave configurada.

### Pendiente honesto

El consumo real, límites por usuario/módulo, logs y alertas de presupuesto
quedan como siguiente fase (la estructura de datos y la UI de configuración ya
existen). Ver `docs/KNOWN_LIMITATIONS_AFTER_FIX.md`.
