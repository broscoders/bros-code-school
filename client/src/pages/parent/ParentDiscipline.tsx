import { useEffect, useState } from "react";
import api from "../../services/api";
import { useChildStore } from "../../store/childStore";
import { AlertTriangle } from "lucide-react";

const TYPE_STYLES: Record<string, string> = {
  WARNING: "text-warning bg-warning/10",
  MINOR: "text-accent bg-accent-soft",
  MAJOR: "text-danger bg-danger/10",
};

export default function ParentDiscipline() {
  const { selectedChildId } = useChildStore();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedChildId) {
      setLoading(true);
      api.get(`/system/discipline/mine?studentId=${selectedChildId}`)
        .then((res) => setIncidents(res.data))
        .finally(() => setLoading(false));
    }
  }, [selectedChildId]);

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">My Child</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <AlertTriangle size={22} className="text-primary" />Discipline Records
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : incidents.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-10 text-center text-muted text-sm">
          No discipline records for your child.
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((i) => (
            <div key={i._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex justify-between items-start gap-2">
                <span className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLES[i.incidentType]}`}>{i.incidentType}</span>
                <span className="text-[11px] text-muted">{new Date(i.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-ink mt-2">{i.description}</p>
              {i.actionTaken && <p className="text-xs text-muted mt-2"><span className="font-medium">Action taken:</span> {i.actionTaken}</p>}
              <p className="text-[11px] text-muted mt-2">Status: {i.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
