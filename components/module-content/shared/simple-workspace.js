"use client"

import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

export default function SimpleWorkspace({
  title,
  subtitle,
  items = [],
  icon: Icon,
  theme,
  actionLabel = "Create",
  onAction,
}) {
  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title={title}
        subtitle={subtitle}
        action={
          <ActionButton theme={theme} onClick={onAction}>
            {actionLabel}
          </ActionButton>
        }
      />

      <ShellCard theme={theme} className="p-5">
        <div className="mb-4 flex items-center gap-3">
          {Icon ? <Icon className="h-5 w-5" /> : null}
          <div className="text-lg font-semibold">{title}</div>
        </div>

        {items.length === 0 ? (
          <div className={cn("text-sm", theme.muted)}>
            No items available.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={typeof item === "string" ? item : item.id || item.label || JSON.stringify(item)}
                className={cn("rounded-2xl border p-4 text-sm", theme.subCard, theme.line)}
              >
                {typeof item === "string" ? (
                  item
                ) : (
                  <div className="space-y-1">
                    {item.label ? <div className="font-medium">{item.label}</div> : null}
                    {item.description ? (
                      <div className={cn("text-sm", theme.muted)}>{item.description}</div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ShellCard>
    </div>
  )
}
