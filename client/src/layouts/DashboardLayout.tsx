import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import api from "../services/api";
import {
  LayoutDashboard, Users, GraduationCap, CalendarCheck, BookOpen, Wallet, Megaphone,
  LogOut, ClipboardCheck, FileText, Award, ClipboardList, Boxes, ShieldCheck,
  FileWarning, MessageSquareText, Settings as SettingsIcon, Phone, BadgeCheck,
  AlertTriangle, IdCard, Lock, Calendar, FolderOpen, Zap, FileBarChart,
  Library as LibraryIcon, Bus, GraduationCap as LMSIcon, MonitorCheck, Globe, Plug, Smartphone,
  Menu, X, Search, ChevronDown,
} from "lucide-react";
import AIChatWidget from "../components/AIChatWidget";
import NotificationBell from "../components/NotificationBell";
import GlobalSearch from "../components/GlobalSearch";
import ThemeToggle from "../components/ThemeToggle";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

// Grouped by the actual rhythm of a school office day, not alphabetically -
// front-desk & admissions first, then the academic spine, then money,
// then day-to-day operations, then outward-facing/growth, then admin controls.
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "People & Admissions",
    items: [
      { to: "/admissions", label: "Admissions", icon: ClipboardList },
      { to: "/students", label: "Students", icon: Users },
      { to: "/parents", label: "Parents", icon: Users },
      { to: "/teachers", label: "Teachers", icon: GraduationCap },
      { to: "/hr", label: "HR / Staff", icon: Users },
    ],
  },
  {
    label: "Academics",
    items: [
      { to: "/academics", label: "Academics", icon: BookOpen },
      { to: "/timetable", label: "Timetable", icon: Calendar },
      { to: "/attendance", label: "Attendance", icon: CalendarCheck },
      { to: "/homework", label: "Homework", icon: ClipboardCheck },
      { to: "/assignments", label: "Assignments", icon: FileText },
      { to: "/exams", label: "Exams & Results", icon: Award },
      { to: "/report-cards", label: "Report Cards", icon: FileBarChart },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/fees", label: "Fees", icon: Wallet },
      { to: "/accounting", label: "Accounting", icon: Wallet },
      { to: "/payroll", label: "Payroll", icon: Wallet },
    ],
  },
  {
    label: "Campus Operations",
    items: [
      { to: "/hostel", label: "Hostel", icon: Boxes },
      { to: "/inventory-assets", label: "Inventory & Assets", icon: Boxes },
      { to: "/maintenance", label: "Maintenance", icon: AlertTriangle },
      { to: "/discipline", label: "Discipline", icon: AlertTriangle },
      { to: "/visitors", label: "Visitors", icon: Users },
      { to: "/health", label: "Health & Medical", icon: AlertTriangle },
      { to: "/leave-requests", label: "Leave Requests", icon: FileWarning },
      { to: "/library", label: "Library", icon: LibraryIcon },
      { to: "/transport", label: "Transport", icon: Bus },
      { to: "/operations", label: "Operations", icon: Boxes },
    ],
  },
  {
    label: "Growth & Communication",
    items: [
      { to: "/crm", label: "Leads / CRM", icon: Phone },
      { to: "/academy", label: "Academy", icon: Boxes },
      { to: "/certificates", label: "Certificates", icon: BadgeCheck },
      { to: "/id-cards", label: "ID Cards", icon: IdCard },
      { to: "/documents", label: "Documents", icon: FolderOpen },
      { to: "/automation", label: "Automation", icon: Zap },
      { to: "/announcements", label: "Announcements", icon: Megaphone },
      { to: "/surveys", label: "Surveys", icon: MessageSquareText },
      { to: "/calendar", label: "Calendar", icon: Calendar },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/reports", label: "Reports & Analytics", icon: FileBarChart },
      { to: "/roles-permissions", label: "Roles & Permissions", icon: Lock },
      { to: "/audit-logs", label: "Audit Logs", icon: ShieldCheck },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const comingSoonItems = [
  { label: "LMS", icon: LMSIcon },
  { label: "Online Exams", icon: MonitorCheck },
  { label: "Website CMS", icon: Globe },
  { label: "Integrations", icon: Plug },
  { label: "Mobile Apps", icon: Smartphone },
];

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [school, setSchool] = useState<{ name: string; logoUrl?: string } | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user?.schoolId) return;
    api
      .get("/schools/" + user.schoolId)
      .then((res) => setSchool(res.data))
      .catch(() => {});
  }, [user?.schoolId]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const schoolName = school?.name || "Bros Code School";
  const initials = schoolName
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const query = sidebarSearch.trim().toLowerCase();
  const isSearching = query.length > 0;

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(query)),
    }))
    .filter((group) => group.items.length > 0);

  const filteredComingSoon = comingSoonItems.filter((item) => item.label.toLowerCase().includes(query));

  const currentLabel =
    navGroups.flatMap((g) => g.items).find((item) => location.pathname.startsWith(item.to))?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-canvas">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex items-center justify-between gap-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            {school?.logoUrl ? (
              <img src={school.logoUrl} alt={schoolName} className="w-10 h-10 tab-corner object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 tab-corner bg-primary text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-sm leading-tight text-ink truncate">{schoolName}</h1>
              <p className="text-[11px] text-muted tracking-wide">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted hover:text-ink shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search menu..."
              className="w-full pl-8 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {filteredGroups.map((group) => {
            const collapsed = !isSearching && collapsedGroups[group.label];
            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-2 group"
                >
                  <span className="section-label">{group.label}</span>
                  <ChevronDown
                    size={13}
                    className={`text-muted transition-transform ${collapsed ? "-rotate-90" : ""}`}
                  />
                </button>
                {!collapsed && (
                  <div className="space-y-0.5 mb-2">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `relative flex items-center gap-3 pl-4 pr-3 py-2 text-sm transition-colors border-l-2 ${
                            isActive
                              ? "border-l-primary text-primary font-medium bg-primary/[0.07]"
                              : "border-l-transparent text-ink-soft hover:bg-white/5 hover:text-ink hover:border-l-border"
                          }`
                        }
                      >
                        <item.icon size={16} />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredGroups.length === 0 && filteredComingSoon.length === 0 && (
            <p className="text-xs text-muted text-center py-4">No menu items match "{sidebarSearch}"</p>
          )}

          {filteredComingSoon.length > 0 && (
            <div className="pt-3 mt-2 border-t border-border">
              <p className="px-3 section-label mb-1.5">Coming Soon</p>
              {filteredComingSoon.map((item) => (
                <div
                  key={item.label}
                  title="Coming soon"
                  className="flex items-center gap-3 pl-4 pr-3 py-2 text-sm text-muted/50 cursor-not-allowed select-none border-l-2 border-l-transparent"
                >
                  <item.icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[9px] uppercase tracking-wide bg-white/5 border border-border rounded-full px-1.5 py-0.5">
                    Soon
                  </span>
                </div>
              ))}
            </div>
          )}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-soft hover:bg-white/5 hover:text-ink w-full"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-ink-soft hover:text-ink shrink-0">
            <Menu size={22} />
          </button>
          <p className="hidden lg:block text-sm text-ink-soft font-medium shrink-0">{currentLabel}</p>
          <GlobalSearch />
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            <div className="w-8 h-8 tab-corner bg-primary/15 text-primary flex items-center justify-center font-display font-semibold text-xs">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-20">
          <Outlet />
          <AIChatWidget />
        </main>
      </div>
    </div>
  );
}
