# Capa de IA opcional (BYOK) — diseño

Estado: **diseño; no implementado.** El ERP funciona plenamente sin IA (§15.1 modalidad "desactivada").

## Principios (§15)

- Modalidades: BYOK (cliente aporta su API key de OpenAI/Anthropic vía adaptador), créditos administrados (futuro), o desactivada.
- **Seguridad de claves**: secreto cifrado en secret manager, nunca texto plano, nunca de vuelta al navegador (solo máscara), test de conexión server-side, rotación/revocación, aislamiento por tenant, auditoría sin registrar el valor, separación sandbox/producción.
- **Puerto `AIProviderPort`** con adaptadores por proveedor y pruebas mock (a implementar).
- **Guardrails**: respetar permisos y tenant, citar registros origen, separar hecho/inferencia/sugerencia, confianza, aprobación humana para acciones sensibles, herramientas allowlisted, límites/timeout, prompt versioning, protección contra prompt injection, redacción de PII, RAG aislado por tenant, sin entrenar ni compartir entre tenants.

## Por qué no está en este release

Requiere secret manager y decisión de proveedor/costos del propietario. Ninguna clave ni timbrado ficticio se presenta como real (§17).
