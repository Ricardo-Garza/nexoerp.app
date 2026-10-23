/**
 * Traduce códigos de error de Firebase Authentication a mensajes en español.
 * Mensajes deliberadamente genéricos donde revelar más facilitaría enumerar cuentas.
 */
const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Credenciales incorrectas. Verifica tu correo y contraseña.",
  "auth/wrong-password": "Credenciales incorrectas. Verifica tu correo y contraseña.",
  "auth/user-not-found": "Credenciales incorrectas. Verifica tu correo y contraseña.",
  "auth/invalid-email": "El correo electrónico no es válido.",
  "auth/missing-password": "Escribe tu contraseña.",
  "auth/missing-email": "Escribe tu correo electrónico.",
  "auth/user-disabled": "Esta cuenta está deshabilitada. Contacta al administrador de tu empresa.",
  "auth/too-many-requests": "Demasiados intentos fallidos. Espera unos minutos o restablece tu contraseña.",
  "auth/network-request-failed": "Error de conexión. Verifica tu internet e inténtalo de nuevo.",
  "auth/operation-not-allowed": "El acceso con correo y contraseña no está habilitado para este proyecto. Contacta a soporte.",
  "auth/unauthorized-domain": "Este dominio no está autorizado para iniciar sesión. Contacta a soporte.",
  "auth/invalid-api-key": "La configuración de autenticación no es válida. Contacta a soporte.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "La configuración de autenticación no es válida. Contacta a soporte.",
  "auth/configuration-not-found": "La autenticación no está configurada en el proyecto. Contacta a soporte.",
  "auth/app-not-authorized": "Esta aplicación no está autorizada para usar la autenticación. Contacta a soporte.",
  "auth/email-already-in-use": "Este correo ya está registrado. Intenta iniciar sesión.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/requires-recent-login": "Por seguridad, vuelve a iniciar sesión para continuar.",
  "auth/expired-action-code": "El enlace caducó. Solicita uno nuevo.",
  "auth/invalid-action-code": "El enlace no es válido o ya fue utilizado.",
  "auth/internal-error": "Error interno del servicio de autenticación. Inténtalo más tarde.",
}

export type AuthAction = "login" | "register" | "reset"

const DEFAULTS: Record<AuthAction, string> = {
  login: "No fue posible iniciar sesión. Inténtalo de nuevo.",
  register: "No fue posible crear la cuenta. Inténtalo de nuevo.",
  reset: "No fue posible enviar el correo. Inténtalo de nuevo.",
}

export function authErrorMessage(error: unknown, action: AuthAction = "login"): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : ""
  return MESSAGES[code] ?? DEFAULTS[action]
}
