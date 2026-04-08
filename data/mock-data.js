import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  Cpu,
  Gauge,
  Grid3X3,
  LayoutDashboard,
  Lock,
  Monitor,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  UserCircle2,
  Users,
  Workflow,
  Wrench,
} from "lucide-react"

export const modules = [
  {
    id: "itsm",
    title: "ITSM",
    description: "Incidents, requests, changes, problems, knowledge, and service operations.",
    icon: Ticket,
    badge: "Core",
  },
  {
    id: "control",
    title: "Control (RMM)",
    description: "Devices, monitoring, remote support, patching, and operational actions.",
    icon: Monitor,
    badge: "Ops",
  },
  {
    id: "selfservice",
    title: "SelfService",
    description: "End-user portal for requests, tickets, approvals, and knowledge.",
    icon: UserCircle2,
    badge: "Portal",
  },
  {
    id: "admin",
    title: "Admin",
    description: "Tenant administration, branding, security, users, and configuration.",
    icon: Shield,
    badge: "Admin",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "KPIs, trends, forecasting, and cross-platform reporting.",
    icon: BarChart3,
    badge: "Insight",
  },
  {
    id: "automation",
    title: "Automation Hub",
    description: "Workflow orchestration, triggers, runs, and service automation.",
    icon: Cpu,
    badge: "Advanced",
  },
]

export const navByModule = {
  itsm: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "incidents", label: "Incidents", icon: Ticket },
    { id: "requests", label: "Requests", icon: ClipboardList },
    { id: "changes", label: "Changes", icon: Workflow },
    { id: "problems", label: "Problems", icon: AlertTriangle },
    { id: "assets", label: "Assets", icon: Monitor },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ],

  control: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "devices", label: "Devices", icon: Monitor },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "patching", label: "Patching", icon: Wrench },
    { id: "remote", label: "Remote Tools", icon: Activity },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ],

  selfservice: [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "tickets", label: "My Tickets", icon: Ticket },
    { id: "requests", label: "My Requests", icon: ClipboardList },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
  ],

  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "tenants", label: "Tenants", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "security", label: "Security", icon: Shield },
    { id: "branding", label: "Branding", icon: Sparkles },
    { id: "modules", label: "Modules", icon: Grid3X3 },
    { id: "groups", label: "Groups", icon: Users },
    { id: "permissions", label: "Module Permissions", icon: Lock },
    { id: "control-capabilities", label: "Control Permissions", icon: Shield },
  ],

  analytics: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "kpis", label: "KPIs", icon: Gauge },
    { id: "services", label: "Services", icon: BarChart3 },
    { id: "forecasting", label: "Forecasting", icon: Activity },
  ],

  automation: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "flows", label: "Flows", icon: Workflow },
    { id: "triggers", label: "Triggers", icon: Bell },
    { id: "runs", label: "Runs", icon: Activity },
  ],
}

export const platformItems = [
  { label: "Home", icon: LayoutDashboard },
  { label: "Account Settings", icon: Settings },
  { label: "Theme", icon: Sparkles },
  { label: "Notifications", icon: Bell },
  { label: "Support", icon: UserCircle2 },
  { label: "Docs", icon: BookOpen },
]
