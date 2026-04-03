import { themeMap } from "@/lib/themes"

export default function MarketingPage() {
  const theme = { ...themeMap.midnight, resolved: "midnight" }

  return (
    <div className={`min-h-screen ${theme.app}`}>
      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${theme.card}`}>
              <span className="text-base font-semibold">H</span>
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">Hi5Tech</div>
              <div className={`text-xs ${theme.muted}`}>ITSM + RMM Platform</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className={`rounded-2xl border px-4 py-2 text-sm transition ${theme.card} ${theme.hover}`}
            >
              Sign in
            </a>
            <a
              href="/login?mode=signup&next=/create-workspace&trial=1"
              className={
                theme.resolved === "light"
                  ? "rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white"
                  : "rounded-2xl bg-white px-4 py-2 text-sm text-slate-950"
              }
            >
              Start free trial
            </a>
          </div>
        </header>

        <main className="grid min-h-[calc(100vh-100px)] items-center gap-10 py-12 lg:grid-cols-[1.15fr,0.85fr]">
          <section>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs ${theme.card} ${theme.muted}`}>
              14-day free trial
            </div>

            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight lg:text-7xl">
              Run your service desk, endpoint control, self-service, and automation from one workspace.
            </h1>

            <p className={`mt-5 max-w-2xl text-base lg:text-lg ${theme.muted}`}>
              Hi5Tech brings together ITSM, RMM, knowledge, workflows, and tenant administration in a single modern platform for MSPs and IT teams.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/login?mode=signup&next=/create-workspace&trial=1"
                className={
                  theme.resolved === "light"
                    ? "rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white"
                    : "rounded-2xl bg-white px-5 py-3 text-sm text-slate-950"
                }
              >
                Start your free trial
              </a>

              <a
                href="/login"
                className={`rounded-2xl border px-5 py-3 text-sm transition ${theme.card} ${theme.hover}`}
              >
                Sign in
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["ITSM", "Incidents, requests, changes, knowledge"],
                ["Control", "RMM, remote tools, patching, device ops"],
                ["Admin", "Tenants, users, groups, module access"],
              ].map(([title, desc]) => (
                <div key={title} className={`rounded-[24px] border p-4 ${theme.card}`}>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className={`mt-2 text-sm ${theme.muted}`}>{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-[32px] border p-6 shadow-2xl backdrop-blur-2xl ${theme.card}`}>
            <div className="text-xl font-semibold">What’s included in the trial</div>
            <div className={`mt-2 text-sm ${theme.muted}`}>
              Spin up your workspace and start configuring modules immediately.
            </div>

            <div className="mt-6 space-y-3">
              {[
                "Tenant workspace provisioning",
                "ITSM and Control modules enabled",
                "User and group administration",
                "Module-based access control",
                "Invite-ready tenant model",
              ].map((item) => (
                <div key={item} className={`rounded-2xl border px-4 py-3 text-sm ${theme.card}`}>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border p-5">
              <div className="text-sm font-medium">Recommended flow</div>
              <div className={`mt-2 text-sm ${theme.muted}`}>
                Create account → create workspace → choose modules → invite users → enter the tenant app.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
