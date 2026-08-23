import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useRef } from "react";
import { LayoutDashboard, CalendarCheck, ClipboardCheck, FileText, Award, Megaphone, LogOut, ShoppingBag, BadgeCheck, Calendar, ListChecks, BookOpen, GraduationCap } from "lucide-react";
import AIChatWidget from "../components/AIChatWidget";

const navItems = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/student/timetable", label: "Timetable", icon: Calendar },
  { to: "/student/homework", label: "Homework", icon: ClipboardCheck },
  { to: "/student/assignments", label: "Assignments", icon: FileText },
  { to: "/student/results", label: "Results", icon: Award },
  { to: "/student/quizzes", label: "Quizzes", icon: ListChecks },
  { to: "/student/courses", label: "Courses", icon: BookOpen },
  { to: "/student/academy", label: "Academy", icon: GraduationCap },
  { to: "/student/store", label: "Notes Store", icon: ShoppingBag },
  { to: "/student/certificates", label: "Certificates", icon: BadgeCheck },
  { to: "/student/announcements", label: "Announcements", icon: Megaphone },
];

export default function StudentLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-5 flex items-center gap-3 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-display font-bold text-sm">BC</div>
          <div>
            <h1 className="font-display font-semibold text-sm leading-tight text-ink">Bros Code School</h1>
            <p className="text-[11px] text-muted tracking-wide">Student Portal</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? "bg-primary text-white font-medium shadow-sm" : "text-muted hover:bg-canvas hover:text-ink"}`}>
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="px-3 text-xs text-muted mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-canvas hover:text-ink w-full">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
      <main ref={mainRef} className="flex-1 overflow-y-auto">
        <Outlet />
        <AIChatWidget />
      </main>
    </div>
  );
}




