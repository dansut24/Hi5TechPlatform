import { NextResponse } from "next/server"
import { createIncidentForCurrentUser, getIncidentsForCurrentUser } from "@/lib/incidents"

export async function GET() {
  try {
    const incidents = await getIncidentsForCurrentUser()
    return NextResponse.json({ incidents })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load incidents" },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.shortDescription?.trim()) {
      return NextResponse.json(
        { error: "Short description is required" },
        { status: 400 }
      )
    }

    const incident = await createIncidentForCurrentUser({
      shortDescription: body.shortDescription.trim(),
      description: body.description?.trim() || "",
      priority: body.priority || "medium",
    })

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create incident" },
      { status: 500 }
    )
  }
}
