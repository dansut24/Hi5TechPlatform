"use client"

import { ArrowRight, ClipboardList, Grid3X3 } from "lucide-react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"

function RequestOptionCard({ theme, title, description, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="group block w-full text-left">
      <ShellCard theme={theme} className="h-full p-6 transition group-hover:scale-[1.01]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold tracking-tight">{title}</div>
            <div className={cn("mt-2 max-w-md text-sm", theme.muted)}>{description}</div>
          </div>
          <div className={cn("rounded-2xl border p-3", theme.subCard, theme.line)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className={cn("mt-6 inline-flex items-center gap-2 text-sm", theme.muted)}>
          <span>Open</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </ShellCard>
    </button>
  )
}

export default function SelfServiceRequestChooser({ theme, onNavigate }) {
  return (
    <div className="space-y-8">
      <SectionTitle
        theme={theme}
        title="Submit a Request"
        subtitle="Choose how you want to create your request."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <RequestOptionCard
          theme={theme}
          title="Browse Service Catalog"
          description="Choose from available services, add items to a basket, and submit them together."
          icon={Grid3X3}
          onClick={() => onNavigate?.("request-catalog", "Service Catalog")}
        />

        <RequestOptionCard
          theme={theme}
          title="Submit a General Request"
          description="Raise a request manually if it does not fit an item in the service catalog."
          icon={ClipboardList}
          onClick={() => onNavigate?.("request-manual", "General Request")}
        />
      </div>
    </div>
  )
}
