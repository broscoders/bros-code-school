import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LayoutDashboard, Users, CalendarCheck, ClipboardCheck, FileText, Award, Megaphone, LogOut, MessageSquare, Calendar, FolderOpen } from "lucide-react";
import AIChatWidget from "../components/AIChatWidget";

const navItems = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/classes", label: "My Classes", icon: Users },
  { to: "/teacher/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/teacher/homework", label: "Homework", icon: ClipboardCheck },
  { to: "/teacher/assignments", label: "Assignments", icon: FileText },
  { to: "/teacher/marks", label: "Marks", icon: Award },
  { to: "/teacher/study-material", label: "Study Material", icon: FolderOpen },
  { to: "/teacher/messages", label: "Messages", icon: MessageSquare },
  { to: "/teacher/ptm", label: "PTM & Hours", icon: Calendar },
  { to: "/teacher/announcements", label: "Announcements", icon: Megaphone },
];

export default function TeacherLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="w-64 bg-primary-dark text-white flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-accent text-primary-dark flex items-center justify-center font-display font-bold text-sm">BC</div>
          <div>
            <h1 className="font-display font-semibold text-sm leading-tight">Bros Code School</h1>
            <p className="text-[11px] text-white/50 tracking-wide">Teacher Portal</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm border-l-2 transition-colors ${isActive ? "bg-white/10 border-accent text-white font-medium" : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"}`}>
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <p className="px-3 text-xs text-white/40 mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-white/60 hover:bg-white/5 hover:text-white w-full">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <AIChatWidget />
      </main>
    </div>
  );
}
