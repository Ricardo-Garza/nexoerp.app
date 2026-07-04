# PROMPT DEFINITIVO DE EJECUCIÓN — DELAR ERP

Actúa como **principal engineer, arquitecto de ERP para industria alimentaria, product engineer, especialista en PostgreSQL/Supabase, seguridad SaaS, UX empresarial, QA automation y líder técnico de entrega**. Trabaja directamente dentro del repositorio real:

- Repositorio: `Ricardo-Garza/v0-flower-shop-erp-ricky`
- Aplicación pública actual: `https://v0-flower-shop-erp-ricky.vercel.app/`
- Rama con el contexto ya instalado: `claude/delar-erp-context-setup-t9m0k1`
- PR de contexto: `#1`
- Contexto canónico: `project-context/delar-erp/`

Tu misión es transformar de forma incremental, segura, comprobable y productiva el prototipo actual en un ERP especializado para **DELAR Foods**, distribuidor y posible fabricante/reempacador de salsas, aderezos, sazonadores, condimentos e ingredientes food-service.

No construyas una demo superficial, no imites visualmente a Odoo y no prometas “ser mejor que SAP/Oracle” mediante marketing. Debes producir un sistema que sea objetivamente mejor para esta operación por ajuste funcional, velocidad, trazabilidad, UX, automatización, seguridad y costo de operación.

---

## 0. Modo de trabajo obligatorio

Trabaja en modo autónomo con ciclos cortos de:

1. **Inspeccionar**.
2. **Planear el vertical slice mínimo**.
3. **Implementar**.
4. **Probar**.
5. **Verificar visualmente con Playwright**.
6. **Corregir**.
7. **Documentar**.
8. **Commit y push**.
9. **Revisar GitHub/Vercel**.
10. Repetir hasta completar el alcance del ciclo.

No te detengas para pedirme confirmación por decisiones reversibles o de implementación cotidiana. Detente únicamente cuando ocurra una de estas condiciones:

- falta una credencial imprescindible;
- se requiere una acción irreversible en producción;
- existe una contradicción de negocio que no puede resolverse mediante parametrización;
- se requiere un gasto, compra o alta de servicio;
- se pretende fusionar o desplegar a producción sin mi autorización explícita.

No expongas secretos, tokens, variables privadas, datos personales ni valores de credenciales en consola, commits, PRs, capturas o respuestas.

---

## 1. Preparación segura de Git

Antes de modificar código:

1. Ejecuta `git status`, identifica rama, remotos, upstream y cambios no comprometidos.
2. Sincroniza referencias remotas.
3. Verifica que la rama `claude/delar-erp-context-setup-t9m0k1` contenga el contexto y que el PR #1 siga sano.
4. **No fusiones PR #1 automáticamente**.
5. Crea una rama de implementación basada en esa rama, por ejemplo:

```text
claude/delar-erp-foundation-ab
```

6. Mantén los cambios de código en un PR separado y en borrador. Si GitHub permite un PR apilado, usa como base temporal `claude/delar-erp-context-setup-t9m0k1`; cuando el PR #1 sea fusionado, retargetea el PR de implementación hacia `main`.
7. Nunca hagas force-push destructivo sobre una rama compartida.
8. Usa commits pequeños, descriptivos y verificables.

---

## 2. Descubrimiento obligatorio de herramientas, Skills y conectores

Antes de trabajar, inspecciona las capacidades reales disponibles en esta sesión. No inventes nombres de herramientas ni asumas que una Skill está cargada.

### 2.1 Skills

Localiza y lee las Skills disponibles en los directorios de Claude y del proyecto. Prioriza las relacionadas con:

- desarrollo web y páginas;
- web artifacts/UI builder;
- Playwright y pruebas de navegador;
- MCP builder;
- ERP, business software o sistemas empresariales;
- PostgreSQL/Supabase;
- seguridad y testing.

Usa cada Skill solo cuando sea pertinente. El contexto de `project-context/delar-erp/` y la realidad del repositorio prevalecen sobre ejemplos genéricos de cualquier Skill.

### 2.2 Playwright MCP

Verifica si el servidor MCP de Playwright está realmente conectado en esta sesión. Haz una prueba no destructiva:

- abrir `https://example.com`;
- leer el título;
- cerrar la página.

Si Playwright MCP está disponible, úsalo como herramienta principal para inspección visual y pruebas de aceptación. Si no está disponible, registra el problema y usa Playwright desde el proyecto/CLI si ya está instalado. No modifiques la configuración global de Claude Desktop salvo que te lo solicite expresamente.

### 2.3 GitHub

Si existe conector/MCP/CLI de GitHub:

- lee el PR #1, checks, comentarios y mergeability;
- crea y actualiza el PR de implementación;
- publica un cuerpo de PR con alcance, pruebas, screenshots y riesgos;
- no fusiones automáticamente.

### 2.4 Vercel

Si existe conector/MCP/CLI de Vercel:

- identifica el proyecto correcto por repositorio y dominio;
- revisa deployments, logs de build y errores;
- verifica el preview de cada PR;
- consulta únicamente nombres y presencia de variables de entorno, nunca imprimas valores secretos;
- no cambies dominio, plan, protección, producción o variables sensibles sin autorización.

### 2.5 Base de datos/Supabase

Si existe MCP o CLI de Supabase/PostgreSQL:

- comienza en modo read-only;
- identifica proyecto, esquema y migraciones reales;
- aplica cambios únicamente mediante migraciones versionadas en el repositorio;
- no edites producción manualmente;
- no ejecutes `DROP`, truncados o migraciones destructivas sin respaldo y autorización.

### 2.6 Regla de evidencia

Cada vez que uses una herramienta externa, registra en `docs/IMPLEMENTATION_STATUS.md`:

- herramienta usada;
- propósito;
- resultado;
- limitación o error;
- siguiente acción.

---

## 3. Fuentes canónicas y orden de lectura

Lee por completo, no solo por encima, en este orden:

1. `project-context/delar-erp/README_FIRST.md`
2. `project-context/delar-erp/CLAUDE.md`
3. `project-context/delar-erp/MASTER_PROMPT_CLAUDE_CODE.md`
4. `project-context/delar-erp/markdown/README.md`
5. todos los archivos de `project-context/delar-erp/docs/`
6. todos los archivos de `project-context/delar-erp/data/`
7. sus conversiones de `project-context/delar-erp/markdown/`
8. `project-context/delar-erp/database/000_domain_blueprint.sql`
9. archivos de texto y manifests de `project-context/delar-erp/reference/`
10. imágenes y contactos visuales de `reference/` mediante visión o Playwright cuando sea útil
11. los tres videos en `reference/videos/` si ya fueron copiados

Los archivos Markdown convertidos sirven para búsqueda y lectura rápida; cuando exista discrepancia, el archivo original y la matriz de calidad de datos son la fuente de evidencia.

No modifiques archivos de contexto para “hacer que coincidan” con una implementación. Si detectas un error objetivo, documenta la corrección en un ADR o en la matriz de calidad y propón el cambio en un commit separado.

---

## 4. Auditoría inicial real — Fase A

Antes de implementar funcionalidades, inspecciona el repositorio completo y produce evidencia real.

### 4.1 Inspección técnica

Determina y documenta:

- framework, runtime y versiones;
- package manager según lockfile;
- estructura de rutas y componentes;
- autenticación y autorización;
- base de datos y esquema actual;
- storage, correo, analytics y servicios externos;
- variables de entorno referenciadas sin mostrar valores;
- configuración de Vercel;
- tests, lint, typecheck y build;
- mocks, datos locales, hardcodes y persistencia falsa;
- deuda técnica, riesgos de seguridad y dependencias obsoletas;
- relación entre repositorio, branch y deployment público.

### 4.2 Ejecución base

Usa el package manager existente. Ejecuta como mínimo:

- instalación reproducible;
- lint;
- typecheck;
- tests existentes;
- build de producción;
- auditoría de dependencias disponible sin aplicar upgrades masivos automáticamente.

No cambies de package manager ni regeneres lockfiles sin causa técnica documentada.

### 4.3 Baseline visual con Playwright

Levanta la aplicación local y usa Playwright para:

- recorrer login y navegación actual;
- identificar rutas y funcionalidades existentes;
- capturar screenshots baseline en escritorio y tablet;
- registrar errores de consola y red;
- detectar componentes rotos, textos de floristería y datos mock;
- comparar local contra el deployment público.

Guarda artefactos en una carpeta ignorada por Git o en la carpeta de artifacts del test runner, salvo capturas seleccionadas para el PR.

### 4.4 Documentos a crear/actualizar

Crea:

- `docs/CURRENT_STATE_AUDIT.md`
- `docs/TARGET_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/TEST_STRATEGY.md`
- `docs/SECURITY_MODEL.md`
- `docs/DECISIONS/0001-foundation.md`
- `docs/DECISIONS/0002-data-and-tenancy.md`

No entregues solo un plan. Después de la auditoría continúa con Fase B en el mismo ciclo, salvo bloqueo real.

---

## 5. Principios de arquitectura no negociables

1. No reescribas todo por preferencia personal. Conserva lo que sea correcto y moderniza incrementalmente.
2. Usa arquitectura modular por dominio, no carpetas gigantes por tipo técnico.
3. Todas las entidades operativas deben pertenecer a una organización y, cuando aplique, sucursal/almacén.
4. Autorización siempre server-side; la UI no es una frontera de seguridad.
5. Validación tipada en todas las entradas.
6. Operaciones críticas transaccionales e idempotentes.
7. Estados de documentos explícitos y transiciones validadas.
8. Auditoría append-only.
9. Inventario derivado de un ledger de movimientos; los saldos son reconstruibles.
10. Migraciones versionadas y seeds idempotentes.
11. Puertos/adaptadores para PAC/CFDI, correo, WhatsApp, bancos, marketplace, storage e IA.
12. Feature flags para módulos incompletos.
13. Evita microservicios prematuros; construye un monolito modular bien delimitado.
14. Accesibilidad, responsive y rendimiento forman parte de la definición de terminado.
15. No uses datos de producción reales para pruebas automáticas.

---

## 6. Vertical slice obligatorio — Fase B

Implementa una base productiva completa de extremo a extremo, no pantallas aisladas.

### 6.1 Rebranding y configuración empresarial

- Elimina referencias a floristerías.
- Usa una configuración central de empresa con valor inicial `DELAR Foods ERP` o `Nexo Foods ERP`, según lo que ya establezca el contexto.
- Actualiza metadatos, favicon, navegación, login y textos.
- Mantén arquitectura white-label/multiempresa.

### 6.2 Identidad, usuarios y roles

Implementa o fortalece:

- organización;
- sucursales;
- usuarios y membresías;
- roles y permisos granulares;
- alcance por sucursal y almacén;
- separación de captura, aprobación, liberación de calidad y administración;
- RLS si se usa Supabase/PostgreSQL.

Roles iniciales sugeridos, parametrizables:

- Superadministrador técnico;
- Administrador de empresa;
- Dirección;
- Ventas;
- Caja/POS;
- Compras;
- Almacén;
- Producción;
- Calidad;
- Finanzas/Cobranza;
- Consulta/Auditoría.

### 6.3 Catálogo normalizado

Distingue claramente:

- marca;
- familia/producto comercial;
- SKU/presentación;
- unidad de inventario;
- unidad de venta;
- empaque y piezas por caja;
- EAN de pieza;
- DUN de caja;
- tipo: reventa, fabricado, reempacado, maquilado, kit o servicio;
- impuestos;
- estado activo/inactivo;
- fotografías y documentos.

Carga el catálogo inicial de 57 SKUs mediante seed idempotente. No inventes EAN/DUN faltantes. Las discrepancias deben quedar marcadas como pendientes de validación.

### 6.4 Precios

Implementa:

- listas Menudeo y Mayoreo;
- vigencia desde/hasta;
- precio por pieza y por caja;
- derivación por piezas por caja con override permitido y auditado;
- reglas por cliente, canal, cantidad y volumen;
- regla de mayoreo histórica de MXN 40,000 como configuración, no hardcode disperso;
- simulador de precio que explique qué regla se aplicó;
- margen visible solo para roles autorizados.

Los precios del contexto son históricos y no deben mostrarse como “vigentes” sin una fecha/configuración explícita.

### 6.5 Inventario y lotes

Implementa:

- almacenes y ubicaciones;
- lote;
- proveedor y lote de proveedor;
- fabricación/recepción y caducidad;
- estado de calidad: pendiente, cuarentena, liberado, rechazado, bloqueado;
- movimientos inmutables;
- existencia disponible, reservada, cuarentena y bloqueada;
- recepción, transferencia, ajuste y conteo;
- FEFO para sugerencia de surtido;
- override de FEFO con permiso y motivo;
- alertas de caducidad configurables.

Ningún lote vencido, rechazado, bloqueado o en cuarentena puede reservarse o venderse.

### 6.6 UI empresarial mínima

Construye:

- shell y navegación por áreas;
- dashboard por rol;
- command palette/búsqueda global;
- catálogo con tabla, tarjetas, filtros y búsqueda;
- detalle de SKU con timeline;
- editor/visor de listas de precios;
- inventario por almacén y lote;
- centro de alertas;
- estados de carga, vacío, error y permisos.

La interfaz debe ser moderna, clara y rápida, no una copia de Odoo. Usa la Skill de páginas/web artifacts cuando esté disponible, pero integra el resultado al sistema real y a su design system.

---

## 7. Pruebas obligatorias para Fase B

### 7.1 Unitarias y de integración

Agrega pruebas para:

- conversiones y empaques;
- precio por pieza/caja;
- vigencia y prioridad de listas;
- regla mayorista;
- roles y permisos;
- aislamiento por organización;
- RLS cuando aplique;
- movimientos de inventario;
- idempotencia;
- FEFO;
- bloqueo por calidad/caducidad;
- seed ejecutado dos veces sin duplicar.

### 7.2 E2E con Playwright

Crea pruebas reproducibles para:

1. iniciar sesión con usuario de prueba;
2. navegar al catálogo;
3. buscar “Ranch” y visualizar presentaciones diferentes;
4. consultar Menudeo y Mayoreo;
5. recibir un lote de prueba;
6. verificar existencia por lote;
7. confirmar que un lote en cuarentena no sea asignable;
8. verificar responsive en desktop y tablet;
9. validar que no existan errores críticos de consola.

Usa datos de prueba aislados y cleanup seguro. Si el proyecto no cuenta con auth de prueba, crea una estrategia documentada y segura para CI.

### 7.3 Calidad visual

Con Playwright toma screenshots de las rutas principales y revisa:

- desbordamientos;
- texto cortado;
- contraste;
- responsive;
- estados vacíos;
- diálogos;
- navegación por teclado;
- consistencia de moneda, fechas y unidades.

Corrige defectos visuales antes de declarar el ciclo terminado.

---

## 8. Flujo comercial — Fase C

Solo después de que Fase B esté verde, implementa de forma incremental:

- CRM de clientes y direcciones;
- cotización → envío → aceptación → pedido;
- condiciones PUE/PPD y datos fiscales como modelo extensible;
- listas y descuentos con aprobación;
- reserva FEFO;
- surtido y entrega/pickup;
- devoluciones y disposición;
- cuentas por cobrar y seguimiento;
- PDF profesional versionado;
- envío por correo mediante adaptador;
- portal de aceptación/firma;
- POS táctil con lector, múltiples órdenes, pagos divididos, devolución y cierre de caja;
- cierre y diferencias auditadas.

Regla logística inicial parametrizable:

- entrega local sin costo desde MXN 800;
- días hábiles;
- horario 10:00–16:00;
- pedido con un día hábil de anticipación;
- Monterrey, Guadalupe, San Nicolás, San Pedro y Apodaca dentro de cobertura;
- pickup en Clavel 2499, Col. Moderna, 09:00–17:00.

No hardcodees estas reglas dentro de componentes.

---

## 9. Compras, producción y calidad — Fase D

Implementa después:

- solicitud de cotización y orden de compra;
- recepción parcial/total;
- tres vías: OC, recepción, factura;
- lotes y documentos de proveedor;
- cuarentena e inspección;
- fórmulas/BOM versionadas y confidenciales;
- escalado por rendimiento;
- orden de producción;
- consumo de materias primas por lote;
- producto terminado por lote;
- mermas, retrabajo y coproductos cuando aplique;
- costo estándar y real;
- especificaciones de calidad;
- liberación/rechazo;
- COA y alérgenos;
- trazabilidad hacia atrás y hacia adelante;
- simulacro de recall.

No asumas que DELAR fabrica todos los productos. Cada SKU debe indicar su estrategia de abastecimiento.

---

## 10. IA y automatización con control humano

Prepara una capa desacoplada de copiloto empresarial. Prioriza:

1. convertir mensajes de WhatsApp/email en borradores de pedido;
2. sugerir cliente, SKU, presentación, lista, entrega y cantidad;
3. leer cotizaciones/órdenes/facturas y generar un diff revisable;
4. alertar faltantes, caducidad, margen y anomalías;
5. recomendar reabastecimiento con explicación;
6. responder preguntas autorizadas sobre inventario y ventas;
7. redactar cotizaciones y seguimientos.

Reglas:

- IA propone; reglas deterministas validan; humano aprueba.
- Nunca permitas que un LLM publique contabilidad, libere calidad, ajuste inventario, pague, cambie precios o confirme pedidos sin autorización explícita.
- Registra prompt version, modelo, herramientas, evidencia, resultado y aprobador.
- Protege contra prompt injection en documentos y contenido externo.

Usa la Skill de MCP builder únicamente para diseñar integraciones seguras y tipadas cuando exista una necesidad real. No construyas MCPs por moda.

---

## 11. Seguridad mínima obligatoria

- RLS/aislamiento real por organización.
- RBAC server-side.
- Prevención de IDOR y mass assignment.
- Validación de archivos, tipos y tamaños.
- Storage privado con URLs firmadas cuando aplique.
- Protección XSS, CSRF según arquitectura, inyección y SSRF.
- Rate limits en endpoints sensibles.
- Secretos únicamente en proveedor seguro.
- Auditoría append-only con correlation ID.
- Redacción de datos sensibles en logs.
- Operaciones críticas con transacciones y locking/concurrencia.
- Dependabot/auditoría de dependencias sin upgrades masivos no revisados.
- Backups y restore documentados antes de producción.

Ejecuta una revisión de seguridad de los cambios antes de cerrar el PR.

---

## 12. Rendimiento y observabilidad

- Evita N+1 y payloads excesivos.
- Paginación server-side.
- Índices respaldados por queries reales.
- Instrumentación de errores y métricas sin filtrar datos sensibles.
- Correlation ID entre UI, API y base de datos.
- Web Vitals razonables.
- Bundle analysis si el proyecto lo soporta.
- Dashboard de salud técnica y runbook de incidentes.

No optimices a ciegas: mide antes y después.

---

## 13. GitHub, PR y Vercel en cada ciclo

Al finalizar cada vertical slice:

1. ejecuta lint, typecheck, tests y build;
2. ejecuta E2E Playwright local;
3. haz commit y push;
4. actualiza el PR borrador;
5. espera/revisa checks;
6. revisa el deployment preview de Vercel;
7. ejecuta un smoke test con Playwright sobre el preview;
8. revisa logs del navegador y del deployment;
9. corrige y repite hasta estar verde.

El cuerpo del PR debe incluir:

- objetivo;
- alcance;
- fuera de alcance;
- arquitectura/ADRs;
- migraciones;
- seguridad;
- pruebas y comandos;
- screenshots desktop/tablet;
- preview URL;
- riesgos;
- rollback;
- checklist de revisión.

No marques el PR como listo ni lo fusiones sin mi autorización.

---

## 14. Definición de terminado del primer ciclo

El primer ciclo no se considera terminado hasta que existan:

- auditoría técnica real;
- arquitectura objetivo documentada;
- rebranding sin referencias de floristería visibles;
- catálogo normalizado con seed inicial;
- listas Menudeo/Mayoreo históricas y parametrizadas;
- inventario por almacén/lote y ledger;
- estados de calidad y FEFO;
- RBAC/RLS mínimo;
- auditoría;
- UI integrada;
- pruebas unitarias/integración;
- E2E Playwright;
- build verde;
- preview Vercel Ready;
- smoke test exitoso en preview;
- PR borrador actualizado.

Si una integración externa no puede completarse por falta de credenciales, deja un adaptador funcional con fake explícito solo para desarrollo, contrato tipado, pruebas y documentación. No presentes un mock como integración terminada.

---

## 15. Formato de reporte al finalizar cada ciclo

Entrega un reporte compacto pero completo con:

1. rama y commits;
2. PR y preview;
3. qué implementaste;
4. archivos y migraciones clave;
5. herramientas/Skills/MCP usados;
6. comandos ejecutados y resultado;
7. pruebas y cobertura relevante;
8. pruebas Playwright y screenshots;
9. seguridad revisada;
10. problemas detectados;
11. decisiones y trade-offs;
12. pendientes y siguiente vertical slice;
13. bloqueos que requieran mi intervención.

No respondas con intención futura ni con una lista genérica. Empieza ahora inspeccionando el repositorio, las herramientas disponibles y todo `project-context/delar-erp/`. Continúa con la auditoría y la implementación de Fase B hasta cumplir la definición de terminado o encontrar un bloqueo real.
