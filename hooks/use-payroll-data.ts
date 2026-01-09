"use client"

import { useState, useEffect, useMemo } from "react"
import { where, orderBy } from "firebase/firestore"
import { COLLECTIONS, subscribeToCollection, addItem, updateItem } from "@/lib/firestore"
import type {
  Employee,
  PayrollPeriod,
  PayrollRun,
  PayrollReceipt,
  TimeEntry,
  Incident,
  BenefitDeduction,
  Candidate,
  TrainingCourse,
} from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

export function usePayrollData() {
  const { user } = useAuth()
  const companyId = user?.companyId || ""
  const userId = user?.uid || ""

  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([])
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [payrollReceipts, setPayrollReceipts] = useState<PayrollReceipt[]>([])
  const [payrollConcepts, setPayrollConcepts] = useState<BenefitDeduction[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)

  const safeEmployees = Array.isArray(employees) ? employees : []
  const safePayrollPeriods = Array.isArray(payrollPeriods) ? payrollPeriods : []
  const safePayrollRuns = Array.isArray(payrollRuns) ? payrollRuns : []
  const safePayrollReceipts = Array.isArray(payrollReceipts) ? payrollReceipts : []
  const safePayrollConcepts = Array.isArray(payrollConcepts) ? payrollConcepts : []
  const safeTimeEntries = Array.isArray(timeEntries) ? timeEntries : []
  const safeIncidents = Array.isArray(incidents) ? incidents : []
  const safeCandidates = Array.isArray(candidates) ? candidates : []
  const safeTrainingCourses = Array.isArray(trainingCourses) ? trainingCourses : []

  useEffect(() => {
    if (!companyId) {
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribers = [
      subscribeToCollection<Employee>(COLLECTIONS.employees, setEmployees, [
        where("companyId", "==", companyId),
        orderBy("numeroEmpleado", "asc"),
      ]),
      subscribeToCollection<PayrollPeriod>(COLLECTIONS.payrollPeriods, setPayrollPeriods, [
        where("companyId", "==", companyId),
        orderBy("fechaInicio", "desc"),
      ]),
      subscribeToCollection<PayrollRun>(COLLECTIONS.payrollRuns, setPayrollRuns, [
        where("companyId", "==", companyId),
        orderBy("fechaPago", "desc"),
      ]),
      subscribeToCollection<PayrollReceipt>(COLLECTIONS.payrollReceipts, setPayrollReceipts, [
        where("companyId", "==", companyId),
      ]),
      subscribeToCollection<BenefitDeduction>(COLLECTIONS.benefitsDeductions, setPayrollConcepts, [
        where("companyId", "==", companyId),
        orderBy("orden", "asc"),
      ]),
      subscribeToCollection<TimeEntry>(COLLECTIONS.timeEntries, setTimeEntries, [
        where("companyId", "==", companyId),
        orderBy("fecha", "desc"),
      ]),
      subscribeToCollection<Incident>(COLLECTIONS.incidents, setIncidents, [
        where("companyId", "==", companyId),
        orderBy("fechaSolicitud", "desc"),
      ]),
      subscribeToCollection<Candidate>(COLLECTIONS.candidates, setCandidates, [
        where("companyId", "==", companyId),
        orderBy("fechaAplicacion", "desc"),
      ]),
      subscribeToCollection<TrainingCourse>(COLLECTIONS.trainingCourses, setTrainingCourses, [
        where("companyId", "==", companyId),
        orderBy("fechaInicio", "desc"),
      ]),
    ]

    setLoading(false)

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [companyId])

  const empleadosActivos = useMemo(() => safeEmployees.filter((e) => e.estado === "activo").length, [safeEmployees])

  const nominaMensual = useMemo(() => {
    const activeEmployees = safeEmployees.filter((e) => e.estado === "activo")
    return activeEmployees.reduce((sum, emp) => sum + (emp.salarioMensual || 0), 0)
  }, [safeEmployees])

  const incidenciasPendientes = useMemo(
    () => safeIncidents.filter((i) => i.estado === "pendiente").length,
    [safeIncidents],
  )

  const candidatosActivos = useMemo(() => safeCandidates.filter((c) => c.estatus === "activo").length, [safeCandidates])

  const addEmployee = async (employee: Omit<Employee, "id">) => {
    return await addItem<Employee>(COLLECTIONS.employees, {
      ...employee,
      companyId,
      userId,
      estado: employee.estado || "activo",
      salarioDiario: employee.salarioDiario || 0,
      salarioMensual: employee.salarioMensual || 0,
      moneda: employee.moneda || "MXN",
    })
  }

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    return await updateItem<Employee>(COLLECTIONS.employees, id, updates)
  }

  const addPayrollPeriod = async (period: Omit<PayrollPeriod, "id">) => {
    return await addItem<PayrollPeriod>(COLLECTIONS.payrollPeriods, {
      ...period,
      companyId,
      userId,
      estado: period.estado || "borrador",
      totalNomina: period.totalNomina || 0,
      totalPercepciones: period.totalPercepciones || 0,
      totalDeducciones: period.totalDeducciones || 0,
      totalEmpleados: period.totalEmpleados || 0,
    })
  }

  const processPayrollRun = async (periodoId: string, generateJournalEntry = true) => {
    // Create payroll run with all receipts
    const period = safePayrollPeriods.find((p) => p.id === periodoId)
    if (!period) throw new Error("Periodo no encontrado")

    const activeEmployees = safeEmployees.filter((e) => e.estado === "activo")
    const receipts: string[] = []
    let totalNomina = 0
    let totalPercepciones = 0
    let totalDeducciones = 0

    // Calculate receipts for each employee
    for (const employee of activeEmployees) {
      const receipt = await addItem<PayrollReceipt>(COLLECTIONS.payrollReceipts, {
        companyId,
        userId,
        periodoId,
        periodo: period.periodo,
        empleadoId: employee.id,
        empleadoNombre: `${employee.nombre} ${employee.apellidoPaterno}`,
        numeroEmpleado: employee.numeroEmpleado,
        fechaPago: period.fechaPago,
        diasTrabajados: 15, // Default for quincenal
        salarioDiario: employee.salarioDiario,
        percepciones: [],
        deducciones: [],
        totalPercepciones: employee.salarioDiario * 15,
        totalDeducciones: 0,
        netoAPagar: employee.salarioDiario * 15,
        estado: "calculado",
        metodoPago: "transferencia",
        timbrado: false,
      })

      receipts.push(receipt.id)
      totalNomina += receipt.netoAPagar
      totalPercepciones += receipt.totalPercepciones
      totalDeducciones += receipt.totalDeducciones
    }

    // Create payroll run
    const payrollRun = await addItem<PayrollRun>(COLLECTIONS.payrollRuns, {
      companyId,
      userId,
      periodoId,
      periodo: period.periodo,
      fechaInicio: period.fechaInicio,
      fechaFin: period.fechaFin,
      fechaPago: period.fechaPago,
      estado: "calculada",
      recibos: receipts,
      totalNomina,
      totalPercepciones,
      totalDeducciones,
      totalEmpleados: activeEmployees.length,
      totalISR: 0,
      totalIMSS: 0,
      metodoPago: "transferencia",
      polizaGenerada: false,
    })

    // Generate journal entry if requested
    if (generateJournalEntry) {
      // This would call accounting module to create journal entry
      // For now, just mark as generated
      await updateItem<PayrollRun>(COLLECTIONS.payrollRuns, payrollRun.id, {
        polizaGenerada: true,
      })
    }

    return payrollRun
  }

  const addIncident = async (incident: Omit<Incident, "id">) => {
    return await addItem<Incident>(COLLECTIONS.incidents, {
      ...incident,
      companyId,
      userId,
      estado: incident.estado || "pendiente",
      afectaNomina: incident.afectaNomina !== undefined ? incident.afectaNomina : true,
    })
  }

  const approveIncident = async (id: string, approved: boolean, comments?: string) => {
    return await updateItem<Incident>(COLLECTIONS.incidents, id, {
      estado: approved ? "aprobada" : "rechazada",
      aprobadoPor: userId,
      fechaAprobacion: new Date().toISOString(),
      comentariosAprobador: comments,
    })
  }

  const addBenefitDeduction = async (concept: Omit<BenefitDeduction, "id">) => {
    return await addItem<BenefitDeduction>(COLLECTIONS.benefitsDeductions, {
      ...concept,
      companyId,
      userId,
      activo: concept.activo !== undefined ? concept.activo : true,
      esObligatorio: concept.esObligatorio !== undefined ? concept.esObligatorio : false,
      esRecurrente: concept.esRecurrente !== undefined ? concept.esRecurrente : true,
      aplicaATodos: concept.aplicaATodos !== undefined ? concept.aplicaATodos : true,
      categoriaIMSS: concept.categoriaIMSS !== undefined ? concept.categoriaIMSS : false,
      orden: concept.orden || 0,
    })
  }

  const addCandidate = async (candidate: Omit<Candidate, "id">) => {
    return await addItem<Candidate>(COLLECTIONS.candidates, {
      ...candidate,
      companyId,
      userId,
      etapa: candidate.etapa || "nuevo",
      estatus: candidate.estatus || "activo",
      fechaAplicacion: candidate.fechaAplicacion || new Date().toISOString(),
    })
  }

  const addTrainingCourse = async (course: Omit<TrainingCourse, "id">) => {
    return await addItem<TrainingCourse>(COLLECTIONS.trainingCourses, {
      ...course,
      companyId,
      userId,
      empleadosInscritos: course.empleadosInscritos || [],
      empleadosCompletados: course.empleadosCompletados || [],
      estado: course.estado || "planificado",
      evaluacionRequerida: course.evaluacionRequerida !== undefined ? course.evaluacionRequerida : false,
    })
  }

  const addTimeEntry = async (entry: Omit<TimeEntry, "id">) => {
    return await addItem<TimeEntry>(COLLECTIONS.timeEntries, {
      ...entry,
      companyId,
      userId,
      horasTrabajadas: entry.horasTrabajadas || 0,
      horasExtra: entry.horasExtra || 0,
      tipoRegistro: entry.tipoRegistro || "normal",
      autorizado: entry.autorizado !== undefined ? entry.autorizado : true,
    })
  }

  return {
    // Collections
    employees: safeEmployees,
    payrollPeriods: safePayrollPeriods,
    payrollRuns: safePayrollRuns,
    payrollReceipts: safePayrollReceipts,
    payrollConcepts: safePayrollConcepts,
    timeEntries: safeTimeEntries,
    incidents: safeIncidents,
    candidates: safeCandidates,
    trainingCourses: safeTrainingCourses,
    loading,

    // KPIs
    empleadosActivos,
    nominaMensual,
    incidenciasPendientes,
    candidatosActivos,

    // Methods
    addEmployee,
    updateEmployee,
    addPayrollPeriod,
    processPayrollRun,
    addIncident,
    approveIncident,
    addBenefitDeduction,
    addCandidate,
    addTrainingCourse,
    addTimeEntry,
  }
}
