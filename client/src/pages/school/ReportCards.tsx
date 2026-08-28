import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import jsPDF from "jspdf";
import { FileBarChart } from "lucide-react";

export default function ReportCards() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (schoolId) api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
  }, [schoolId]);

  const generate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const res = await api.get(`/reports/report-card/${selected}`);
      const data = res.data;
      const summary = data.summary || {};

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(data.school.name || "School Report Card", 20, 20);
      doc.setFontSize(11);
      doc.text(`Student: ${data.student.name}`, 20, 35);
      doc.text(`Admission #: ${data.student.admissionNumber}`, 20, 42);
      doc.text(`Class: ${data.student.class} - ${data.student.section}`, 20, 49);
      doc.text(`Attendance: ${data.attendancePercent}%`, 20, 56);

      doc.setFontSize(13);
      doc.text("Results", 20, 70);
      doc.setFontSize(10);
      let y = 78;
      doc.text("Exam", 20, y);
      doc.text("Marks Obtained", 90, y);
      doc.text("Total Marks", 150, y);
      y += 6;
      data.results.forEach((r: any) => {
        doc.text(String(r.exam || "-"), 20, y);
        doc.text(String(r.marksObtained), 90, y);
        doc.text(String(r.totalMarks || "-"), 150, y);
        y += 7;
      });

      y += 8;
      doc.setFontSize(13);
      doc.text("Overall Summary", 20, y);
      y += 8;
      doc.setFontSize(11);
      doc.text(`Total: ${summary.totalObtained ?? "-"} / ${summary.totalPossible ?? "-"}`, 20, y);
      y += 7;
      doc.text(`Percentage: ${summary.overallPercent ?? "-"}%`, 20, y);
      y += 7;
      doc.setFontSize(12);
      doc.text(`Result: ${summary.overallStatus || "PENDING"}`, 20, y);

      doc.save(`report-card-${data.student.admissionNumber}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <p className="section-label">Academics</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
        <FileBarChart size={22} className="text-primary" />
        Report Card Generator
      </h1>
      <p className="text-muted mt-1 text-sm">Generate a downloadable PDF report card for any student, including overall percentage and pass/fail status.</p>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 max-w-md">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full mb-3">
          <option value="">Select Student</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
        </select>
        <button
          onClick={generate}
          disabled={!selected || generating}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate & Download PDF"}
        </button>
      </div>
    </div>
  );
}