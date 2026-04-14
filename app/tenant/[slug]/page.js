import { redirect } from "next/navigation"

export default async function TenantIndexPage({ params }) {
  const { slug } = params
  redirect(`/tenant/${slug}/dashboard`)
}
