import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyStudentRecord } from "../../hooks/useMyStudentRecord";
import { BookOpen } from "lucide-react";

export default function StudentCourses() {
  const student = useMyStudentRecord();
  const [courses, setCourses] = useState<any[]>([]);
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);

  const load = async () => {
    const classId = student?.classId?._id || student?.classId;
    if (!classId) return;
    const res = await api.get(`/lms/courses/class?classId=${classId}`);
    setCourses(res.data);
  };

  useEffect(() => {
    if (student) load();
  }, [student]);

  const openCourse = async (course: any) => {
    setActiveCourse(course);
    setActiveLesson(null);
    const res = await api.get(`/lms/lessons?courseId=${course._id}&studentId=${student._id}`);
    setLessons(res.data);
  };

  const openLesson = async (lesson: any) => {
    setActiveLesson(lesson);
    if (lesson.myStatus === "NOT_STARTED") {
      await api.post("/lms/progress", { lessonId: lesson._id, courseId: activeCourse._id, studentId: student._id, status: "IN_PROGRESS" });
      openCourse(activeCourse);
    }
  };

  const [certToast, setCertToast] = useState("");

  const markComplete = async () => {
    if (!activeLesson) return;
    const res = await api.post("/lms/progress", { lessonId: activeLesson._id, courseId: activeCourse._id, studentId: student._id, status: "COMPLETED" });
    if (res.data?.issuedCertificate) {
      setCertToast(`Congratulations! You earned a completion certificate for "${activeCourse.title}".`);
      setTimeout(() => setCertToast(""), 6000);
    }
    openCourse(activeCourse);
    setActiveLesson(null);
  };

  const statusBadge = (status: string) => {
    if (status === "COMPLETED") return <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Completed</span>;
    if (status === "IN_PROGRESS") return <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">In Progress</span>;
    return <span className="text-xs bg-canvas text-muted px-2 py-0.5 rounded-full font-medium">Not Started</span>;
  };

  if (activeCourse && activeLesson) {
    return (
      <div className="p-8 max-w-2xl">
        <button onClick={() => setActiveLesson(null)} className="text-primary text-sm underline mb-4">&larr; Back to Lessons</button>
        <h1 className="font-display text-xl font-bold text-primary-dark">{activeLesson.title}</h1>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mt-4">
          {activeLesson.contentType === "TEXT" && <p className="text-sm text-ink whitespace-pre-wrap">{activeLesson.textContent}</p>}
          {activeLesson.contentType === "VIDEO" && (
            <a href={activeLesson.contentUrl} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Watch video</a>
          )}
          {activeLesson.contentType === "PDF" && (
            <a href={activeLesson.contentUrl} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Open file</a>
          )}
          {activeLesson.contentType === "LINK" && (
            <a href={activeLesson.contentUrl} target="_blank" rel="noreferrer" className="text-primary underline text-sm">Open link</a>
          )}
        </div>

        {activeLesson.myStatus !== "COMPLETED" && (
          <button onClick={markComplete} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 hover:bg-primary-dark transition-colors">
            Mark as Complete
          </button>
        )}
      </div>
    );
  }

  if (activeCourse) {
    const completedCount = lessons.filter((l: any) => l.myStatus === "COMPLETED").length;
    const pct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
    return (
      <div className="p-8">
        <button onClick={() => setActiveCourse(null)} className="text-primary text-sm underline mb-4">&larr; Back to Courses</button>
        <h1 className="font-display text-2xl font-bold text-primary-dark">{activeCourse.title}</h1>
        {certToast && <p className="text-sm text-success bg-success-soft border border-success/30 rounded-lg px-3 py-2 mt-3">{certToast}</p>}
        {lessons.length > 0 && (
          <div className="mt-3 max-w-sm">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>{completedCount}/{lessons.length} lessons complete</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="mt-4 space-y-2">
          {lessons.length === 0 && <p className="text-muted text-sm">No lessons yet.</p>}
          {lessons.map((l: any, i: number) => (
            <button key={l._id} onClick={() => openLesson(l)} className="w-full bg-surface rounded-xl border border-border shadow-sm p-4 flex justify-between items-center text-left hover:border-primary/30 transition-colors">
              <span className="text-sm">{i + 1}. {l.title}</span>
              {statusBadge(l.myStatus)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Learning</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><BookOpen size={22} className="text-primary" />My Courses</h1>
        <p className="text-muted mt-1 text-sm">Structured lessons for your class.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {courses.length === 0 && <p className="text-muted text-sm">No courses available right now.</p>}
        {courses.map((c: any) => (
          <button key={c._id} onClick={() => openCourse(c)} className="bg-surface rounded-xl border border-border shadow-sm p-4 text-left hover:border-primary/30 transition-colors">
            <p className="font-display font-semibold text-ink">{c.title}</p>
            <p className="text-muted text-xs mt-1">{c.subjectId?.name}</p>
            <p className="text-muted text-xs mt-2">{c.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}