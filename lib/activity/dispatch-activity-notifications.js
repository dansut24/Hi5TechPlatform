import {
  notifyIncidentAssigned,
  notifyIncidentCreated,
  notifyIncidentReopened,
  notifyIncidentResolved,
  notifyRequesterComment,
} from "@/lib/notifications/incident-notifications"

export async function dispatchActivityNotifications({
  activity,
  incident,
}) {
  if (!activity?.event_type || !incident?.tenant_id || !incident?.id) {
    return
  }

  const tenantId = incident.tenant_id

  switch (activity.event_type) {
    case "incident_created":
      await notifyIncidentCreated({
        tenantId,
        incident,
      })
      return

    case "incident_assigned":
      if (incident.assigned_to) {
        await notifyIncidentAssigned({
          tenantId,
          incident,
          assignedTo: incident.assigned_to,
        })
      }
      return

    case "incident_reopened":
      await notifyIncidentReopened({
        tenantId,
        incident,
      })
      return

    case "incident_comment_added":
      await notifyRequesterComment({
        tenantId,
        incident,
      })
      return

    case "incident_resolved":
      await notifyIncidentResolved({
        tenantId,
        incident,
      })
      return

    default:
      return
  }
}
