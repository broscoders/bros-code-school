import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";

export default function StudentCertificates() {
  const student = useMyStudentRecord();
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    if (student?._id) api.get(`/crm/certificates/my?studentId=${student._id}`).then((res) => setCerts(res.data));
  }, [student]);

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Achievements</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><BadgeCheck size={22} className="text-primary" />My Certificates</h1>
      <div className="space-y-3 mt-6">
        {certs.length === 0 && <p className="text-muted text-sm">No certificates yet.</p>}
        {certs.map((c) => (
          <div key={c._id} className="bg-surface rounded-xl border border-border shadow-sm p-4 flex justify-between items-center">
            <div>
              <h3 className="font-display font-semibold text-primary-dark">{c.title}</h3>
              <p className="text-xs text-muted mt-1">{c.type} Â· Issued {new Date(c.issueDate).toLocaleDateString()}</p>
            </div>
            <span className="text-xs text-accent font-semibold">{c.certificateNumber}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
