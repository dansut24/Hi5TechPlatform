import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications/create-notification"

async function getGroupMemberUserIds(groupId) {
  if (!groupId) return []

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)

  if (error) {
    console.error("[notifications] group lookup failed", error)
    return []
  }

  return (data || []).map((row) => row.user_id).filter(Boolean)
}

export async function notifyIncidentCreated({ tenantId, incident }) {
  if (!tenantId || !incident?.id) return

  const recipients = await getGroupMemberUserIds(incident.assignment_group_id)

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        tenantId,
        userId,
        type: "incident_created",
        title: `New incident ${incident.number}`,
        body: incident.short_description || "A new incident was submitted.",
        entityType: "incident",
        entityId: incident.id,
        link: `/itsm`,
        moduleId: "itsm",
      })
    )
  )
}

export async function notifyIncidentAssigned({
  tenantId,
  incident,
  assignedTo,
}) {
  if (!tenantId || !incident?.id || !assignedTo) return

  await createNotification({
    tenantId,
    userId: assignedTo,
    type: "incident_assigned",
    title: `Incident assigned: ${incident.number}`,
    body: incident.short_description || "An incident was assigned to you.",
    entityType: "incident",
    entityId: incident.id,
    link: `/itsm`,
    moduleId: "itsm",
  })
}

export async function notifyRequesterComment({
  tenantId,
  incident,
}) {
  if (!tenantId || !incident?.id) return

  if (incident.assigned_to) {
    await createNotification({
      tenantId,
      userId: incident.assigned_to,
      type: "incident_requester_comment",
      title: `Requester replied on ${incident.number}`,
      body: incident.short_description || "The requester added a comment.",
      entityType: "incident",
      entityId: incident.id,
      link: `/itsm`,
      moduleId: "itsm",
    })
    return
  }

  const recipients = await getGroupMemberUserIds(incident.assignment_group_id)

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        tenantId,
        userId,
        type: "incident_requester_comment",
        title: `Requester replied on ${incident.number}`,
        body: incident.short_description || "The requester added a comment.",
        entityType: "incident",
        entityId: incident.id,
        link: `/itsm`,
        moduleId: "itsm",
      })
    )
  )
}

export async function notifyIncidentResolved({
  tenantId,
  incident,
}) {
  if (!tenantId || !incident?.created_by) return

  await createNotification({
    tenantId,
    userId: incident.created_by,
    type: "incident_resolved",
    title: `Incident resolved: ${incident.number}`,
    body: incident.resolution_notes || incident.short_description || "Your incident was resolved.",
    entityType: "incident",
    entityId: incident.id,
    link: `/selfservice`,
    moduleId: "selfservice",
  })
}

export async function notifyIncidentReopened({
  tenantId,
  incident,
}) {
  if (!tenantId || !incident?.id) return

  if (incident.assigned_to) {
    await createNotification({
      tenantId,
      userId: incident.assigned_to,
      type: "incident_reopened",
      title: `Incident reopened: ${incident.number}`,
      body: incident.short_description || "An incident was reopened.",
      entityType: "incident",
      entityId: incident.id,
      link: `/itsm`,
      moduleId: "itsm",
    })
    return
  }

  const recipients = await getGroupMemberUserIds(incident.assignment_group_id)

  await Promise.all(
    recipients.map((userId) =>
      createNotification({
        tenantId,
        userId,
        type: "incident_reopened",
        title: `Incident reopened: ${incident.number}`,
        body: incident.short_description || "An incident was reopened.",
        entityType: "incident",
        entityId: incident.id,
        link: `/itsm`,
        moduleId: "itsm",
      })
    )
  )
}
