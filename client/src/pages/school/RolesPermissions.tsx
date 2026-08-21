import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Check, X } from "lucide-react";

const ACTIONS = ["view", "create", "edit", "delete"] as const;

export default function RolesPermissions() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [newRole, setNewRole] = useState("");

  const load = async () => {
    const res = await api.get(`/permissions?schoolId=${schoolId}`);
    setPermissions(res.data);
    const mod = await api.get("/permissions/modules");
    setModules(mod.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const toggle = async (perm: any, moduleName: string, action: string) => {
    const updatedModules = {
      ...perm.modules,
      [moduleName]: { ...perm.modules[moduleName], [action]: !perm.modules[moduleName]?.[action] },
    };
    await api.put(`/permissions/${perm._id}`, { modules: updatedModules });
    load();
  };

  const addCustomRole = async () => {
    if (!newRole.trim()) return;
    await api.post("/permissions/custom-role", { schoolId, roleName: newRole });
    setNewRole("");
    load();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Access Control</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Roles & Permissions</h1>
      <p className="text-muted mt-1 text-sm">Configure exactly what each role can view, create, edit, or delete.</p>

      <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 mt-6 flex gap-2">
        <input placeholder="New custom role name (e.g. Campus Coordinator)" value={newRole} onChange={(e) => setNewRole(e.target.value)} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm" />
        <button onClick={addCustomRole} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">+ Create Role</button>
      </div>

      <div className="space-y-6 mt-6">
        {permissions.map((perm) => (
          <div key={perm._id} className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold text-ink">{perm.roleName}</h2>
              {perm.isCustom && <span className="text-[10px] uppercase text-accent bg-accent-soft px-2 py-0.5 rounded-full font-semibold">Custom</span>}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-canvas text-ink text-left">
                <tr>
                  <th className="p-2 font-medium">Module</th>
                  {ACTIONS.map((a) => <th key={a} className="p-2 font-medium capitalize text-center">{a}</th>)}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m} className="border-t border-border">
                    <td className="p-2">{m}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} className="p-2 text-center">
                        <button onClick={() => toggle(perm, m, a)} className="mx-auto flex items-center justify-center">
                          {perm.modules[m]?.[a] ? <Check size={16} className="text-success" /> : <X size={16} className="text-muted/40" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

