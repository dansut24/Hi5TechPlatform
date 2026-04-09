"use client"

import { useEffect, useState } from "react"
import { cn } from "@/components/shared-ui"
import ShellCard from "@/components/module-content/shared/shell-card"
import SectionTitle from "@/components/module-content/shared/section-title"
import ActionButton from "@/components/module-content/shared/action-button"

const FIELD_TYPES = ["text", "textarea", "select", "date", "number", "checkbox"]

export default function RequestTemplates({ tenantSlug, theme }) {
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingFields, setLoadingFields] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    request_type: "Service Catalog Request",
  })

  const [fieldForm, setFieldForm] = useState({
    label: "",
    field_key: "",
    field_type: "text",
    placeholder: "",
    help_text: "",
    is_required: false,
    sort_order: 0,
    options_text: "",
  })

  async function loadTemplates() {
    const res = await fetch(`/api/tenant/${tenantSlug}/admin/request-templates`, {
      cache: "no-store",
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to load templates")
    setTemplates(json.templates || [])
  }

  async function loadTemplateFields(templateId) {
    if (!templateId) {
      setFields([])
      return
    }

    setLoadingFields(true)
    try {
      const res = await fetch(
        `/api/tenant/${tenantSlug}/admin/request-templates/${templateId}/fields`,
        { cache: "no-store" }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load fields")
      setFields(json.fields || [])
    } finally {
      setLoadingFields(false)
    }
  }

  useEffect(() => {
    let alive = true

    async function run() {
      try {
        setLoading(true)
        setError("")
        await loadTemplates()
      } catch (err) {
        if (alive) setError(err.message || "Failed to load templates")
      } finally {
        if (alive) setLoading(false)
      }
    }

    if (tenantSlug) run()
    return () => {
      alive = false
    }
  }, [tenantSlug])

  useEffect(() => {
    loadTemplateFields(selectedTemplateId).catch((err) => setError(err.message || "Failed to load fields"))
  }, [selectedTemplateId, tenantSlug])

  const createTemplate = async () => {
    try {
      setError("")
      setMessage("")

      const res = await fetch(`/api/tenant/${tenantSlug}/admin/request-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create template")

      setTemplateForm({
        name: "",
        description: "",
        request_type: "Service Catalog Request",
      })

      await loadTemplates()
      setSelectedTemplateId(json.template.id)
      setMessage("Template created")
    } catch (err) {
      setError(err.message || "Failed to create template")
    }
  }

  const createField = async () => {
    try {
      setError("")
      setMessage("")

      if (!selectedTemplateId) {
        throw new Error("Select a template first")
      }

      const options_json =
        fieldForm.field_type === "select"
          ? fieldForm.options_text
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean)
          : null

      const res = await fetch(
        `/api/tenant/${tenantSlug}/admin/request-templates/${selectedTemplateId}/fields`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: fieldForm.label,
            field_key: fieldForm.field_key,
            field_type: fieldForm.field_type,
            placeholder: fieldForm.placeholder,
            help_text: fieldForm.help_text,
            is_required: fieldForm.is_required,
            sort_order: Number(fieldForm.sort_order || 0),
            options_json,
          }),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create field")

      setFieldForm({
        label: "",
        field_key: "",
        field_type: "text",
        placeholder: "",
        help_text: "",
        is_required: false,
        sort_order: 0,
        options_text: "",
      })

      await loadTemplateFields(selectedTemplateId)
      setMessage("Field added")
    } catch (err) {
      setError(err.message || "Failed to create field")
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        theme={theme}
        title="Request templates"
        subtitle="Create reusable templates and fields for catalog-backed requests."
      />

      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-400">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Create template</div>

          <div className="mt-4 space-y-4">
            <input
              value={templateForm.name}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Template name"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <textarea
              value={templateForm.description}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className={cn("min-h-[100px] w-full rounded-2xl border px-4 py-3 text-sm outline-none", theme.input)}
            />

            <input
              value={templateForm.request_type}
              onChange={(e) => setTemplateForm((prev) => ({ ...prev, request_type: e.target.value }))}
              placeholder="Request type"
              className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
            />

            <ActionButton theme={theme} onClick={createTemplate}>
              Create template
            </ActionButton>
          </div>

          <div className={cn("my-5 border-t", theme.line)} />

          <div className="text-lg font-semibold">Templates</div>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="text-sm">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-sm">No templates yet.</div>
            ) : (
              templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={cn(
                    "block w-full rounded-2xl border p-4 text-left",
                    selectedTemplateId === template.id ? theme.card : theme.subCard,
                    theme.line
                  )}
                >
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className={cn("mt-1 text-xs", theme.muted)}>
                    {template.request_type}
                  </div>
                </button>
              ))
            )}
          </div>
        </ShellCard>

        <ShellCard theme={theme} className="p-5">
          <div className="text-lg font-semibold">Template fields</div>

          {!selectedTemplateId ? (
            <div className="mt-4 text-sm">Select a template to manage fields.</div>
          ) : (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Field label"
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                />

                <input
                  value={fieldForm.field_key}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, field_key: e.target.value }))}
                  placeholder="field_key"
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                />

                <select
                  value={fieldForm.field_type}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, field_type: e.target.value }))}
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <input
                  value={fieldForm.placeholder}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Placeholder"
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                />

                <input
                  value={fieldForm.help_text}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, help_text: e.target.value }))}
                  placeholder="Help text"
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                />

                <input
                  type="number"
                  value={fieldForm.sort_order}
                  onChange={(e) => setFieldForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                  placeholder="Sort order"
                  className={cn("h-11 w-full rounded-2xl border px-4 text-sm outline-none", theme.input)}
                />

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={fieldForm.is_required}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, is_required: e.target.checked }))}
                  />
                  <span>Required field</span>
                </label>

                {fieldForm.field_type === "select" ? (
                  <textarea
                    value={fieldForm.options_text}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, options_text: e.target.value }))}
                    placeholder={"Options, one per line"}
                    className={cn("min-h-[100px] w-full rounded-2xl border px-4 py-3 text-sm outline-none md:col-span-2", theme.input)}
                  />
                ) : null}
              </div>

              <div className="mt-4">
                <ActionButton theme={theme} onClick={createField}>
                  Add field
                </ActionButton>
              </div>

              <div className={cn("my-5 border-t", theme.line)} />

              <div className="space-y-3">
                {loadingFields ? (
                  <div className="text-sm">Loading fields...</div>
                ) : fields.length === 0 ? (
                  <div className="text-sm">No fields yet.</div>
                ) : (
                  fields.map((field) => (
                    <div
                      key={field.id}
                      className={cn("rounded-2xl border p-4", theme.subCard, theme.line)}
                    >
                      <div className="text-sm font-medium">
                        {field.label} {field.is_required ? "*" : ""}
                      </div>
                      <div className={cn("mt-1 text-xs", theme.muted)}>
                        {field.field_key} • {field.field_type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </ShellCard>
      </div>
    </div>
  )
}
