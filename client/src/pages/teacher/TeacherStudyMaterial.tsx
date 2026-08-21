import { useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import FileUpload from "../../components/FileUpload";

export default function TeacherStudyMaterial() {
  const teacher = useMyTeacherRecord();
  const [form, setForm] = useState({ classId: "", subjectId: "", title: "", chapter: "", fileUrl: "" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileUrl) {
      setMsg("Please attach a file first.");
      return;
    }
    await api.post("/comm/study-material", { ...form, schoolId: teacher.schoolId, teacherId: teacher._id });
    setForm({ classId: "", subjectId: "", title: "", chapter: "", fileUrl: "" });
    setMsg("Study material uploaded.");
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Teaching</p>
      <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Study Material</h1>
      <p className="text-muted mt-1 text-sm">Upload notes, PDFs and resources for your classes.</p>

      <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-6 grid grid-cols-2 gap-3">
        {msg && <p className="text-success text-sm col-span-2">{msg}</p>}
        <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Class</option>
          {teacher?.assignedClasses?.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm" required>
          <option value="">Select Subject</option>
          {teacher?.subjects?.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" required />
        <input placeholder="Chapter / Topic" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} className="border border-border rounded-md px-3 py-2 text-sm col-span-2" />
        <FileUpload folder="bros-code-school/study-material" onUploaded={(url) => setForm({ ...form, fileUrl: url })} label="Attach PDF or file" />
        <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">+ Upload Material</button>
      </form>
    </div>
  );
}
