import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Check, X, Lock } from "lucide-react";

const ACTIONS = ["view", "create", "edit", "delete"] as const;

export default function RolesPermissions() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [enforced, setEnforced] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [res, mod] = await Promise.all([api.get(`/permissions?schoolId=${schoolId}`), api.get("/permissions/modules")]);
      setPermissions(res.data);
      setModules(mod.data.modules);
      setEnforced(mod.data.enforced || {});
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not load permissions");
    }
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const toggle = async (perm: any, moduleName: string, action: string) => {
    const updatedModules = {
      ...perm.modules,
      [moduleName]: { ...perm.modules[moduleName], [action]: !perm.modules[moduleName]?.[action] },
    };
    setError("");
    try {
      await api.put(`/permissions/${perm._id}`, { modules: updatedModules });
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save the change");
    }
    load();
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Access Control</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Lock size={22} className="text-primary" />Roles &amp; Permissions</h1>
        <p className="text-muted mt-1 text-sm">Configure exactly what each role can view, create, edit, or delete.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-4 mt-6 text-sm text-ink-soft">
        <p>
          Right now these switches are <span className="font-medium text-ink">enforced for:</span>{" "}
          {Object.entries(enforced).map(([m, acts]) => `${m} (${acts.join("/")})`).join(", ")}.
          Other modules are saved but do not block anything yet. The School Admin and Principal always have full access.
        </p>
      </div>
      {error && <p className="text-danger text-sm mt-3">{error}</p>}

      <div className="space-y-6 mt-6">
        {permissions.map((perm) => (
          <div key={perm._id} className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold text-ink">{perm.roleName}</h2>
              {perm.isCustom && <span className="text-[10px] uppercase text-accent bg-accent-soft px-2 py-0.5 rounded-full font-semibold">Custom</span>}
            </div>
            <div className="overflow-x-auto">
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
                    <td className="p-2">{m}{enforced[m] ? <span className="ml-2 text-[10px] uppercase text-success font-semibold">enforced</span> : null}</td>
                    {ACTIONS.map((a) => (
                      <td key={a} className="p-2 text-center">
                        <button disabled={perm.roleName === "SCHOOL_ADMIN"} onClick={() => toggle(perm, m, a)} className="mx-auto flex items-center justify-center disabled:opacity-50">
                          {perm.modules[m]?.[a] ? <Check size={16} className="text-success" /> : <X size={16} className="text-muted/40" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

