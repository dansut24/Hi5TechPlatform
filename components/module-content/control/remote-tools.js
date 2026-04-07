"use client"

import {
  Download,
  FolderOpen,
  Monitor,
  TerminalSquare,
  Upload,
} from "lucide-react"
import { cn } from "@/components/shared-ui"
import { hasControlCapability } from "@/lib/permissions/control"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"

function ToolCard({ theme, icon: Icon, title, description }) {
  return (
    <button className="text-left">
      <ShellCard theme={theme} className="h-full p-5 transition hover:scale-[1.01]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{title}</div>
            <div className={cn("mt-1 text-sm", theme.muted)}>{description}</div>
          </div>
          <div className={cn("rounded-2xl border p-3", theme.subCard, theme.line)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </ShellCard>
    </button>
  )
}

export default function ControlRemoteTools({ theme, permissionContext = {} }) {
  const canRemote = hasControlCapability(permissionContext, "control.remote.use")
  const canShell = hasControlCapability(permissionContext, "control.shell.use")
  const canFiles = hasControlCapability(permissionContext, "control.files.use")

  if (!canRemote && !canShell && !canFiles) {
    return (
      <ShellCard theme={theme} className="p-5">
        <div className="text-lg font-semibold">Access denied</div>
        <div className={cn("mt-2 text-sm", theme.muted)}>
          You do not have permission to use remote tools.
        </div>
      </ShellCard>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Remote tools"
        subtitle="Remote support actions and technician tooling."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {canRemote ? (
          <ToolCard
            theme={theme}
            icon={Monitor}
            title="Remote desktop"
            description="Launch remote access and screen control sessions."
          />
        ) : null}

        {canShell ? (
          <ToolCard
            theme={theme}
            icon={TerminalSquare}
            title="Shell"
            description="Open command-line access for technician support."
          />
        ) : null}

        {canFiles ? (
          <>
            <ToolCard
              theme={theme}
              icon={FolderOpen}
              title="File browser"
              description="Browse endpoint files and folders remotely."
            />
            <ToolCard
              theme={theme}
              icon={Upload}
              title="Upload file"
              description="Transfer files to a managed endpoint."
            />
            <ToolCard
              theme={theme}
              icon={Download}
              title="Download file"
              description="Retrieve logs and files from an endpoint."
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
