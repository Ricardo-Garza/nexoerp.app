"use client"

import type React from "react"
import { useMemo, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import listPlugin from "@fullcalendar/list"
import interactionPlugin from "@fullcalendar/interaction"
import { addHours } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useFirestore } from "@/hooks/use-firestore"
import { useAuth } from "@/hooks/use-auth"
import { COLLECTIONS } from "@/lib/firestore"
import type { CalendarEvent, Customer, Lead } from "@/lib/types"
import { Users, Briefcase, MapPin } from "lucide-react"
import { serverTimestamp, where } from "firebase/firestore"

const eventColorMap: Record<CalendarEvent["eventType"], string> = {
  reunion: "#38bdf8",
  cita: "#10b981",
  tarea: "#f59e0b",
  recordatorio: "#a855f7",
}

const eventTypeLabels: Record<CalendarEvent["eventType"], string> = {
  reunion: "Reunion",
  cita: "Cita",
  tarea: "Tarea",
  recordatorio: "Recordatorio",
}

const toInputValue = (value?: string | Date | null) => {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

const toDateValue = (value: any) => {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === "function") return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function CalendarPage() {
  const { user } = useAuth()
  const companyId = user?.companyId || user?.uid || ""
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const { items: events, create, update } = useFirestore<CalendarEvent>(
    COLLECTIONS.calendarEvents,
    companyId ? [where("companyId", "==", companyId)] : [],
    true,
    false,
  )
  const { items: customers } = useFirestore<Customer>(
    COLLECTIONS.customers,
    companyId ? [where("companyId", "==", companyId)] : [],
    true,
  )
  const { items: leads } = useFirestore<Lead>(
    COLLECTIONS.leads,
    companyId ? [where("companyId", "==", companyId)] : [],
    true,
  )
  const { items: members } = useFirestore<{ id: string; name?: string; email?: string; companyId?: string }>(
    COLLECTIONS.users,
    companyId ? [where("companyId", "==", companyId)] : [],
    true,
    false,
  )

  const memberOptions = useMemo(() => members.filter((member) => member.id !== user?.uid), [members, user?.uid])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allDay: false,
    eventType: "reunion" as CalendarEvent["eventType"],
    location: "",
    clientId: "",
    leadId: "",
    invitedUserIds: [] as string[],
  })

  const calendarEvents = useMemo(() => {
    return events.map((event) => {
      const start = toDateValue(event.startDate)
      const end = toDateValue(event.endDate)
      return {
        id: event.id,
        title: event.title,
        start: start || undefined,
        end: end || undefined,
        allDay: event.allDay,
        backgroundColor: eventColorMap[event.eventType],
        borderColor: eventColorMap[event.eventType],
        textColor: "#0f172a",
        extendedProps: event,
      }
    })
  }, [events])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      allDay: false,
      eventType: "reunion",
      location: "",
      clientId: "",
      leadId: "",
      invitedUserIds: [],
    })
    setEditingEventId(null)
  }

  const openDialogForDate = (date: Date) => {
    const start = date
    const end = addHours(date, 1)
    setFormData((prev) => ({
      ...prev,
      startDate: toInputValue(start),
      endDate: toInputValue(end),
    }))
    setEditingEventId(null)
    setDialogOpen(true)
  }

  const openDialogForEvent = (event: CalendarEvent) => {
    setFormData({
      title: event.title || "",
      description: event.description || "",
      startDate: toInputValue(toDateValue(event.startDate)),
      endDate: toInputValue(toDateValue(event.endDate)),
      allDay: event.allDay,
      eventType: event.eventType,
      location: event.location || "",
      clientId: event.clientId || "",
      leadId: event.leadId || "",
      invitedUserIds: event.invitedUserIds || [],
    })
    setEditingEventId(event.id)
    setDialogOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!formData.title.trim() || !formData.startDate) return

    const selectedClient = customers.find((c) => c.id === formData.clientId)
    const selectedLead = leads.find((l) => l.id === formData.leadId)
    const invitedMembers = memberOptions.filter((member) => formData.invitedUserIds.includes(member.id))

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(formData.startDate).toISOString(),
      allDay: formData.allDay,
      eventType: formData.eventType,
      location: formData.location,
      clientId: formData.clientId ? formData.clientId : null,
      clientName: selectedClient?.nombre || null,
      leadId: formData.leadId ? formData.leadId : null,
      leadName: selectedLead?.empresa || null,
      invitedUserIds: formData.invitedUserIds,
      invitedNames: invitedMembers.map((member) => member.name || member.email || member.id),
      invitedEmails: invitedMembers.map((member) => member.email || ""),
      ownerId: user?.uid || "",
      status: "programado",
      color: formData.eventType,
      companyId,
      userId: user?.uid || "",
      updatedAt: serverTimestamp() as any,
    }

    if (editingEventId) {
      await update(editingEventId, payload as any)
    } else {
      await create({
        ...payload,
        createdAt: serverTimestamp() as any,
      } as any)
    }

    setDialogOpen(false)
    resetForm()
  }

  const handleEventMove = async (eventId: string, start: Date | null, end: Date | null, allDay: boolean) => {
    if (!start) return
    await update(eventId, {
      startDate: start.toISOString(),
      endDate: (end || start).toISOString(),
      allDay,
      updatedAt: serverTimestamp() as any,
    })
  }

  const toggleInvite = (userId: string) => {
    setFormData((prev) => {
      const exists = prev.invitedUserIds.includes(userId)
      const invitedUserIds = exists
        ? prev.invitedUserIds.filter((id) => id !== userId)
        : [...prev.invitedUserIds, userId]
      return { ...prev, invitedUserIds }
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="calendar-shell h-full min-h-0 flex-1 rounded-[28px] border border-white/20 bg-slate-950/95 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          customButtons={{
            newEvent: {
              text: "Nuevo evento",
              click: () => openDialogForDate(new Date()),
            },
          }}
          headerToolbar={{
            left: "newEvent prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          initialView="dayGridMonth"
          locale={es}
          height="100%"
          contentHeight="auto"
          editable
          selectable
          selectMirror
          events={calendarEvents}
          select={(info) => openDialogForDate(info.start)}
          eventClick={(info) => openDialogForEvent(info.event.extendedProps as CalendarEvent)}
          eventDrop={(info) => handleEventMove(info.event.id, info.event.start, info.event.end, info.event.allDay)}
          eventResize={(info) => handleEventMove(info.event.id, info.event.start, info.event.end, info.event.allDay)}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEventId ? "Editar evento" : "Nuevo evento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Titulo</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Reunion comercial"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData({ ...formData, eventType: value as CalendarEvent["eventType"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ubicacion</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Sala Norte"
              />
            </div>
            <div className="space-y-2">
              <Label>Inicio</Label>
              <Input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch
                checked={formData.allDay}
                onCheckedChange={(checked) => setFormData({ ...formData, allDay: checked })}
              />
              <Label>Todo el dia</Label>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select value={formData.leadId} onValueChange={(value) => setFormData({ ...formData, leadId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Invitados</Label>
              {memberOptions.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                  No hay usuarios para invitar en esta empresa.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {memberOptions.map((member) => {
                    const label = member.name || member.email || "Usuario"
                    const checked = formData.invitedUserIds.includes(member.id)
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                          checked ? "border-primary/60 bg-primary/10 text-foreground" : "border-border"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleInvite(member.id)}
                          className="h-4 w-4"
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descripcion</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Notas o agenda de la reunion"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="inline-flex items-center gap-2">
                <Users className="w-3 h-3" />
                {formData.clientId ? "Cliente vinculado" : "Sin cliente"}
              </Badge>
              <Badge variant="outline" className="inline-flex items-center gap-2">
                <Briefcase className="w-3 h-3" />
                {formData.leadId ? "Lead vinculado" : "Sin lead"}
              </Badge>
              {formData.location && (
                <Badge variant="outline" className="inline-flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  {formData.location}
                </Badge>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEvent}>{editingEventId ? "Actualizar" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
