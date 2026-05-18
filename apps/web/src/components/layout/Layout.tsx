"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Target, CheckSquare, Users,
  Lightbulb, Radar, Calendar, BarChart3,
  LogOut, Menu, X, ChevronDown, Shield, Clock
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard",        icon: LayoutDashboard, label: "Dashboard" },
  { href: "/goals",            icon: Target,           label: "My Goals" },
  { href: "/goals/new",        icon: CheckSquare,      label: "Create Goal",    roles: ["EMPLOYEE"] },
  { href: "/manager/approvals",icon: Clock,            label: "Approval Queue", roles: ["MANAGER", "ADMIN"] },
  { href: "/manager/team",     icon: Users,            label: "Team Dashboard", roles: ["MANAGER", "ADMIN"] },
  { href: "/admin",            icon: Shield,           label: "Admin Panel",    roles: ["ADMIN"] },
  { href: "/innovation",       icon: Lightbulb,        label: "Innovation Hub" },
  { href: "/tech-radar",       icon: Radar,            label: "Tech Radar" },
  { href: "/calendar",         icon: Calendar,         label: "Calendar" },
  { href: "/reports",          icon: BarChart3,        label: "Reports" },
];

function roleLabel(role: string) {
  if (role === "ADMIN") return { label: "Admin", cls: "badge-blue" };
  if (role === "MANAGER") return { label: "Manager", cls: "badge-cyan" };
  return { label: "Employee", cls: "badge-slate" };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      window.location.href = "/login";
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  const role = session.user?.role as string ?? "EMPLOYEE";
  const rl = roleLabel(role);

  const visibleNav = navItems.filter((item) =>
    !item.roles || item.roles.includes(role)
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Target size={18} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">PerformX</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-item ${active ? "nav-item-active" : ""}`}
              >
                <item.icon size={18} className={active ? "text-blue-600" : "text-slate-400"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            {session.user?.image ? (
              <img src={session.user.image} alt={session.user.name ?? ""} className="h-9 w-9 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white uppercase shadow-sm">
                {session.user?.name?.charAt(0) ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{session.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={rl.cls}>{rl.label}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Target size={15} className="text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">PerformX</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="mx-auto max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
