import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useChildStore } from "../store/childStore";
import { LayoutDashboard, CalendarCheck, ClipboardCheck, Award, Wallet, Megaphone, LogOut, MessageSquare, Users, FileWarning } from "lucide-react";
import AIChatWidget from "../components/AIChatWidget";

const navItems = [
  { to: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/parent/homework", label: "Homework", icon: ClipboardCheck },
  { to: "/parent/results", label: "Results", icon: Award },
  { to: "/parent/fees", label: "Fees", icon: Wallet },
  { to: "/parent/messages", label: "Messages", icon: MessageSquare },
  { to: "/parent/ptm", label: "PTM", icon: Users },
  { to: "/parent/leave", label: "Leave Request", icon: FileWarning },
  { to: "/parent/announcements", label: "Announcements", icon: Megaphone },
];

export default function ParentLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const selectedChildId = useChildStore((s) => s.selectedChildId);

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
            <p className="text-[11px] text-muted tracking-wide">Parent Portal</p>
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
          <p className="px-3 text-xs text-muted mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-canvas hover:text-ink w-full">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <AIChatWidget extraBody={{ studentId: selectedChildId }} />
      </main>
    </div>
  );
}
