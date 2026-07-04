# Conversiones a Markdown (generadas con MarkItDown)

Esta carpeta contiene las versiones Markdown de los archivos no-Markdown del paquete
`project-context/delar-erp/`, generadas con [MarkItDown](https://github.com/microsoft/markitdown) v0.1.6.

Los archivos originales (CSV, JSON, SQL, TXT, PS1) se conservan sin cambios en sus
carpetas de origen y siguen siendo la fuente de verdad para sembrado y scripts.
Estas conversiones existen solo para lectura y revisión de contexto.

## Mapa de conversión

| Original | Markdown generado |
| --- | --- |
| `START_HERE_DELAR_ERP.txt` | `markdown/START_HERE_DELAR_ERP.md` |
| `SHA256SUMS.txt` | `markdown/SHA256SUMS.md` |
| `data/brands_seed.csv` | `markdown/data/brands_seed.md` |
| `data/uom_seed.csv` | `markdown/data/uom_seed.md` |
| `data/product_catalog_seed.csv` | `markdown/data/product_catalog_seed.md` |
| `data/price_lists_seed.csv` | `markdown/data/price_lists_seed.md` |
| `data/data_quality_issues.csv` | `markdown/data/data_quality_issues.md` |
| `data/delivery_and_commercial_rules_seed.json` | `markdown/data/delivery_and_commercial_rules_seed.md` |
| `database/000_domain_blueprint.sql` | `markdown/database/000_domain_blueprint.md` |
| `scripts/prepare_reference_folders.ps1` | `markdown/scripts/prepare_reference_folders.md` |
| `reference/source-text/Salsas Custom Culinary.txt` | `markdown/reference/source-text/Salsas Custom Culinary.md` |
| `reference/source-text/Info para Marketplace.txt` | `markdown/reference/source-text/Info para Marketplace.md` |
| `reference/source_files_manifest.json` | `markdown/reference/source_files_manifest.md` |
| `reference/videos_manifest.json` | `markdown/reference/videos_manifest.md` |

## Notas

- Los archivos que ya eran Markdown (`CLAUDE.md`, `MASTER_PROMPT_CLAUDE_CODE.md`, `README_FIRST.md`,
  `DELAR_ERP_CONTEXT_CONSOLIDATED.md`, `docs/*.md`, `prompts/*.md`) no requieren conversión.
- Las imágenes de `reference/` (capturas ALPHA, Odoo, catálogo, contact sheets) no se convierten:
  MarkItDown sin backend de visión no extrae contenido útil de imágenes.
- `source_files_manifest.json` requirió forzar `-c utf-8 -m application/json` porque la
  autodetección de charset fallaba con caracteres acentuados.
- Se removió el BOM UTF-8 que MarkItDown deja en la primera celda de las tablas CSV.
- Integridad del paquete verificada: 94/94 checksums de `SHA256SUMS.txt` en OK antes de convertir.
