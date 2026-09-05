import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Health() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const userId = useAuthStore((s) => s.user?.id);
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [profile, setProfile] = useState({ studentId: "", bloodGroup: "", allergies: "", emergencyContactName: "", emergencyContactPhone: "", medicalNotes: "" });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentForm, setIncidentForm] = useState({ studentId: "", description: "", actionTaken: "", severity: "MINOR" });
  const [msg, setMsg] = useState("");

  const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-warning/10 text-warning",
    MONITORING: "bg-accent-soft text-accent",
    RESOLVED: "bg-success/10 text-success",
    REFERRED_TO_HOSPITAL: "bg-danger/10 text-danger",
  };
  const SEVERITY_COLORS: Record<string, string> = {
    MINOR: "bg-white/5 text-muted",
    MODERATE: "bg-accent-soft text-accent",
    SEVERE: "bg-danger/10 text-danger",
    EMERGENCY: "bg-danger text-white",
  };

  useEffect(() => {
    if (schoolId) {
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
      api.get(`/health/medical-incidents?schoolId=${schoolId}`).then((res) => setIncidents(res.data));
    }
  }, [schoolId]);

  useEffect(() => {
    if (selected) {
      api.get(`/health/health-profile?studentId=${selected}`).then((res) => {
        if (res.data) {
          setProfile(res.data);
        } else {
          setProfile({ studentId: selected, bloodGroup: "", allergies: "", emergencyContactName: "", emergencyContactPhone: "", medicalNotes: "" });
        }
      });
    }
  }, [selected]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/health/health-profile", { ...profile, schoolId, studentId: selected });
    setMsg("Health profile saved.");
    setTimeout(() => setMsg(""), 2500);
  };

  const logIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/health/medical-incidents", { ...incidentForm, schoolId, recordedBy: userId });
    setIncidentForm({ studentId: "", description: "", actionTaken: "", severity: "MINOR" });
    const res = await api.get(`/health/medical-incidents?schoolId=${schoolId}`);
    setIncidents(res.data);
  };

  const updateIncident = async (id: string, field: string, value: any) => {
    await api.put(`/health/medical-incidents/${id}`, { [field]: value });
    const res = await api.get(`/health/medical-incidents?schoolId=${schoolId}`);
    setIncidents(res.data);
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Wellbeing</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">Health & Medical Records</h1>
        <p className="text-muted mt-1 text-sm">Manage student health profiles and incidents. Access is restricted to authorized staff.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Health Profile</h2>
          {msg && <p className="text-success text-sm mb-2">{msg}</p>}
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2">
            <option value="">Select Student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name}</option>)}
          </select>
          {selected && (
            <form onSubmit={saveProfile} className="space-y-2">
              <input placeholder="Blood Group" value={profile.bloodGroup} onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Allergies" value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Emergency Contact Name" value={profile.emergencyContactName} onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Emergency Contact Phone" value={profile.emergencyContactPhone} onChange={(e) => setProfile({ ...profile, emergencyContactPhone: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
              <textarea placeholder="Medical Notes" value={profile.medicalNotes} onChange={(e) => setProfile({ ...profile, medicalNotes: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" rows={2} />
              <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">Save Profile</button>
            </form>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Log Medical Incident</h2>
          <form onSubmit={logIncident} className="space-y-2 mb-4">
            <select value={incidentForm.studentId} onChange={(e) => setIncidentForm({ ...incidentForm, studentId: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name}</option>)}
            </select>
            <textarea placeholder="What happened" value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" rows={2} required />
            <textarea placeholder="Action taken (first aid, sent home, etc.)" value={incidentForm.actionTaken} onChange={(e) => setIncidentForm({ ...incidentForm, actionTaken: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" rows={2} required />
            <select value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              <option value="MINOR">Minor</option>
              <option value="MODERATE">Moderate (parent auto-notified)</option>
              <option value="SEVERE">Severe (parent auto-notified)</option>
              <option value="EMERGENCY">Emergency (parent auto-notified)</option>
            </select>
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">+ Log Incident</button>
          </form>
          <ul className="text-sm divide-y divide-black/5 max-h-64 overflow-y-auto">
            {incidents.length === 0 && <li className="py-2 text-muted">No incidents logged.</li>}
            {incidents.map((i) => (
              <li key={i._id} className="py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{i.studentId?.userId?.name}</p>
                  <div className="flex gap-1.5 items-center shrink-0">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${SEVERITY_COLORS[i.severity]}`}>{i.severity}</span>
                    <select
                      value={i.status}
                      onChange={(e) => updateIncident(i._id, "status", e.target.value)}
                      className={`text-[10px] font-medium rounded-full px-1.5 py-0.5 border-0 ${STATUS_COLORS[i.status]}`}
                    >
                      <option value="OPEN">Open</option>
                      <option value="MONITORING">Monitoring</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="REFERRED_TO_HOSPITAL">Referred to Hospital</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-muted mt-1">{i.description}</p>
                {i.parentNotified && <p className="text-[10px] text-success mt-1">Parent notified</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

