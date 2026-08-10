import { useAuthStore } from "../store/authStore";
import { Users, GraduationCap, UserCheck, Wallet, ClipboardList, Bell } from "lucide-react";

const stats = [
  { label: "Total Students", value: "0", icon: Users, color: "bg-blue-100 text-blue-800" },
  { label: "Total Teachers", value: "0", icon: GraduationCap, color: "bg-green-100 text-green-800" },
  { label: "Present Today", value: "0", icon: UserCheck, color: "bg-emerald-100 text-emerald-800" },
  { label: "Pending Fees", value: "0", icon: Wallet, color: "bg-amber-100 text-amber-800" },
  { label: "Pending Admissions", value: "0", icon: ClipboardList, color: "bg-purple-100 text-purple-800" },
  { label: "Announcements", value: "0", icon: Bell, color: "bg-rose-100 text-rose-800" },
];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h1>
      <p className="text-slate-500 mt-1">Here is what is happening in your school today.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4">
            <div className={`p-3 rounded-full ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5 mt-6">
        <h2 className="font-semibold text-slate-800 mb-2">Needs Attention</h2>
        <p className="text-sm text-slate-500">No pending items right now.</p>
      </div>
    </div>
  );
}
