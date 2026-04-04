import { redirect } from "next/navigation"

export default async function TenantIndexPage({ params }) {
  const { slug } = await params
  redirect(`/tenant/${slug}/dashboard`)
}
