import { useEffect, useState } from "react";
import platformApi from "../../services/platformApi";

export default function PlatformDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    platformApi.get("/stats").then((res) => setStats(res.data));
  }, []);

  const cards = stats
    ? [
        { label: "Total Organizations", value: stats.totalOrganizations },
        { label: "Active Organizations", value: stats.activeOrganizations },
        { label: "Suspended Organizations", value: stats.suspendedOrganizations },
        { label: "Total Schools/Branches", value: stats.totalSchools },
        { label: "Total Students", value: stats.totalStudents },
        { label: "Total Teachers", value: stats.totalTeachers },
        { label: "Total Staff", value: stats.totalStaff },
      ]
    : [];

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-amber-500 font-semibold">Platform</p>
      <h1 className="text-2xl font-bold text-white mt-1">Overview</h1>
      <p className="text-slate-400 mt-1 text-sm">Cross-organization platform statistics.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-xs">{c.label}</p>
            <p className="text-white text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {stats?.recentOrganizations?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl mt-6 overflow-hidden">
          <p className="text-white text-sm font-semibold p-4 border-b border-slate-800">Recently Registered</p>
          <table className="w-full text-sm">
            <tbody>
              {stats.recentOrganizations.map((org: any) => (
                <tr key={org._id} className="border-t border-slate-800">
                  <td className="p-3 text-white">{org.name}</td>
                  <td className="p-3 text-slate-400">{org.type}</td>
                  <td className="p-3 text-slate-400">{org.status}</td>
                  <td className="p-3 text-slate-500 text-xs">{new Date(org.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
