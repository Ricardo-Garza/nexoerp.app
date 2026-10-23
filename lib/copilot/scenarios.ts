/**
 * Escenarios guiados de «Explorar Nexo Intelligence». Cada paso es una PREGUNTA EN LENGUAJE
 * NATURAL que se ejecuta contra el motor real (mismo endpoint que el chat); no hay respuestas
 * cableadas. Todos los datos son simulados.
 */
export interface DemoScenario {
  id: string
  role: string
  title: string
  prompt: string
  description: string
  steps: string[]
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "direccion",
    role: "Dirección General",
    title: "¿Cómo va el negocio?",
    prompt: "¿Cómo va el negocio este año?",
    description: "Indicadores generales del año, variación contra el trimestre anterior, tendencia mensual y margen.",
    steps: ["¿Cómo va el negocio este año?", "Compara el trimestre actual con el anterior", "Grafica las ventas mensuales", "¿Cuál es nuestro margen bruto?"],
  },
  {
    id: "comercial",
    role: "Gerencia Comercial",
    title: "Mejores clientes y qué compran",
    prompt: "¿Cuáles son nuestros mejores clientes y qué productos compran?",
    description: "Ranking de clientes con importes y familia principal, concentración de ingresos y clientes que dejaron de comprar.",
    steps: ["¿Cuáles son nuestros mejores clientes y qué productos compran?", "¿Qué tres clientes concentran más ingresos?", "¿Qué clientes dejaron de comprar?"],
  },
  {
    id: "finanzas",
    role: "Finanzas",
    title: "Cobranza y facturas vencidas",
    prompt: "¿Quién nos debe más y qué facturas están vencidas?",
    description: "Saldos por cliente, facturas vencidas con su detalle y antigüedad de saldos.",
    steps: ["¿Quién nos debe más?", "¿Qué facturas están vencidas?", "Antigüedad de saldos"],
  },
  {
    id: "almacen",
    role: "Almacén",
    title: "Reabastecimiento",
    prompt: "¿Qué productos necesitan reabastecimiento?",
    description: "SKUs bajo su mínimo (con el criterio usado), inventario por almacén y mercancía sin movimiento.",
    steps: ["¿Qué productos necesitan reabastecimiento?", "¿Cuánto stock hay por almacén?", "¿Qué productos no tienen movimiento?"],
  },
  {
    id: "estrategia",
    role: "Análisis Estratégico",
    title: "Desempeño por categoría de cables",
    prompt: "Compara el desempeño por categoría de cables",
    description: "Comparación de familias entre periodos, participación por categoría y productos en crecimiento.",
    steps: ["Compara el desempeño por categoría de cables", "Muéstrame las ventas por categoría", "¿Qué productos aumentaron sus ventas?"],
  },
]
