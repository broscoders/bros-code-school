import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, LogOut } from "lucide-react";
import { usePlatformAuthStore } from "../store/platformAuthStore";

const navItems = [
  { to: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/platform/organizations", label: "Organizations", icon: Building2 },
];

export default function PlatformLayout() {
  const admin = usePlatformAuthStore((s) => s.admin);
  const logout = usePlatformAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/platform/login");
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <p className="text-white font-bold text-sm">Platform Admin</p>
          <p className="text-slate-500 text-xs mt-0.5">{admin?.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-amber-500/10 text-amber-400" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
