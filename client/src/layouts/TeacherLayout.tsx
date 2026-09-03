import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { LayoutDashboard, Users, CalendarCheck, ClipboardCheck, FileText, Award, Megaphone, LogOut, MessageSquare, Calendar, FolderOpen, ListChecks, BookOpen, BookMarked, GraduationCap, Menu, X } from "lucide-react";
import AIChatWidget from "../components/AIChatWidget";
import ThemeToggle from "../components/ThemeToggle";

const navItems = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/classes", label: "My Classes", icon: Users },
  { to: "/teacher/curriculum", label: "Curriculum", icon: BookMarked },
  { to: "/teacher/timetable", label: "Timetable", icon: Calendar },
  { to: "/teacher/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/teacher/homework", label: "Homework", icon: ClipboardCheck },
  { to: "/teacher/assignments", label: "Assignments", icon: FileText },
  { to: "/teacher/marks", label: "Marks", icon: Award },
  { to: "/teacher/quizzes", label: "Quizzes", icon: ListChecks },
  { to: "/teacher/courses", label: "Courses", icon: BookOpen },
  { to: "/teacher/academy", label: "Academy", icon: GraduationCap },
  { to: "/teacher/study-material", label: "Study Material", icon: FolderOpen },
  { to: "/teacher/messages", label: "Messages", icon: MessageSquare },
  { to: "/teacher/ptm", label: "PTM & Hours", icon: Calendar },
  { to: "/teacher/announcements", label: "Announcements", icon: Megaphone },
];

export default function TeacherLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 flex items-center justify-between gap-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 tab-corner bg-primary text-white flex items-center justify-center font-display font-bold text-sm shrink-0">BC</div>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-sm leading-tight text-ink truncate">Bros Code School</h1>
              <p className="text-[11px] text-muted tracking-wide">Teacher Portal</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted hover:text-ink shrink-0"><X size={20} /></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm transition-colors border-l-2 ${isActive ? "border-l-primary text-primary font-medium bg-primary/[0.07]" : "border-l-transparent text-muted hover:bg-white/5 hover:text-ink hover:border-l-border"}`}>
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="px-3 text-xs text-muted mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-white/5 hover:text-ink w-full">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-ink-soft hover:text-ink"><Menu size={22} /></button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <Outlet />
          <AIChatWidget />
        </main>
      </div>
    </div>
  );
}