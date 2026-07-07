## README_IMPORTACION
| seccion | instruccion |
| --- | --- |
| Orden recomendado | 1) Catálogo 2) Lista de precios 3) Clientes CRM 4) Oportunidades CRM 5) Inventario inicial 6) Movimientos/auditoría. |
| Campos obligatorios catálogo | sku, familia, producto, unidad\_venta, moneda, activo. |
| Precios | Puede iniciar vacío; llenar precio\_unitario y precio\_mayoreo cuando se apruebe la lista. |
| Carga masiva | Importar XLSX/CSV, validar en dry-run y corregir errores antes de guardar. |
| CRM | Clientes, contactos y oportunidades deben sincronizarse con CRM Momentum en modo sandbox hasta tener credenciales reales. |
| Personalización | Cada empresa puede configurar columnas visibles, vista de catálogo con foto/sin foto, indicadores principales, tema e idioma. |

## Catalogo_Cables
| sku | familia | subfamilia | producto | descripcion | voltaje | conductores | material | aislamiento | chaqueta\_armadura | norma | uso\_aplicacion | unidad\_venta | moneda | precio\_base | precio\_mayoreo | costo\_estimado | stock\_inicial | stock\_minimo | tiempo\_entrega\_dias | proveedor | imagen\_id | activo | notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SW-ARM-CTRL-MC-CHAQ | Armados | NaN | Cable de Control Armado tipo MC con Chaqueta | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-POT-MC-CHAQ | Armados | NaN | Cable de Potencia Armado tipo MC con Chaqueta | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-CTRL-TECK90 | Armados | NaN | Cable de Control Armado tipo Teck90 | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-POT-TECK90 | Armados | NaN | Cable de Potencia Armado tipo Teck90 | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-MV-5KV-ARM | Armados | NaN | Cable de Medio Voltaje 5 kV Armado | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-MV-15KV-ARM | Armados | NaN | Cable de Medio Voltaje 15 kV Armado | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-AL-MC-SIN-CHAQ | Armados | NaN | Cable de Aluminio Armado tipo MC sin Chaqueta | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-INST-MCHL | Armados | NaN | Cable de Instrumentación Armado tipo MC-HL | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-CTRL-MCHL | Armados | NaN | Cable de Control Armado tipo MC-HL | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-POT-MCHL | Armados | NaN | Cable de Potencia Armado tipo MC-HL | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-MV-5KV-MCHL | Armados | NaN | Cable de Medio Voltaje 5 kV Armado tipo MC-HL | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-ARM-MV-15KV-MCHL | Armados | NaN | Cable de Medio Voltaje 15 kV Armado tipo MC-HL | Cable especial armado para ambientes hostiles. | NaN | NaN | NaN | NaN | Armadura / chaqueta según especificación | NaN | Minería, industria, intemperie, áreas de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ARMADOS | SI | NaN |
| SW-MV-XLPE-CU-1C | Medio Voltaje | XLPE | XLPE 1 Conductor Cobre | Cable de media tensión para distribución eléctrica. | 5/15/25/35 kV | NaN | Cobre | XLPE | NaN | NaN | Distribución eléctrica industrial y comercial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MEDIO-VOLTAJE | SI | NaN |
| SW-MV-XLPE-AL-1C | Medio Voltaje | XLPE | XLPE 1 Conductor Aluminio | Cable de media tensión para distribución eléctrica. | 5/15/25/35 kV | NaN | Aluminio | XLPE | NaN | NaN | Distribución eléctrica industrial y comercial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MEDIO-VOLTAJE | SI | NaN |
| SW-MV-EPR-CU-1C | Medio Voltaje | EPR | EPR 1 Conductor Cobre | Cable de media tensión para distribución eléctrica. | 5/15/25/35 kV | NaN | Cobre | EPR | NaN | NaN | Distribución eléctrica industrial y comercial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MEDIO-VOLTAJE | SI | NaN |
| SW-MV-EPR-CU-3C | Medio Voltaje | EPR | EPR 3 Conductores Cobre | Cable de media tensión para distribución eléctrica. | 5/15 kV | NaN | Cobre | EPR | NaN | NaN | Distribución eléctrica industrial y comercial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MEDIO-VOLTAJE | SI | NaN |
| SW-MIN-DLO | Minería | NaN | Cable tipo DLO | Cable para operación minera y equipo móvil. | NaN | NaN | NaN | NaN | NaN | NaN | Minería móvil, cargadores, transportadores, taladros y bombas. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MINERIA | SI | NaN |
| SW-MIN-G | Minería | NaN | Cable tipo G | Cable para operación minera y equipo móvil. | NaN | NaN | NaN | NaN | NaN | NaN | Minería móvil, cargadores, transportadores, taladros y bombas. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MINERIA | SI | NaN |
| SW-MIN-G-GC | Minería | NaN | Cable tipo G-GC | Cable para operación minera y equipo móvil. | NaN | NaN | NaN | NaN | NaN | NaN | Minería móvil, cargadores, transportadores, taladros y bombas. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MINERIA | SI | NaN |
| SW-MIN-SHD-GC | Minería | NaN | Cable tipo SHD-GC | Cable para operación minera y equipo móvil. | 2/5/8/15 kV | NaN | NaN | NaN | NaN | NaN | Minería móvil, cargadores, transportadores, taladros y bombas. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MINERIA | SI | NaN |
| SW-CP-CTRL-TFN | Control/Potencia | Multiconductor | Cable de control TFN PVC/Nylon | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-CP-CTRL-THHN | Control/Potencia | Multiconductor | Cable de control THHN o THWN-2 PVC/Nylon | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-CP-CTRL-BLINDADO | Control/Potencia | Multiconductor | Cable de control blindado TFN PVC/Nylon | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-CP-CTRL-FHHN | Control/Potencia | Multiconductor | Cable de control blindado FHHN o THWN-2 PVC/Nylon | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-CP-CTRL-FREP | Control/Potencia | Multiconductor | Cable de control FR-EP XHHW-2 CPE | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-CP-POT-THHN | Control/Potencia | Multiconductor | Cable de potencia THHN o THWN-2 PVC/Nylon | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-CP-POT-XLP | Control/Potencia | Multiconductor | Cable de potencia XLP XHHW-2 PVC/Nylon | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-CP-POT-FREP | Control/Potencia | Multiconductor | Cable de potencia FR-EP XHHW-2 CPE | Cable multiconductor de control o potencia. | 600 V | NaN | Cobre | NaN | NaN | NEC / UL según especificación | Trabajo ligero o pesado, charolas y áreas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-CONTROL-POTENCIA | SI | NaN |
| SW-REN-H1Z2Z2-K | Renovable | NaN | Cable fotovoltaico tipo H1Z2Z2-K | Producto para instalaciones solares/eólicas. | NaN | NaN | NaN | NaN | NaN | NaN | Instalación solar. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-RENOVABLE | SI | NaN |
| SW-REN-PV-WIRE-UL | Renovable | NaN | Cable fotovoltaico PV Wire con UL | Producto para instalaciones solares/eólicas. | NaN | NaN | NaN | NaN | NaN | NaN | Instalación solar con norma UL. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-RENOVABLE | SI | NaN |
| SW-REN-MC4 | Renovable | NaN | Conectores MC4 | Producto para instalaciones solares/eólicas. | NaN | NaN | NaN | NaN | NaN | NaN | Conexión solar. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-RENOVABLE | SI | NaN |
| SW-REN-EOLICO-XHHW | Renovable | NaN | Cable monopolar de aluminio tipo XHHW 600 V | Producto para instalaciones solares/eólicas. | NaN | NaN | NaN | NaN | NaN | NaN | Instalación eólica. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-RENOVABLE | SI | NaN |
| SW-REN-MV-35KV | Renovable | NaN | Cable de media tensión 35 kV | Producto para instalaciones solares/eólicas. | NaN | NaN | NaN | NaN | NaN | NaN | Conexión de media tensión en proyectos renovables. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-RENOVABLE | SI | NaN |
| SW-MONO-THHN-THWN-2 | Monopolares | NaN | Cable monopolar THHN THWN 2 | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-MONO-XHHW-2 | Monopolares | NaN | Cable monopolar XHHW 2 | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-MONO-RHW-2-RHH-USE-2 | Monopolares | NaN | Cable monopolar RHW 2 RHH USE 2 | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-MONO-EPR-XL-CPE | Monopolares | NaN | Cable monopolar EPR XL CPE | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-MONO-PROTECCION-CATODICA | Monopolares | NaN | Cable monopolar PROTECCION CATODICA | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-MONO-AL-XHHW-2 | Monopolares | NaN | Cable monopolar AL XHHW 2 | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-MONO-AL-RHH-RHW-USE-2 | Monopolares | NaN | Cable monopolar AL RHH RHW USE 2 | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-MONO-AL-THHN | Monopolares | NaN | Cable monopolar AL THHN | Cable monopolar para aplicación industrial. | NaN | 1.0 | NaN | NaN | NaN | NaN | Conductos, canalizaciones y uso industrial. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-MONOPOLARES | SI | NaN |
| SW-AT-SFF2-SRG-150 | Alta Temperatura | NaN | Cable alta temperatura SFF2 SRG 150 | Cable para conexión de alta temperatura. | NaN | NaN | NaN | NaN | NaN | NaN | Aplicaciones de temperatura 150°. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALTA-TEMP | SI | NaN |
| SW-AT-SF2-SRG-200 | Alta Temperatura | NaN | Cable alta temperatura SF2 SRG 200 | Cable para conexión de alta temperatura. | NaN | NaN | NaN | NaN | NaN | NaN | Aplicaciones de temperatura 200°. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALTA-TEMP | SI | NaN |
| SW-AT-SRK-200 | Alta Temperatura | NaN | Cable alta temperatura SRK 200 | Cable para conexión de alta temperatura. | NaN | NaN | NaN | NaN | NaN | NaN | Aplicaciones de temperatura 200°. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALTA-TEMP | SI | NaN |
| SW-AT-FEB-200 | Alta Temperatura | NaN | Cable alta temperatura FEB 200 | Cable para conexión de alta temperatura. | NaN | NaN | NaN | NaN | NaN | NaN | Aplicaciones de temperatura 200°. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALTA-TEMP | SI | NaN |
| SW-AT-TGGF-250 | Alta Temperatura | NaN | Cable alta temperatura TGGF 250 | Cable para conexión de alta temperatura. | NaN | NaN | NaN | NaN | NaN | NaN | Aplicaciones de temperatura 250°. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALTA-TEMP | SI | NaN |
| SW-AT-MGT-450-538 | Alta Temperatura | NaN | Cable alta temperatura MGT 450 538 | Cable para conexión de alta temperatura. | NaN | NaN | NaN | NaN | NaN | NaN | Aplicaciones de temperatura 450° a 538°. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALTA-TEMP | SI | NaN |
| SW-IEC-H07 | Norma IEC | NaN | Cable con Norma IEC H07 | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-IEC-H05 | Norma IEC | NaN | Cable con Norma IEC H05 | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-IEC-YSLY-JZ | Norma IEC | NaN | Cable con Norma IEC YSLY-JZ | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-IEC-YSLCY-JZ | Norma IEC | NaN | Cable con Norma IEC YSLCY-JZ | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-IEC-RV-K | Norma IEC | NaN | Cable con Norma IEC RV-K | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-IEC-VY-K | Norma IEC | NaN | Cable con Norma IEC VY-K | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-IEC-H07RN-F | Norma IEC | NaN | Cable con Norma IEC H07RN-F | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-IEC-VFD | Norma IEC | NaN | Cable con Norma IEC VFD | Cable con normativa internacional IEC. | NaN | NaN | NaN | NaN | NaN | IEC | Control, fuerza y potencia según aplicación. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-IEC | SI | NaN |
| SW-AL-XHHW-2 | Aluminio | NaN | Cable de aluminio XHHW-2 | Cable de aluminio para conductos, canalizaciones, vía aérea o enterramiento directo. | NaN | NaN | Aluminio | NaN | NaN | NaN | Aplicaciones eléctricas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALUMINIO | SI | NaN |
| SW-AL-RHW-RHH-USE-2 | Aluminio | NaN | Cable de aluminio RHW-2/RHH/USE-2 | Cable de aluminio para conductos, canalizaciones, vía aérea o enterramiento directo. | NaN | NaN | Aluminio | NaN | NaN | NaN | Aplicaciones eléctricas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALUMINIO | SI | NaN |
| SW-AL-MC-FEEDER-XHHW-2 | Aluminio | NaN | Cable MC Feeder Cable XHHW-2 | Cable de aluminio para conductos, canalizaciones, vía aérea o enterramiento directo. | NaN | NaN | Aluminio | NaN | NaN | NaN | Aplicaciones eléctricas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALUMINIO | SI | NaN |
| SW-AL-FOTOVOLTAICO-XLP | Aluminio | NaN | Cable de aluminio fotovoltaico XLP | Cable de aluminio para conductos, canalizaciones, vía aérea o enterramiento directo. | NaN | NaN | Aluminio | NaN | NaN | NaN | Aplicaciones eléctricas industriales. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-ALUMINIO | SI | NaN |
| SW-PLAN-BOMBA-SUMERGIBLE | Planos | NaN | Cable para bomba sumergible | Cable plano para aplicación específica. | NaN | NaN | NaN | NaN | NaN | NaN | Bombas sumergibles, grúas viajeras o sistemas flexibles. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-PLANOS | SI | NaN |
| SW-PLAN-GRUA-FESTOON | Planos | NaN | Cable para grúa viajera festoon | Cable plano para aplicación específica. | NaN | NaN | NaN | NaN | NaN | NaN | Bombas sumergibles, grúas viajeras o sistemas flexibles. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-PLANOS | SI | NaN |
| SW-INS-PAR-TRIADA-PVC-300V | Instrumentación | NaN | Par o Triada Simple PVC no blindado | Cable de instrumentación para construcciones y aplicaciones especiales. | 300 V | NaN | NaN | NaN | NaN | NaN | Instrumentación y control. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INSTRUMENTACION | SI | NaN |
| SW-INS-MULTIPLE-PARES-PVC-BG-300V | Instrumentación | NaN | Múltiple pares PVC con blindaje general | Cable de instrumentación para construcciones y aplicaciones especiales. | 300 V | NaN | NaN | NaN | NaN | NaN | Instrumentación y control. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INSTRUMENTACION | SI | NaN |
| SW-INS-MULTIPLE-PARES-PVC-BI-BG-300V | Instrumentación | NaN | Múltiple pares PVC con blindaje individual y general | Cable de instrumentación para construcciones y aplicaciones especiales. | 300 V | NaN | NaN | NaN | NaN | NaN | Instrumentación y control. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INSTRUMENTACION | SI | NaN |
| SW-INS-MULTIPLE-TRIADAS-PVC-BI-BG-300V | Instrumentación | NaN | Múltiple triadas PVC con blindaje individual y general | Cable de instrumentación para construcciones y aplicaciones especiales. | 300 V | NaN | NaN | NaN | NaN | NaN | Instrumentación y control. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INSTRUMENTACION | SI | NaN |
| SW-INS-MULTIPLE-PARES-TFN-BG-600V | Instrumentación | NaN | Múltiple pares TFN PVC/Nylon con blindaje general | Cable de instrumentación para construcciones y aplicaciones especiales. | 600 V | NaN | NaN | NaN | NaN | NaN | Instrumentación y control. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INSTRUMENTACION | SI | NaN |
| SW-INS-MULTIPLE-PARES-TFN-BI-BG-600V | Instrumentación | NaN | Múltiple pares TFN PVC/Nylon con blindaje individual y general | Cable de instrumentación para construcciones y aplicaciones especiales. | 600 V | NaN | NaN | NaN | NaN | NaN | Instrumentación y control. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INSTRUMENTACION | SI | NaN |
| SW-INS-MULTIPLE-TRIADAS-THHN-BI-BG-600V | Instrumentación | NaN | Múltiple triadas THHN PVC/Nylon con blindaje individual y general | Cable de instrumentación para construcciones y aplicaciones especiales. | 600 V | NaN | NaN | NaN | NaN | NaN | Instrumentación y control. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INSTRUMENTACION | SI | NaN |
| SW-FLEX-SOOW | Flexibles | NaN | Cable flexible SOOW | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-FLEX-SEO | Flexibles | NaN | Cable flexible SEO | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-FLEX-ST | Flexibles | NaN | Cable flexible ST | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-FLEX-DLO | Flexibles | NaN | Cable flexible DLO | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-FLEX-JUMPER | Flexibles | NaN | Cable flexible JUMPER | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-FLEX-PORTA-ELECTRICO | Flexibles | NaN | Cable flexible PORTA ELECTRICO | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-FLEX-RVK | Flexibles | NaN | Cable flexible RVK | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-FLEX-STAGE | Flexibles | NaN | Cable flexible STAGE | Cable flexible para aplicaciones móviles o ambientes exigentes. | NaN | NaN | Cobre / cobre estañado | EPR/PE/PVC/XLP según especificación | NaN | NaN | Aplicaciones móviles, portátiles, industriales o de escenario. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-FLEXIBLES | SI | NaN |
| SW-IND-RHHW | Industriales | NaN | Cable industrial RHHW | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-XHHW | Industriales | NaN | Cable industrial XHHW | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-THW-LS | Industriales | NaN | Cable industrial THW LS | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-RWU90 | Industriales | NaN | Cable industrial RWU90 | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-CPC | Industriales | NaN | Cable industrial CPC | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-THHN | Industriales | NaN | Cable industrial THHN | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-LSZH | Industriales | NaN | Cable industrial LSZH | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-USE-2 | Industriales | NaN | Cable industrial USE 2 | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-SIS | Industriales | NaN | Cable industrial SIS | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |
| SW-IND-FOTOVOLTAICOS | Industriales | NaN | Cable industrial FOTOVOLTAICOS | Cable industrial de alto rendimiento. | NaN | NaN | Cobre o aluminio | PVC/EPR/XLP/Hypalon/HMWPE según especificación | NaN | NaN | Aplicaciones industriales de alta exigencia. | m | MXN | NaN | NaN | NaN | NaN | NaN | NaN | NaN | SW-CAT-INDUSTRIALES | SI | NaN |

## Lista_Precios
| sku | lista\_precio | canal | moneda | precio\_unitario | unidad | precio\_mayoreo | cantidad\_min\_mayoreo | vigencia\_inicio | vigencia\_fin | activo | notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SW-ARM-CTRL-MC-CHAQ | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-POT-MC-CHAQ | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-CTRL-TECK90 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-POT-TECK90 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-MV-5KV-ARM | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-MV-15KV-ARM | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-AL-MC-SIN-CHAQ | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-INST-MCHL | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-CTRL-MCHL | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-POT-MCHL | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-MV-5KV-MCHL | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-ARM-MV-15KV-MCHL | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MV-XLPE-CU-1C | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MV-XLPE-AL-1C | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MV-EPR-CU-1C | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MV-EPR-CU-3C | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MIN-DLO | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MIN-G | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MIN-G-GC | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MIN-SHD-GC | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-CTRL-TFN | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-CTRL-THHN | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-CTRL-BLINDADO | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-CTRL-FHHN | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-CTRL-FREP | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-POT-THHN | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-POT-XLP | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-CP-POT-FREP | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-REN-H1Z2Z2-K | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-REN-PV-WIRE-UL | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-REN-MC4 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-REN-EOLICO-XHHW | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-REN-MV-35KV | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-THHN-THWN-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-XHHW-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-RHW-2-RHH-USE-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-EPR-XL-CPE | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-PROTECCION-CATODICA | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-AL-XHHW-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-AL-RHH-RHW-USE-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-MONO-AL-THHN | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AT-SFF2-SRG-150 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AT-SF2-SRG-200 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AT-SRK-200 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AT-FEB-200 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AT-TGGF-250 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AT-MGT-450-538 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-H07 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-H05 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-YSLY-JZ | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-YSLCY-JZ | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-RV-K | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-VY-K | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-H07RN-F | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IEC-VFD | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AL-XHHW-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AL-RHW-RHH-USE-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AL-MC-FEEDER-XHHW-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-AL-FOTOVOLTAICO-XLP | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-PLAN-BOMBA-SUMERGIBLE | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-PLAN-GRUA-FESTOON | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-INS-PAR-TRIADA-PVC-300V | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-INS-MULTIPLE-PARES-PVC-BG-300V | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-INS-MULTIPLE-PARES-PVC-BI-BG-300V | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-INS-MULTIPLE-TRIADAS-PVC-BI-BG-300V | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-INS-MULTIPLE-PARES-TFN-BG-600V | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-INS-MULTIPLE-PARES-TFN-BI-BG-600V | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-INS-MULTIPLE-TRIADAS-THHN-BI-BG-600V | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-SOOW | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-SEO | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-ST | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-DLO | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-JUMPER | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-PORTA-ELECTRICO | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-RVK | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-FLEX-STAGE | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-RHHW | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-XHHW | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-THW-LS | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-RWU90 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-CPC | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-THHN | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-LSZH | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-USE-2 | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-SIS | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |
| SW-IND-FOTOVOLTAICOS | SOLEIL-BASE-2027 | General | MXN | NaN | m | NaN | NaN | NaN | NaN | SI | Completar precio según cotización/proveedor |

## Clientes_CRM
| tipo | razon\_social | nombre\_comercial | rfc | contacto\_principal | correo | telefono | whatsapp | ciudad | estado | industria | estatus | limite\_credito | dias\_credito | origen | notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cliente | Cliente ejemplo Minería SA de CV | Cliente ejemplo Minería | NaN | Compras | NaN | NaN | NaN | Monterrey | Nuevo León | Minería | Prospecto | NaN | 30 | Demo | Reemplazar con datos reales |
| Cliente | Cliente ejemplo Energía Renovable SA de CV | Cliente ejemplo Solar | NaN | Ingeniería | NaN | NaN | NaN | San Pedro Garza García | Nuevo León | Energía renovable | Prospecto | NaN | 30 | Demo | Reemplazar con datos reales |

## Oportunidades_CRM
| oportunidad | cliente | contacto | familia\_interes | producto\_interes | cantidad\_estimada | unidad | monto\_estimado | etapa | probabilidad | fecha\_cierre\_estimada | responsable | origen | notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OPP-SW-001 | Cliente ejemplo Minería | Compras | Minería | Cable tipo SHD-GC | NaN | m | NaN | Nueva | 20 | NaN | ventas | Demo | Completar datos reales |
| OPP-SW-002 | Cliente ejemplo Solar | Ingeniería | Renovable | Cable fotovoltaico PV Wire con UL | NaN | m | NaN | Nueva | 20 | NaN | ventas | Demo | Completar datos reales |

## Inventario_Inicial
| sku | almacen | ubicacion | lote\_serie | cantidad\_disponible | unidad | estado | fecha\_entrada | fecha\_caducidad | proveedor | costo\_unitario | notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SW-ARM-CTRL-MC-CHAQ | Principal | A-01 | NaN | NaN | m | Disponible | NaN | NaN | NaN | NaN | Inventario inicial opcional |

## Movimientos_Auditoria
| fecha | modulo | accion | usuario | registro | detalle | empresa | resultado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NaN | Catálogo | Carga inicial | operaciones@nexo.com | Soleil Wire | Importación inicial por plantilla | Soleil Wire | Pendiente |

## Diccionarios
| campo | valores\_sugeridos |
| --- | --- |
| familia | Armados | Medio Voltaje | Minería | Control/Potencia | Renovable | Monopolares | Alta Temperatura | Norma IEC | Aluminio | Planos | Instrumentación | Flexibles | Industriales |
| unidad\_venta | m | pieza | rollo | bobina | kg | lote | servicio |
| estatus\_cliente | Prospecto | Activo | Inactivo | Bloqueado |
| etapa\_oportunidad | Nueva | Calificada | Cotizada | Negociación | Ganada | Perdida |
| estado\_inventario | Disponible | Apartado | En tránsito | Bloqueado | Dañado | Vendido |

## Imagenes_Referencia
| imagen\_id | archivo | descripcion | uso\_sugerido |
| --- | --- | --- | --- |
| SW-REF-001 | imagenes\_referencia/SW-REF-001\_\_inicio\_portada\_inventarios.png | Referencia visual de identidad, encabezado y propuesta de inventarios amplios. | Vincular en catalogo/categoría/producto |
| SW-REF-002 | imagenes\_referencia/SW-REF-002\_\_menu\_categorias\_cables.png | Referencia de familias/categorías principales de cables. | Vincular en catalogo/categoría/producto |
| SW-CAT-ARMADOS | imagenes\_referencia/SW-CAT-ARMADOS\_\_cables\_armados.png | Categoría Armados: armadura de aluminio y armadura corrugada soldada. | Vincular en catalogo/categoría/producto |
| SW-CAT-MEDIO-VOLTAJE | imagenes\_referencia/SW-CAT-MEDIO-VOLTAJE\_\_medio\_voltaje.png | Categoría Medio Voltaje: XLPE y EPR. | Vincular en catalogo/categoría/producto |
| SW-CAT-MINERIA | imagenes\_referencia/SW-CAT-MINERIA\_\_mineria.png | Categoría Minería: DLO, G, G-GC, SHD-GC. | Vincular en catalogo/categoría/producto |
| SW-CAT-CONTROL-POTENCIA | imagenes\_referencia/SW-CAT-CONTROL-POTENCIA\_\_control\_potencia\_multiconductores.png | Categoría Control/Potencia: cables multiconductores. | Vincular en catalogo/categoría/producto |
| SW-CAT-RENOVABLE | imagenes\_referencia/SW-CAT-RENOVABLE\_\_energia\_renovable.png | Categoría Energía Renovable: solar y eólico. | Vincular en catalogo/categoría/producto |
| SW-CAT-MONOPOLARES | imagenes\_referencia/SW-CAT-MONOPOLARES\_\_monopolares.png | Categoría Monopolares. | Vincular en catalogo/categoría/producto |
| SW-CAT-ALTA-TEMP | imagenes\_referencia/SW-CAT-ALTA-TEMP\_\_alta\_temperatura.png | Categoría Alta Temperatura. | Vincular en catalogo/categoría/producto |
| SW-CAT-IEC | imagenes\_referencia/SW-CAT-IEC\_\_norma\_iec.png | Categoría Norma IEC. | Vincular en catalogo/categoría/producto |
| SW-CAT-ALUMINIO | imagenes\_referencia/SW-CAT-ALUMINIO\_\_aluminio.png | Categoría Aluminio. | Vincular en catalogo/categoría/producto |
| SW-CAT-PLANOS | imagenes\_referencia/SW-CAT-PLANOS\_\_planos.png | Categoría Cables Planos. | Vincular en catalogo/categoría/producto |
| SW-CAT-INSTRUMENTACION | imagenes\_referencia/SW-CAT-INSTRUMENTACION\_\_instrumentacion.png | Categoría Instrumentación. | Vincular en catalogo/categoría/producto |
| SW-CAT-FLEXIBLES | imagenes\_referencia/SW-CAT-FLEXIBLES\_\_flexibles.png | Categoría Flexibles. | Vincular en catalogo/categoría/producto |
| SW-CAT-INDUSTRIALES | imagenes\_referencia/SW-CAT-INDUSTRIALES\_\_industriales.png | Categoría Industriales. | Vincular en catalogo/categoría/producto |
| NEXO-UI-TABLE-REFERENCE | imagenes\_referencia/NEXO-UI-TABLE-REFERENCE\_\_nexo\_tabla\_referencia\_acciones.png | Referencia de tabla Nexo ERP donde faltan filtros, sumas, importación/exportación y ordenamiento. | Vincular en catalogo/categoría/producto |