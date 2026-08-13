import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LayoutDashboard, Users, GraduationCap, CalendarCheck, BookOpen, Wallet, Megaphone, LogOut, ClipboardCheck, FileText, Award, ClipboardList, Boxes, ShieldCheck, FileWarning, MessageSquareText, Settings as SettingsIcon, Phone, BadgeCheck, AlertTriangle, IdCard, Lock, Calendar } from "lucide-react";
import AIChatWidget from "../components/AIChatWidget";
import NotificationBell from "../components/NotificationBell";
import GlobalSearch from "../components/GlobalSearch";
import { FileBarChart } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/academics", label: "Academics", icon: BookOpen },
  { to: "/homework", label: "Homework", icon: ClipboardCheck },
  { to: "/assignments", label: "Assignments", icon: FileText },
  { to: "/exams", label: "Exams & Results", icon: Award },
  { to: "/admissions", label: "Admissions", icon: ClipboardList },
  { to: "/crm", label: "Leads / CRM", icon: Phone },
  { to: "/academy", label: "Academy", icon: Boxes },
  { to: "/certificates", label: "Certificates", icon: BadgeCheck },
  { to: "/id-cards", label: "ID Cards", icon: IdCard },
  { to: "/discipline", label: "Discipline", icon: AlertTriangle },
  { to: "/fees", label: "Fees", icon: Wallet },
  { to: "/accounting", label: "Accounting", icon: Wallet },
  { to: "/hr", label: "HR / Staff", icon: Users },
  { to: "/payroll", label: "Payroll", icon: Wallet },
  { to: "/hostel", label: "Hostel", icon: Boxes },
  { to: "/inventory-assets", label: "Inventory & Assets", icon: Boxes },
  { to: "/maintenance", label: "Maintenance", icon: AlertTriangle },
  { to: "/visitors", label: "Visitors", icon: Users },
  { to: "/health", label: "Health & Medical", icon: AlertTriangle },
  { to: "/leave-requests", label: "Leave Requests", icon: FileWarning },
  { to: "/surveys", label: "Surveys", icon: MessageSquareText },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/report-cards", label: "Report Cards", icon: FileBarChart },
  { to: "/reports", label: "Reports & Analytics", icon: FileBarChart },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
  { to: "/operations", label: "Operations", icon: Boxes },
  { to: "/roles-permissions", label: "Roles & Permissions", icon: Lock },
  { to: "/audit-logs", label: "Audit Logs", icon: ShieldCheck },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="w-64 bg-surface border-r border-black/5 flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-black/5">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-display font-bold text-sm">BC</div>
          <div>
            <h1 className="font-display font-semibold text-sm leading-tight text-ink">Bros Code School</h1>
            <p className="text-[11px] text-muted tracking-wide">{user?.role}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-primary text-white font-medium shadow-sm" : "text-muted hover:bg-canvas hover:text-ink"}`}>
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-black/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-canvas hover:text-ink w-full">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-surface border-b border-black/5 flex items-center justify-between px-6">
          <GlobalSearch />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-semibold text-xs">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
          <AIChatWidget />
        </main>
      </div>
    </div>
  );
}
