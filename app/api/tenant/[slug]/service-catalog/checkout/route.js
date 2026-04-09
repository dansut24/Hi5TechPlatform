import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

function makeRequestNumber() {
  return `REQ-${Date.now()}`
}

async function getTenantAndUser(slug) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) }
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role")
    .eq("tenant_id", tenant.id)
    .eq("user_id", user.id)
    .single()

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, tenant, user }
}

export async function POST(req, { params }) {
  const { slug } = await params
  const ctx = await getTenantAndUser(slug)
  if (ctx.error) return ctx.error

  const { supabase, tenant, user } = ctx
  const body = await req.json()

  const requestedFor = String(body.requestedFor || "").trim()
  const justification = String(body.justification || "").trim()
  const items = Array.isArray(body.items) ? body.items : []

  if (!requestedFor) {
    return NextResponse.json({ error: "Requested for is required" }, { status: 400 })
  }

  if (!items.length) {
    return NextResponse.json({ error: "Basket is empty" }, { status: 400 })
  }

  const itemIds = items.map((item) => item.catalog_item_id).filter(Boolean)

  const { data: catalogItems, error: catalogError } = await supabase
    .from("service_catalog_items")
    .select("*")
    .eq("tenant_id", tenant.id)
    .in("id", itemIds)

  if (catalogError) {
    return NextResponse.json({ error: catalogError.message }, { status: 500 })
  }

  const catalogMap = new Map((catalogItems || []).map((item) => [item.id, item]))
  const templateIds = [...new Set((catalogItems || []).map((item) => item.template_id).filter(Boolean))]

  let templateFields = []
  if (templateIds.length > 0) {
    const { data, error } = await supabase
      .from("service_request_template_fields")
      .select("*")
      .eq("tenant_id", tenant.id)
      .in("template_id", templateIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    templateFields = data || []
  }

  const templateFieldsByTemplateId = templateFields.reduce((acc, field) => {
    if (!acc[field.template_id]) acc[field.template_id] = []
    acc[field.template_id].push(field)
    return acc
  }, {})

  for (const item of items) {
    const catalogItem = catalogMap.get(item.catalog_item_id)
    if (!catalogItem) {
      return NextResponse.json({ error: "One or more catalog items are invalid" }, { status: 400 })
    }

    if (catalogItem.template_id) {
      const fields = templateFieldsByTemplateId[catalogItem.template_id] || []
      const answers = item.template_answers || {}

      for (const field of fields) {
        if (field.is_required && !String(answers[field.field_key] || "").trim()) {
          return NextResponse.json(
            { error: `Missing required field "${field.label}" for ${catalogItem.name}` },
            { status: 400 }
          )
        }
      }
    }
  }

  const requestNumber = makeRequestNumber()
  const requestType =
    items.length === 1
      ? catalogMap.get(items[0].catalog_item_id)?.name || "Service Catalog Request"
      : `Service Catalog Basket (${items.length} items)`

  const requestNotes = [
    justification ? `Business justification: ${justification}` : null,
    "Submitted from service catalog checkout.",
  ]
    .filter(Boolean)
    .join("\n\n")

  const { data: requestRow, error: requestError } = await supabase
    .from("service_requests")
    .insert({
      tenant_id: tenant.id,
      number: requestNumber,
      request_type: requestType,
      requested_for: requestedFor,
      notes: requestNotes,
      status: "new",
      created_by: user.id,
    })
    .select()
    .single()

  if (requestError) {
    return NextResponse.json({ error: requestError.message }, { status: 500 })
  }

  const requestItemsPayload = items.map((item) => {
    const catalogItem = catalogMap.get(item.catalog_item_id)
    return {
      tenant_id: tenant.id,
      service_request_id: requestRow.id,
      catalog_item_id: catalogItem.id,
      item_name: catalogItem.name,
      quantity: Math.max(1, Number(item.quantity || 1)),
      notes: String(item.notes || "").trim() || null,
    }
  })

  const { data: insertedItems, error: itemsInsertError } = await supabase
    .from("service_request_items")
    .insert(requestItemsPayload)
    .select()

  if (itemsInsertError) {
    return NextResponse.json({ error: itemsInsertError.message }, { status: 500 })
  }

  const insertedItemMap = new Map(
    (insertedItems || []).map((item) => [item.catalog_item_id, item])
  )

  const fieldValueRows = []
  for (const basketItem of items) {
    const catalogItem = catalogMap.get(basketItem.catalog_item_id)
    const insertedRequestItem = insertedItemMap.get(basketItem.catalog_item_id)
    if (!catalogItem?.template_id || !insertedRequestItem) continue

    const fields = templateFieldsByTemplateId[catalogItem.template_id] || []
    const answers = basketItem.template_answers || {}

    for (const field of fields) {
      fieldValueRows.push({
        tenant_id: tenant.id,
        service_request_id: requestRow.id,
        service_request_item_id: insertedRequestItem.id,
        template_field_id: field.id,
        field_key: field.field_key,
        field_label: field.label,
        value_text: String(answers[field.field_key] || "").trim() || null,
      })
    }
  }

  if (fieldValueRows.length > 0) {
    const { error: fieldValueError } = await supabase
      .from("service_request_item_field_values")
      .insert(fieldValueRows)

    if (fieldValueError) {
      return NextResponse.json({ error: fieldValueError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    request: requestRow,
    itemCount: requestItemsPayload.length,
  })
}
