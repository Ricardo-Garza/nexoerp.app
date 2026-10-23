import { normalizeText } from "../nlu/normalize"

/**
 * Barandales de seguridad previos a cualquier consulta. El texto del usuario es DATO,
 * nunca instrucción: no cambia reglas, no se ejecuta, no abre otros tenants y no puede
 * pedir escrituras. El copiloto es estrictamente de solo lectura.
 */
export type GuardKind = "injection" | "cross_tenant" | "mutation" | "secrets"

const INJECTION = /(ignora|olvida|omite|desobedece|salta(te)?)\s+(todas\s+)?(las\s+|tus\s+|esas\s+)?(instrucciones|reglas|indicaciones|restricciones)|system prompt|prompt del sistema|eres ahora|ahora eres|actua como|actuar como|actua como|finge (ser|que)|simula (ser|que eres)|pretend|haz de cuenta que eres|modo desarrollador|modo dios|jailbreak|developer mode|ignore (all )?(previous|prior)|nuevas instrucciones|a partir de ahora (eres|debes|responde)|(revela|muestra|imprime|dime) (tu|el) (prompt|configuracion|codigo fuente)|;\s*--|union\s+select|(drop|delete|truncate)\s+(table|from)|<\s*script|javascript:|\$\{|\{\{/
const SECRETS = /api[ _-]?key|contrasena|password|\btoken\b|variables? de entorno|\.env\b|credencial|secret|llave privada/
const CROSS_TENANT = /(otra|otras|todas las|cualquier) (empresa|empresas|compania|companias|organizacion|organizaciones)|otro tenant|todos los tenants|\btenant\b|delar foods|\bdelar\b|org-[a-z0-9-]+|datos de otro cliente de nexo|base de datos completa|toda la base de datos/
const MUTATION_VERB = /\b(elimina|eliminar|borra|borrar|crea|crear|emite|emitir|genera|generar|cancela|cancelar|modifica|modificar|actualiza|actualizar|edita|editar|registra|registrar|agrega|agregar|anade|inserta|insertar|paga|pagar|transfiere|transferir|cambia|cambiar|aprueba|aprobar|autoriza|autorizar|envia|enviar|manda|mandar|aplica|aplicar|condona|condonar|reembolsa|reembolsar|ajusta|ajustar)\b/
const MUTATION_OBJECT = /\b(cliente|clientes|factura|facturas|pedido|pedidos|pago|pagos|registro|registros|producto|productos|precio|precios|saldo|saldos|inventario|orden|ordenes|cotizacion|cotizaciones|oportunidad|oportunidades|usuario|usuarios|base de datos|datos|descuento|nota de credito|permiso|permisos|stock)\b/

const MUTATION_PRICE = /\b(sube|baja|aumenta|reduce|incrementa|disminuye|rebaja)\s+(el |los |las |un |una )?(precio|precios|descuento|costo|costos|limite de credito)\b/

export function checkGuardrails(question: string): GuardKind | null {
  const text = normalizeText(question)
  const rawLower = question.toLowerCase()
  if (INJECTION.test(rawLower) || INJECTION.test(text)) return "injection"
  if (SECRETS.test(text)) return "secrets"
  if (CROSS_TENANT.test(text)) return "cross_tenant"
  if (MUTATION_PRICE.test(text)) return "mutation"
  // «genera una gráfica», «muestra», «dame» no son escrituras: exigimos verbo + objeto de negocio
  if (MUTATION_VERB.test(text) && MUTATION_OBJECT.test(text) && !/\b(grafica|grafico|diagrama|reporte|resumen|csv|excel|tabla)\b/.test(text)) {
    // «sube/baja» + producto/precio es una orden; «ventas que subieron» no coincide por la conjugación
    return "mutation"
  }
  return null
}

export const REFUSALS: Record<GuardKind, { title: string; message: string }> = {
  injection: {
    title: "Solicitud no permitida",
    message: "No puedo seguir instrucciones que cambien mis reglas, revelen mi configuración o ejecuten comandos. Solo respondo consultas de negocio sobre los datos de la empresa activa.",
  },
  secrets: {
    title: "Información sensible",
    message: "No manejo ni muestro credenciales, llaves, tokens ni variables de entorno. Puedo ayudarte con ventas, clientes, inventario, cobranza y CRM.",
  },
  cross_tenant: {
    title: "Fuera de tu empresa",
    message: "Solo tengo acceso a la empresa activa (Soleil Wire · demo). No puedo consultar datos de otras empresas ni de la plataforma.",
  },
  mutation: {
    title: "Asistente de solo lectura",
    message: "Este asistente es de solo consulta: no crea, modifica ni elimina clientes, facturas, pedidos, pagos ni precios. Para operar usa el módulo correspondiente del ERP; yo puedo mostrarte los datos que necesitas antes de actuar.",
  },
}

/** Recorta y limpia texto del usuario antes de repetirlo en una respuesta. */
export function safeEcho(s: string, max = 40): string {
  return s.replace(/[^\p{L}\p{N} .\-]/gu, "").slice(0, max).trim()
}
