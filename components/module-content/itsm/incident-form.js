"use client"

import { useState } from "react"
import ShellCard from "../shared/shell-card"

export default function ITSMIncidentForm({ theme, tenantSlug }) {
  const [text, setText] = useState("")

  const submit = async () => {
    await fetch(`/api/tenant/${tenantSlug}/incidents`, {
      method: "POST",
      body: JSON.stringify({ shortDescription: text }),
    })
  }

  return (
    <ShellCard theme={theme} className="p-5">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={submit}>Submit</button>
    </ShellCard>
  )
}
