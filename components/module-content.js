"use client"

import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Monitor,
  Workflow,
} from "lucide-react"

import BrandingSettings from "@/components/admin/branding-settings"
import UsersManagement from "@/components/admin/users-management"
import GroupsManagement from "@/components/admin/groups-management"
import ModulePermissions from "@/components/admin/module-permissions"
import ControlCapabilitiesManager from "@/components/admin/control-capabilities-manager"

import ITSMDashboard from "@/components/module-content/itsm/dashboard"
import ITSMIncidentsList from "@/components/module-content/itsm/incidents-list"
import ITSMIncidentDetail from "@/components/module-content/itsm/incident-detail"
import ITSMIncidentForm from "@/components/module-content/itsm/incident-form"
import ITSMRequestsList from "@/components/module-content/itsm/requests-list"
import ITSMRequestForm from "@/components/module-content/itsm/request-form"
import ITSMRequestDetail from "@/components/module-content/itsm/request-detail"

import SelfServiceOverview from "@/components/module-content/selfservice/overview"
import SelfServiceIncidentsList from "@/components/module-content/selfservice/incidents-list"
import SelfServiceIncidentDetail from "@/components/module-content/selfservice/incident-detail"
import SelfServiceRequestsList from "@/components/module-content/selfservice/requests-list"
import SelfServiceRequestDetail from "@/components/module-content/selfservice/request-detail"
import SelfServiceCatalog from "@/components/module-content/selfservice/catalog"

import ControlOverview from "@/components/module-content/control/overview"
import ControlDevicesList from "@/components/module-content/control/devices-list"
import ControlDeviceDetail from "@/components/module-content/control/device-detail"
import ControlAlerts from "@/components/module-content/control/alerts"
import ControlPatching from "@/components/module-content/control/patching"
import ControlRemoteTools from "@/components/module-content/control/remote-tools"

import AdminOverview from "@/components/module-content/admin/overview"
import SecuritySettings from "@/components/admin/security-settings"

import SimpleWorkspace from "@/components/module-content/shared/simple-workspace"

const knowledgeArticles = [
  "How to restore BitLocker recovery access",
  "New starter laptop provisioning workflow",
  "Troubleshooting Azure SSO loop issues",
  "VPN split tunnel support matrix",
]

export default function ModuleContent({
  moduleId,
  activeNav,
  theme,
  tenantSlug,
  tenantData,
  onNavigate,
}) {
  const permissionContext = tenantData?.permissionContext || {}

  if (moduleId === "itsm") {
    if (activeNav === "dashboard") {
      return (
        <ITSMDashboard
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
        />
      )
    }

    if (activeNav === "incidents") {
      return (
        <ITSMIncidentsList
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
        />
      )
    }

    if (activeNav === "requests") {
      return (
        <ITSMRequestsList
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
        />
      )
    }

    if (activeNav === "new-incident") {
      return <ITSMIncidentForm theme={theme} tenantSlug={tenantSlug} />
    }

    if (activeNav === "new-request") {
      return <ITSMRequestForm theme={theme} tenantSlug={tenantSlug} />
    }

    if (activeNav.startsWith("itsm-incident-")) {
      const id = activeNav.replace("itsm-incident-", "")
      return (
        <ITSMIncidentDetail
          theme={theme}
          tenantSlug={tenantSlug}
          id={id}
        />
      )
    }

    if (activeNav.startsWith("itsm-request-")) {
      const id = activeNav.replace("itsm-request-", "")
      return (
        <ITSMRequestDetail
          theme={theme}
          tenantSlug={tenantSlug}
          id={id}
        />
      )
    }

    if (activeNav === "changes") {
      return (
        <SimpleWorkspace
          theme={theme}
          title="Change management"
          subtitle="Plan risk, approvals, implementation windows, and backout plans."
          items={["CAB schedule", "Approval gates", "Implementation plan", "Backout plan"]}
          icon={Workflow}
        />
      )
    }

    if (activeNav === "problems") {
      return (
        <SimpleWorkspace
          theme={theme}
          title="Problem management"
          subtitle="Root cause analysis, known errors, and proactive prevention."
          items={["Known errors", "RCA workbench", "Trend correlation", "Problem backlog"]}
          icon={AlertTriangle}
        />
      )
    }

    if (activeNav === "assets") {
      return (
        <SimpleWorkspace
          theme={theme}
          title="Assets"
          subtitle="Endpoints, servers, and estate insight."
          items={["DC-SQL-01", "FW-EDGE-02", "LON-LT-1844", "APP-ERP-03"]}
          icon={Monitor}
        />
      )
    }

    if (activeNav === "knowledge") {
      return (
        <SimpleWorkspace
          theme={theme}
          title="Knowledge"
          subtitle="Search and publish helpful documentation."
          items={knowledgeArticles}
          icon={BookOpen}
        />
      )
    }

    if (activeNav === "reports") {
      return (
        <SimpleWorkspace
          theme={theme}
          title="Reports"
          subtitle="Operational reporting and insights."
          items={["Service volume", "SLA trends", "Team performance", "Backlog analysis"]}
          icon={BarChart3}
        />
      )
    }

    return (
      <ITSMDashboard
        theme={theme}
        tenantSlug={tenantSlug}
        onNavigate={onNavigate}
      />
    )
  }

  if (moduleId === "control") {
    if (activeNav === "overview") {
      return (
        <ControlOverview
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
          permissionContext={permissionContext}
        />
      )
    }

    if (activeNav === "devices") {
      return (
        <ControlDevicesList
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
          permissionContext={permissionContext}
        />
      )
    }

    if (activeNav.startsWith("device-")) {
      const id = activeNav.replace("device-", "")
      return (
        <ControlDeviceDetail
          theme={theme}
          tenantSlug={tenantSlug}
          id={id}
          permissionContext={permissionContext}
        />
      )
    }

    if (activeNav === "alerts") {
      return (
        <ControlAlerts
          theme={theme}
          tenantSlug={tenantSlug}
          permissionContext={permissionContext}
        />
      )
    }

    if (activeNav === "patching") {
      return (
        <ControlPatching
          theme={theme}
          tenantSlug={tenantSlug}
          permissionContext={permissionContext}
        />
      )
    }

    if (activeNav === "remote") {
      return (
        <ControlRemoteTools
          theme={theme}
          permissionContext={permissionContext}
        />
      )
    }

    if (activeNav === "reports") {
      return (
        <SimpleWorkspace
          theme={theme}
          title="Control reports"
          subtitle="Operational reporting for managed endpoints."
          items={["Device health", "Patch compliance", "Alert volume", "Remote activity"]}
          icon={BarChart3}
        />
      )
    }

    return (
      <ControlOverview
        theme={theme}
        tenantSlug={tenantSlug}
        onNavigate={onNavigate}
        permissionContext={permissionContext}
      />
    )
  }

  if (moduleId === "selfservice") {
    if (activeNav === "home") {
      return (
        <SelfServiceOverview
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
        />
      )
    }

    if (activeNav === "tickets") {
      return (
        <SelfServiceIncidentsList
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
        />
      )
    }

    if (activeNav === "requests") {
      return (
        <SelfServiceRequestsList
          theme={theme}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
        />
      )
    }

    if (activeNav === "raise-incident") {
      return (
        <ITSMIncidentForm
          theme={theme}
          tenantSlug={tenantSlug}
          heading="Raise an incident"
          subtitle="Tell us what is broken and we will get it logged."
          submitLabel="Submit incident"
        />
      )
    }

    if (activeNav === "new-request") {
      return (
        <ITSMRequestForm
          theme={theme}
          tenantSlug={tenantSlug}
          heading="Request something"
          subtitle="Request software, hardware, access, or onboarding help."
          submitLabel="Submit request"
        />
      )
    }

    if (activeNav.startsWith("incident-")) {
      const id = activeNav.replace("incident-", "")
      return (
        <SelfServiceIncidentDetail
          theme={theme}
          tenantSlug={tenantSlug}
          id={id}
        />
      )
    }

    if (activeNav.startsWith("request-")) {
      const id = activeNav.replace("request-", "")
      return (
        <SelfServiceRequestDetail
          theme={theme}
          tenantSlug={tenantSlug}
          id={id}
        />
      )
    }

    if (activeNav === "knowledge") {
      return (
        <SimpleWorkspace
          theme={theme}
          title="Knowledge"
          subtitle="Search and browse helpful articles."
          items={knowledgeArticles}
          icon={BookOpen}
        />
      )
    }

    if (activeNav === "catalog") {
  return (
    <SelfServiceCatalog
      theme={theme}
      tenantSlug={tenantSlug}
      onNavigate={onNavigate}
    />
  )
}

    return (
      <SelfServiceOverview
        theme={theme}
        tenantSlug={tenantSlug}
        onNavigate={onNavigate}
      />
    )
  }

  if (moduleId === "admin") {
    if (activeNav === "users") {
      return <UsersManagement tenantSlug={tenantSlug} theme={theme} />
    }

    if (activeNav === "groups") {
      return <GroupsManagement tenantSlug={tenantSlug} theme={theme} />
    }

    if (activeNav === "permissions") {
      return <ModulePermissions tenantSlug={tenantSlug} theme={theme} />
    }
    if (activeNav === "security") {
  return <SecuritySettings tenantSlug={tenantSlug} theme={theme} />
}

    if (activeNav === "control-capabilities") {
      return (
        <ControlCapabilitiesManager
          tenantSlug={tenantSlug}
          theme={theme}
        />
      )
    }

    if (activeNav === "branding") {
      return (
        <BrandingSettings
          tenant={tenantData}
          tenantSlug={tenantSlug}
          theme={theme}
        />
      )
    }


    return (
      <AdminOverview
        theme={theme}
        tenantSlug={tenantSlug}
        onNavigate={onNavigate}
      />
    )
  }

  if (moduleId === "analytics") {
    return (
      <SimpleWorkspace
        theme={theme}
        title="Analytics"
        subtitle="KPIs, trends, and forecasting."
        items={["MTTR", "CSAT", "SLA", "Capacity"]}
        icon={BarChart3}
      />
    )
  }

  return (
    <SimpleWorkspace
      theme={theme}
      title="Automation Hub"
      subtitle="Workflows, triggers, and recent runs."
      items={["VIP escalation", "Onboarding flow", "Patch reminder", "Access approval"]}
      icon={Workflow}
    />
  )
}
