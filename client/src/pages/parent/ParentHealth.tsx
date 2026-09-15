import { useEffect, useState } from "react";
import api from "../../services/api";
import { useChildStore } from "../../store/childStore";
import { HeartPulse, AlertTriangle } from "lucide-react";

export default function ParentHealth() {
  const { selectedChildId } = useChildStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedChildId) {
      setLoading(true);
      api.get(`/health/health-profile?studentId=${selectedChildId}`)
        .then((res) => setProfile(res.data))
        .finally(() => setLoading(false));
    }
  }, [selectedChildId]);

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">My Child</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <HeartPulse size={22} className="text-primary" />Health Profile
        </h1>
        <p className="text-muted mt-1 text-sm">Read-only. Contact the school nurse to update this information.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : !profile ? (
        <div className="bg-surface rounded-xl border border-border p-10 text-center text-muted text-sm">
          No health profile has been recorded for your child yet.
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 space-y-4">
          {profile.allergies && (
            <div>
              <p className="text-xs font-semibold text-danger flex items-center gap-1 mb-1"><AlertTriangle size={12} />Allergies</p>
              <p className="text-sm text-ink">{profile.allergies}</p>
            </div>
          )}
          {profile.bloodGroup && (
            <div>
              <p className="text-xs font-semibold text-muted mb-1">Blood Group</p>
              <p className="text-sm text-ink">{profile.bloodGroup}</p>
            </div>
          )}
          {profile.medicalNotes && (
            <div>
              <p className="text-xs font-semibold text-muted mb-1">Medical Notes</p>
              <p className="text-sm text-ink">{profile.medicalNotes}</p>
            </div>
          )}
          {profile.emergencyContactName && (
            <div>
              <p className="text-xs font-semibold text-muted mb-1">Emergency Contact</p>
              <p className="text-sm text-ink">{profile.emergencyContactName} &middot; {profile.emergencyContactPhone}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
