# Soleil Wire en Nexo ERP — contexto del universo

## Qué es

Soleil Wire es una empresa de **distribución de cables especiales** configurada como
universo propio dentro de Nexo ERP (`org-soleilwire`). Sitio público de referencia:
https://www.soleilwire.net/. Este paquete contiene los datos fuente, sus conversiones
a Markdown y las imágenes de referencia del giro.

## Reglas duras de este universo

1. **No se inventan precios oficiales.** La lista `SOLEIL-BASE-2027` nace con las 86
   entradas sin precio (`precioUnitario: null`); la UI las muestra como "Sin precio /
   Pendiente" hasta que el cliente los capture o importe.
2. **No se inventan clientes reales.** Los 2 clientes y 2 oportunidades del paquete
   son demo (`origen: Demo`, razón social "Cliente ejemplo…") y se reemplazan al
   importar la cartera real.
3. **Nada se conecta a datos reales todavía.** CRM Momentum queda en modo de prueba
   (sandbox), el timbrado en adaptador simulado (`pac: "mock"`) y la IA apagada
   (BYOK listo, sin claves en el repositorio).
4. **Lenguaje del usuario final**: "empresa", "sistema", "cuenta", "empresa activa",
   "módulo", "configuración". Nunca "tenant" ni "Control Plane" en la interfaz.
5. **Panel Nexo** (`/admin`) es solo para `operaciones@nexo.com`. Los usuarios de
   Soleil Wire no lo ven ni reciben recomendaciones de entrar ahí.
6. Las imágenes de `imagenes_referencia/` son material interno del proyecto; no se
   publican en la interfaz ni se menciona su origen. El catálogo guarda `imagen_id`
   para vincular imágenes reales cuando el cliente las apruebe.

## Estructura del paquete

```
project-context/soleilwire/
├── CLAUDE.md                  ← este documento
├── README.md                  ← README original del paquete
├── data/                      ← fuentes de verdad (CSV/XLSX)
│   ├── Catalogo_Cables.csv         86 SKUs en 13 familias
│   ├── Lista_Precios.csv           lista SOLEIL-BASE-2027 sin precios
│   ├── Clientes_CRM.csv            2 clientes demo
│   ├── Oportunidades_CRM.csv       2 oportunidades demo
│   ├── Inventario_Inicial.csv      plantilla de existencias (vacía)
│   ├── manifest_imagenes.{csv,json}
│   └── SoleilWire_ERP_Import_Template.xlsx
├── markdown/                  ← conversiones MarkItDown de cada archivo
└── imagenes_referencia/       ← 16 PNG de referencia interna (no publicar)
```

## Cómo entra al sistema

- **Seed determinista**: `npm run seed:soleil` regenera
  `lib/domain/soleilwire/soleil-seed.json` desde `data/` (mismo CSV → mismo JSON,
  campos vacíos → `null`). El tenant se siembra en `lib/platform/seed-tenants.ts`.
- **Importación**: los CSV del paquete auto-mapean en el Centro de Importación
  (`/dashboard/import`) con las plantillas `productos`, `precios`, `clientes`,
  `oportunidades` e `inventario-inicial`.

## Configuración de la empresa (editable en Administración Nexo)

| Campo | Valor inicial |
| --- | --- |
| Nombre comercial | Soleil Wire |
| Giro | Distribución de cables especiales |
| Tipo de operación | Comercial / distribución |
| Moneda / Idioma / Tema | MXN / Español / Oscuro |
| Contacto | ventas@soleilwire.com · 81 1600 9380 |
| País / Estado | México / Nuevo León |
| Versión | Última estable (con historial por empresa) |
| Plantilla | distribucion-cables |

## Módulos

Activos: Dashboard, Clientes/CRM, Ventas, **Facturación y Remisiones**,
**Productos y Precios** (combina Catálogo + Listas de Precios),
**Inventario y Existencias** (combina Inventario + Lotes; eje bobina/rollo/serie,
sin caducidad como eje principal), Almacén, **Proveedores / Compras**,
Bancos/Tesorería, Contabilidad, **Reportes / BI**, **Soporte**, CRM Momentum
(sandbox), Centro de Importación.

Apagados por defecto (activables por empresa desde Administración Nexo):
Producción, Nómina / RRHH, Mantenimiento, Punto de Venta.

Los módulos combinados no eliminan los módulos globales: otras empresas (p. ej.
DELAR Foods) siguen usando Catálogo, Listas de Precios, Inventario y Lotes por
separado. Las etiquetas del menú se personalizan por empresa
(`ui.moduleLabels`), no en el catálogo global.

## Indicadores iniciales del dashboard

ventasMes, cotizacionesAbiertas, oportunidadesCrm, productosSinPrecio, stockBajo,
inventarioDisponible, facturasPendientes, actividadComercial — configurables en
`/dashboard/configuracion` (activar/desactivar/reordenar, con auditoría).

## Pendientes de negocio (no técnicos)

- Capturar/importar precios reales de la lista SOLEIL-BASE-2027.
- Reemplazar clientes/oportunidades demo con la cartera real.
- Cargar inventario inicial real por bobina/rollo/serie.
- Definir datos fiscales reales (RFC, régimen, domicilio) — hoy marcadores editables.
- Autorizar credenciales reales de CRM y, en su momento, PAC e IA (BYOK).
