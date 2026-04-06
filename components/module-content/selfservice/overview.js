"use client"

export default function SelfServiceOverview({ onNavigate }) {
  return (
    <div>
      <button onClick={() => onNavigate("tickets")}>My Tickets</button>
      <button onClick={() => onNavigate("requests")}>My Requests</button>
    </div>
  )
}
