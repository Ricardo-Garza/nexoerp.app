import { redirect } from "next/navigation"

/** La calidad de datos ahora vive como control interno dentro de Configuración (§6). */
export default function CalidadDatosRedirect() {
  redirect("/dashboard/configuracion")
}
