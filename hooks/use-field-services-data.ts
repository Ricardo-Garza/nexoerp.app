"use client"

import { useMemo } from "react"
import { useFirestore } from "./use-firestore"
import { useCRMData } from "./use-crm-data"
import { useAuth } from "@/contexts/auth-context"
import { COLLECTIONS } from "@/lib/firestore"
import type {
  FieldServiceOrder,
  FieldTechnician,
  TechnicianLocation,
  FieldServiceMetrics,
  StockMovement,
  RefaccionUsada,
  ProductoRetirado,
} from "@/lib/types"
import { orderBy, addDoc, collection, Timestamp } from "firebase/firestore"
import { getFirebaseDb } from "@/lib/firebase"

export function useFieldServicesData() {
  const { user } = useAuth()

  const {
    items: servicesRaw,
    loading: loadingServices,
    create: createServiceRaw,
    update: updateServiceRaw,
    remove: removeService,
  } = useFirestore<FieldServiceOrder>(COLLECTIONS.fieldServiceOrders, [orderBy("fechaProgramada", "desc")], true)

  const {
    items: techniciansRaw,
    loading: loadingTechnicians,
    create: createTechnicianRaw,
    update: updateTechnicianRaw,
    remove: removeTechnician,
  } = useFirestore<FieldTechnician>(COLLECTIONS.fieldTechnicians, [orderBy("nombre", "asc")], true)

  const { items: locationsRaw, loading: loadingLocations } = useFirestore<TechnicianLocation>(
    COLLECTIONS.technicianLocations,
    [orderBy("timestamp", "desc")],
    true,
  )

  const { customers } = useCRMData()

  const services = Array.isArray(servicesRaw) ? servicesRaw : []
  const technicians = Array.isArray(techniciansRaw) ? techniciansRaw : []
  const locations = Array.isArray(locationsRaw) ? locationsRaw : []

  const loading = loadingServices || loadingTechnicians || loadingLocations

  // Generate unique service number
  const generateServiceNumber = useMemo(() => {
    const maxNumber = services.reduce((max, service) => {
      const folio = service.folio || ""
      const parts = folio.split("-")
      const num = parts.length > 1 ? Number.parseInt(parts[1], 10) : 0
      return Math.max(max, isNaN(num) ? 0 : num)
    }, 0)
    return `SRV-${String(maxNumber + 1).padStart(4, "0")}`
  }, [services])

  const createService = async (data: Partial<FieldServiceOrder>) => {
    const now = new Date().toISOString()
    const serviceData: Partial<FieldServiceOrder> = {
      ...data,
      companyId: user?.companyId || "",
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      fechaCreacion: now,
      estado: data.estado || "draft",
      evidencias: data.evidencias || [],
      checklist: data.checklist || [],
      refacciones: data.refacciones || [],
      productosRetirados: data.productosRetirados || [],
      costoServicio: data.costoServicio || 0,
      costoRefacciones: data.costoRefacciones || 0,
      costoTotal: data.costoTotal || 0,
      notas: data.notas || "",
      bitacora: data.bitacora || [],
      workOrderId: data.workOrderId || null,
      workOrderFolio: data.workOrderFolio || null,
      serviceTicketId: data.serviceTicketId || null,
      serviceTicketFolio: data.serviceTicketFolio || null,
      almacenRefaccionesId: data.almacenRefaccionesId || null,
      almacenDestinoId: data.almacenDestinoId || null,
    }
    return createServiceRaw(serviceData)
  }

  const updateService = async (id: string, data: Partial<FieldServiceOrder>) => {
    const serviceData: Partial<FieldServiceOrder> = {
      ...data,
      updatedAt: Timestamp.now() as any,
    }
    return updateServiceRaw(id, serviceData)
  }

  const createTechnician = async (data: Partial<FieldTechnician>) => {
    const technicianData: Partial<FieldTechnician> = {
      ...data,
      companyId: user?.companyId || "",
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
      especialidades: data.especialidades || [],
      certificaciones: data.certificaciones || [],
      rating: data.rating || 5,
      totalServicios: data.totalServicios || 0,
      serviciosCompletados: data.serviciosCompletados || 0,
      serviciosEnProgreso: data.serviciosEnProgreso || 0,
      disponibilidad: data.disponibilidad || "disponible",
      nivelExperiencia: data.nivelExperiencia || "mid",
      servicioActualId: data.servicioActualId || null,
    }
    return createTechnicianRaw(technicianData)
  }

  const updateTechnician = async (id: string, data: Partial<FieldTechnician>) => {
    const technicianData: Partial<FieldTechnician> = {
      ...data,
      updatedAt: Timestamp.now() as any,
    }
    return updateTechnicianRaw(id, technicianData)
  }

  const assignTechnician = async (serviceId: string, technicianId: string) => {
    const technician = technicians.find((t) => t.id === technicianId)
    if (!technician) throw new Error("Técnico no encontrado")

    await updateService(serviceId, {
      tecnicoId: technician.id,
      tecnicoNombre: technician.nombre,
      fechaAsignacion: new Date().toISOString(),
      estado: "asignado",
    })

    await updateTechnician(technicianId, {
      disponibilidad: "en_servicio",
      servicioActualId: serviceId,
      serviciosEnProgreso: (technician.serviciosEnProgreso || 0) + 1,
    })
  }

  const startService = async (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId)
    if (!service) throw new Error("Servicio no encontrado")

    const now = new Date()
    const creationDate =
      service.fechaCreacion instanceof Timestamp
        ? service.fechaCreacion.toDate()
        : new Date(service.fechaCreacion as string)

    const tiempoRespuesta = Math.floor((now.getTime() - creationDate.getTime()) / 60000)

    await updateService(serviceId, {
      checkIn: now.toISOString(),
      estado: "en_sitio",
      tiempoRespuestaMinutos: tiempoRespuesta,
    })
  }

  const completeService = async (
    serviceId: string,
    data: {
      evidencias?: any[]
      firmaCliente?: string
      refacciones?: RefaccionUsada[]
      productosRetirados?: ProductoRetirado[]
      notas?: string
    },
  ) => {
    const service = services.find((s) => s.id === serviceId)
    if (!service) throw new Error("Servicio no encontrado")

    const now = new Date()
    const checkInDate =
      service.checkIn instanceof Timestamp
        ? service.checkIn.toDate()
        : service.checkIn
          ? new Date(service.checkIn as string)
          : now

    const duracionMinutos = Math.floor((now.getTime() - checkInDate.getTime()) / 60000)

    if (data.refacciones && data.refacciones.length > 0 && service.almacenRefaccionesId) {
      for (const refaccion of data.refacciones) {
        const movementData: Partial<StockMovement> = {
          folio: `FIELD-${service.folio}-${refaccion.id}`,
          almacenId: service.almacenRefaccionesId,
          almacenNombre: service.almacenRefaccionesNombre || "",
          productoId: refaccion.productoId,
          productoNombre: refaccion.nombre,
          sku: refaccion.sku,
          tipo: "salida",
          unidadBase: refaccion.unidadBase,
          cantidad: refaccion.cantidad,
          cantidadAnterior: 0,
          cantidadNueva: 0,
          costoUnitario: refaccion.costoUnitario,
          costoTotal: refaccion.costoTotal,
          fecha: now.toISOString(),
          referencia: `Servicio ${service.folio}`,
          clienteId: service.clienteId,
          clienteNombre: service.clienteNombre,
          lote: refaccion.lote || null,
          serie: refaccion.serie || null,
          usuarioId: user?.uid || "",
          usuarioNombre: user?.displayName || "",
          motivo: "Consumo en servicio de campo",
          companyId: user?.companyId || "",
          createdAt: Timestamp.now() as any,
          updatedAt: Timestamp.now() as any,
        }

        const movementRef = await addDoc(collection(getFirebaseDb(), COLLECTIONS.stockMovements), movementData)
        refaccion.movimientoId = movementRef.id
      }
    }

    if (data.productosRetirados && data.productosRetirados.length > 0 && service.almacenDestinoId) {
      for (const producto of data.productosRetirados) {
        const movementData: Partial<StockMovement> = {
          folio: `RETURN-${service.folio}-${producto.id}`,
          almacenId: service.almacenDestinoId,
          almacenNombre: service.almacenDestinoNombre || "",
          productoId: producto.productoId,
          productoNombre: producto.productoNombre,
          sku: producto.sku,
          tipo: "devolucion_venta",
          unidadBase: "PZA",
          cantidad: producto.cantidad,
          cantidadAnterior: 0,
          cantidadNueva: producto.cantidad,
          costoUnitario: 0,
          costoTotal: 0,
          fecha: now.toISOString(),
          referencia: `${producto.motivo} - Servicio ${service.folio}`,
          clienteId: service.clienteId,
          clienteNombre: service.clienteNombre,
          lote: producto.lote || null,
          serie: producto.serie || null,
          usuarioId: user?.uid || "",
          usuarioNombre: user?.displayName || "",
          motivo: `${producto.motivo} - ${producto.estadoDisposicion} - ${producto.notas || ""}`,
          notas: `Estado: ${producto.estadoDisposicion}`,
          companyId: user?.companyId || "",
          createdAt: Timestamp.now() as any,
          updatedAt: Timestamp.now() as any,
        }

        if (service.serviceTicketId) {
          movementData.referencia = `Ticket ${service.serviceTicketFolio} - Servicio ${service.folio}`
        }

        await addDoc(collection(getFirebaseDb(), COLLECTIONS.stockMovements), movementData)
      }
    }

    // Update service
    const costoRefacciones = (data.refacciones || []).reduce((sum, r) => sum + r.costoTotal, 0)
    const costoTotal = service.costoServicio + costoRefacciones

    await updateService(serviceId, {
      checkOut: now.toISOString(),
      duracionMinutos,
      estado: "completado",
      evidencias: data.evidencias || service.evidencias || [],
      firmaCliente: data.firmaCliente || undefined,
      refacciones: data.refacciones || [],
      productosRetirados: data.productosRetirados || [],
      costoRefacciones,
      costoTotal,
      notas: data.notas || service.notas,
    })

    // Update technician
    if (service.tecnicoId) {
      const technician = technicians.find((t) => t.id === service.tecnicoId)
      if (technician) {
        await updateTechnician(service.tecnicoId, {
          disponibilidad: "disponible",
          servicioActualId: null,
          serviciosCompletados: (technician.serviciosCompletados || 0) + 1,
          serviciosEnProgreso: Math.max(0, (technician.serviciosEnProgreso || 0) - 1),
          totalServicios: (technician.totalServicios || 0) + 1,
        })
      }
    }
  }

  const updateTechnicianLocation = async (
    technicianId: string,
    location: { latitude: number; longitude: number; accuracy?: number },
  ) => {
    const technician = technicians.find((t) => t.id === technicianId)
    if (!technician) return

    const locationData: Partial<TechnicianLocation> = {
      tecnicoId: technician.id,
      tecnicoNombre: technician.nombre,
      latitud: location.latitude,
      longitud: location.longitude,
      precision: location.accuracy,
      timestamp: new Date().toISOString(),
      servicioActualId: technician.servicioActualId || null,
      estado: technician.disponibilidad === "en_servicio" ? "en_sitio" : "disponible",
      companyId: user?.companyId || "",
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    }

    await addDoc(collection(getFirebaseDb(), COLLECTIONS.technicianLocations), locationData)
  }

  // Calculate KPIs with safe defaults
  const serviciosActivos = useMemo(() => {
    return services.filter((s) => s.estado === "asignado" || s.estado === "en_ruta" || s.estado === "en_sitio").length
  }, [services])

  const tecnicosEnCampo = useMemo(() => {
    return technicians.filter((t) => t.disponibilidad === "en_servicio").length
  }, [technicians])

  const serviciosDelMes = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return services.filter((service) => {
      const fecha =
        service.fechaCreacion instanceof Timestamp
          ? service.fechaCreacion.toDate()
          : new Date(service.fechaCreacion as string)
      return fecha >= startOfMonth
    }).length
  }, [services])

  const tiempoPromedioHoras = useMemo(() => {
    const serviciosConDuracion = services.filter((s) => s.duracionMinutos != null && s.duracionMinutos > 0)
    if (serviciosConDuracion.length === 0) return 0

    const totalMinutos = serviciosConDuracion.reduce((sum, s) => sum + (s.duracionMinutos || 0), 0)
    return totalMinutos / serviciosConDuracion.length / 60
  }, [services])

  const serviciosPorEstado = useMemo(() => {
    const estados: Record<string, number> = {}
    services.forEach((s) => {
      estados[s.estado] = (estados[s.estado] || 0) + 1
    })
    return estados
  }, [services])

  const serviciosPorPrioridad = useMemo(() => {
    const prioridades: Record<string, number> = {}
    services.forEach((s) => {
      prioridades[s.prioridad] = (prioridades[s.prioridad] || 0) + 1
    })
    return prioridades
  }, [services])

  const cumplimientoSLA = useMemo(() => {
    const serviciosCompletados = services.filter((s) => s.estado === "completado")
    if (serviciosCompletados.length === 0) return 100

    const cumplidos = serviciosCompletados.filter((s) => {
      if (!s.duracionMinutos || !s.slaHoras) return true
      return s.duracionMinutos / 60 <= s.slaHoras
    }).length

    return (cumplidos / serviciosCompletados.length) * 100
  }, [services])

  const eficienciaTecnicos = useMemo(() => {
    if (technicians.length === 0) return 100

    const promedioServicios =
      technicians.reduce((sum, t) => sum + (t.serviciosCompletados || 0), 0) / technicians.length

    return Math.min(100, (promedioServicios / 10) * 100)
  }, [technicians])

  const metrics: FieldServiceMetrics = {
    serviciosActivos,
    tecnicosEnCampo,
    serviciosDelMes,
    tiempoPromedioHoras,
    serviciosPorEstado,
    serviciosPorPrioridad,
    eficienciaTecnicos,
    cumplimientoSLA,
  }

  return {
    services,
    technicians,
    locations,
    customers: Array.isArray(customers) ? customers : [],
    createService,
    updateService,
    removeService,
    createTechnician,
    updateTechnician,
    removeTechnician,
    assignTechnician,
    startService,
    completeService,
    updateTechnicianLocation,
    generateServiceNumber,
    metrics,
    loading,
  }
}
