# Nexo Control Plane / Admin Ultra

Fecha: 2026-07-06. Ruta base: `/admin`. Guardado por `PlatformGuard`.

## Usuario maestro

`operaciones@nexo.com` es el super administrador operativo de Nexo, **por encima
de cualquier tenant**. Se reconoce por:

1. Allowlist de correo en `lib/platform/platform-admin.ts` (`PLATFORM_ADMIN_EMAILS`).
2. Opcionalmente, `users/{uid}.platformRole == "platform_admin"` o custom claim
   `platformAdmin == true`.

### Crear la cuenta de forma segura (sin contraseñas en el repo)

```bash
SEED_ADMIN_EMAIL=operaciones@nexo.com \
SEED_ADMIN_PASSWORD='<contraseña-segura>' \
npm run seed:firebase
```

El seed crea/verifica la cuenta en Firebase Auth y escribe su perfil de
plataforma. Si no se pasa contraseña, el script imprime instrucciones y no
escribe nada (degradación honesta). Nunca hay contraseñas hardcodeadas.

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/admin` | Panel: KPIs, salud del sistema, universos |
| `/admin/tenants` | Lista de empresas (tabla SAP) + crear empresa |
| `/admin/tenants/:id` | Detalle: módulos, diseño, fiscal, CRM, auditoría; entrar como soporte |
| `/admin/modules` | Catálogo de módulos y su madurez |
| `/admin/integrations` | Firebase, CRM, PAC, IA y su estado real |
| `/admin/audit` | Auditoría global de todos los universos |
| `/admin/imports` | Historial de importaciones de la plataforma |
| `/admin/support` | Tickets de soporte hacia Nexo |
| `/admin/releases` | Releases y lo que quedó realmente disponible |
| `/admin/ai` | Configuración de IA por cliente (BYOK) |

## Gestión de universos

Desde el detalle de cada tenant se puede:

- **Módulos**: activar/desactivar por empresa. Los módulos `planned` se muestran
  deshabilitados (no se venden como listos).
- **Diseño**: logo, color primario, tema.
- **Fiscal**: razón social, RFC, régimen, domicilio (timbrado `MockPacAdapter`).
- **CRM**: habilitar, URL, modo sandbox/producción, fuente maestra.
- **Auditoría**: últimos cambios administrativos del tenant.

Cada cambio genera un evento de auditoría (`tenants/{id}/auditEvents`).

## Entrar a un universo y regresar

- **Entrar como soporte**: botón "Entrar" en la lista o "Entrar como soporte" en
  el detalle. Cambia el tenant activo (impersonación) y lleva al ERP.
- **Indicador de tenant** (header): muestra el universo activo, permite cambiar
  de empresa y volver al Control Plane. Un badge "Soporte" avisa cuando el admin
  está impersonando.
- No se mezclan datos entre universos: el tenant activo determina qué colección
  se lee/escribe.

## Acceso desde el ERP

El sidebar del dashboard muestra un acceso destacado "Nexo Control Plane" solo
para admins de plataforma. Los usuarios normales no lo ven y, si navegan a
`/admin`, reciben un aviso de acceso restringido (no una pantalla en blanco).
