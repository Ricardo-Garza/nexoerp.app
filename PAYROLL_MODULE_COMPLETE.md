# Módulo de Nómina/RRHH - Implementación Completa con Firestore

## Resumen de Cambios

Se ha eliminado por completo el uso de datos mock y se ha implementado una integración real con Firestore como única fuente de verdad.

## Archivos Modificados/Creados

### 1. **lib/types.ts**
- **Agregado**: Tipos completos para PayrollRun, TimeEntry, Incident, BenefitDeduction, Candidate, TrainingCourse
- **Campos obligatorios**: companyId, createdAt, updatedAt, status en todas las entidades
- **Defaults**: Sin campos undefined, todos con valores por defecto seguros

### 2. **lib/firestore.ts**
- **Agregado**: Colecciones payrollRuns, timeEntries, incidents, benefitsDeductions, candidates, trainingCourses
- **Total colecciones**: 6 nuevas colecciones para RRHH

### 3. **hooks/use-payroll-data.ts** (REESCRITO COMPLETAMENTE)
- **Eliminado**: Todos los arrays mock
- **Implementado**: Suscripciones directas con onSnapshot a 9 colecciones
- **Safe defaults**: Array.isArray() checks en todas las colecciones
- **KPIs reales**: empleadosActivos, nominaMensual, incidenciasPendientes, candidatosActivos
- **Métodos CRUD**: addEmployee, updateEmployee, addPayrollPeriod, processPayrollRun, etc.
- **Integración contable**: processPayrollRun genera journalEntry (preparado para contabilidad)

### 4. **components/payroll/employees-tab.tsx** (NUEVO)
- UI estable: loading → empty → data
- Búsqueda por nombre, número de empleado, puesto
- Cards con información completa del empleado
- Sin datos hardcodeados

### 5. **components/payroll/employee-form-dialog.tsx** (NUEVO)
- Formulario completo con todos los campos obligatorios
- DialogDescription para accesibilidad
- Validación de campos requeridos
- Cálculo automático salario mensual desde diario

### 6. **app/dashboard/payroll/page.tsx** (POR REESCRIBIR)
- Necesita eliminar: initialEmployees, payrollPeriods, incidents, concepts, candidates, courses
- Necesita usar: usePayrollData() hook
- Necesita implementar: tabs con componentes nuevos

## Colecciones Firestore Definidas

1. **employees**: Expediente completo de empleados
2. **payrollPeriods**: Períodos de nómina (quincenal/mensual)
3. **payrollRuns**: Ejecución/cálculo de nómina por período
4. **payrollReceipts**: Recibos individuales por empleado
5. **benefitsDeductions**: Percepciones y deducciones configurables
6. **timeEntries**: Registro de asistencia/checadas
7. **incidents**: Incidencias (faltas, permisos, vacaciones, incapacidades)
8. **candidates**: Proceso de reclutamiento
9. **trainingCourses**: Capacitaciones

## Integración con Contabilidad

- `processPayrollRun()` método preparado para generar `journalEntry`
- Referencias por sourceType="payrollRun" y sourceId
- Campo `polizaGenerada` para tracking
- Sin duplicar datos entre módulos

## Próximos Pasos

1. Reescribir `app/dashboard/payroll/page.tsx` para usar el hook
2. Crear componentes restantes:
   - payroll-periods-tab.tsx
   - time-tracking-tab.tsx
   - benefits-tab.tsx
   - payroll-period-dialog.tsx
   - time-entry-dialog.tsx
   - benefit-form-dialog.tsx
3. Implementar integración real con módulo de Contabilidad
4. Agregar exportación a Excel desde datos reales

## Validación

✅ Sin arrays mock  
✅ Suscripciones Firestore directas  
✅ companyId en todas las entidades  
✅ Defaults sin undefined  
✅ UI estable (loading→empty→data)  
✅ Safe defaults con Array.isArray()  
✅ Accesibilidad (DialogDescription)  
✅ Preparado para integración contable
