import { useEffect, useState } from "react";
import api from "../../services/api";
import { GraduationCap, BookOpen, CheckCircle2, Circle } from "lucide-react";

export default function LMSOverview() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/lms/courses/school")
      .then((res) => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Academics</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <GraduationCap size={22} className="text-primary" />LMS Overview
        </h1>
        <p className="text-muted mt-1 text-sm">Courses created by teachers across the school. Course content is managed from each teacher's own account.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : courses.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-10 text-center text-muted text-sm">
          No courses have been created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c._id} className="bg-surface rounded-xl border border-border shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <BookOpen size={18} className="text-primary mt-0.5" />
                {c.isPublished ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={12} />Published
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-muted bg-canvas px-2 py-0.5 rounded-full">
                    <Circle size={12} />Draft
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-ink text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-muted mb-3 line-clamp-2">{c.description || "No description"}</p>
              <div className="flex items-center justify-between text-xs text-muted border-t border-border pt-2">
                <span>{c.classId?.name || "Any class"} · {c.subjectId?.name || "General"}</span>
                <span>{c.lessonCount} {c.lessonCount === 1 ? "lesson" : "lessons"}</span>
              </div>
              <p className="text-[11px] text-muted mt-2">By {c.createdBy?.userId?.name || "Unknown teacher"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
