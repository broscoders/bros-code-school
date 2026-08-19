import { useEffect, useState } from "react";
import api from "../../services/api";
import { useMyTeacherRecord } from "../../hooks/useMyTeacherRecord";
import FileUpload from "../../components/FileUpload";

export default function TeacherCourses() {
  const teacher = useMyTeacherRecord();
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", classId: "", subjectId: "" });
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonForm, setLessonForm] = useState({ title: "", contentType: "TEXT", contentUrl: "", textContent: "" });
  const [progressSummary, setProgressSummary] = useState<any>(null);

  const load = async () => {
    if (!teacher?._id) return;
    const res = await api.get(`/lms/courses/teacher?teacherId=${teacher._id}`);
    setCourses(res.data);
  };

  useEffect(() => {
    if (teacher?._id) {
      load();
      api.get(`/academics/classes?schoolId=${teacher.schoolId}`).then((res) => setClasses(res.data));
    }
  }, [teacher]);

  useEffect(() => {
    if (form.classId) {
      api.get(`/academics/subjects?classId=${form.classId}`).then((res) => setSubjects(res.data));
    } else {
      setSubjects([]);
    }
  }, [form.classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/lms/courses", { ...form, createdBy: teacher._id });
    setShowForm(false);
    setForm({ title: "", description: "", classId: "", subjectId: "" });
    load();
  };

  const togglePublish = async (course: any) => {
    await api.put(`/lms/courses/${course._id}/publish`, { isPublished: !course.isPublished });
    load();
  };

  const openCourse = async (course: any) => {
    setActiveCourse(course);
    const res = await api.get(`/lms/lessons?courseId=${course._id}`);
    setLessons(res.data);
    const summaryRes = await api.get(`/lms/courses/${course._id}/progress-summary`);
    setProgressSummary(summaryRes.data);
  };

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    await api.post("/lms/lessons", { ...lessonForm, courseId: activeCourse._id });
    setLessonForm({ title: "", contentType: "TEXT", contentUrl: "", textContent: "" });
    openCourse(activeCourse);
  };

  const removeLesson = async (id: string) => {
    await api.delete(`/lms/lessons/${id}`);
    openCourse(activeCourse);
  };

  if (activeCourse) {
    return (
      <div className="p-8">
        <button onClick={() => setActiveCourse(null)} className="text-primary text-sm underline mb-4">&larr; Back to Courses</button>
        <h1 className="font-display text-2xl font-bold text-primary-dark">{activeCourse.title}</h1>

        {progressSummary && (
          <div className="bg-surface rounded-xl border border-black/5 shadow-sm p-4 mt-4">
            <p className="text-sm font-medium text-ink mb-2">Progress ({progressSummary.totalLessons} lessons total)</p>
            {progressSummary.students.length === 0 ? (
              <p className="text-muted text-sm">No student progress yet.</p>
            ) : (
              <ul className="text-sm divide-y divide-black/5">
                {progressSummary.students.map((s: any, i: number) => (
                  <li key={i} className="py-1.5 flex justify-between">
                    <span>{s.name}</span>
                    <span className="text-muted">{s.completedCount}/{progressSummary.totalLessons} completed</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={addLesson} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-4 space-y-2">
          <p className="text-sm font-medium text-ink">Add Lesson</p>
          <input placeholder="Lesson Title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" required />
          <select value={lessonForm.contentType} onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm">
            <option value="TEXT">Text</option>
            <option value="VIDEO">Video (URL)</option>
            <option value="PDF">PDF / File</option>
            <option value="LINK">External Link</option>
          </select>
          {lessonForm.contentType === "TEXT" ? (
            <textarea placeholder="Lesson content" value={lessonForm.textContent} onChange={(e) => setLessonForm({ ...lessonForm, textContent: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" rows={4} />
          ) : lessonForm.contentType === "PDF" ? (
            <FileUpload folder="bros-code-school/lms" onUploaded={(url) => setLessonForm({ ...lessonForm, contentUrl: url })} label="Upload file" />
          ) : (
            <input placeholder="URL" value={lessonForm.contentUrl} onChange={(e) => setLessonForm({ ...lessonForm, contentUrl: e.target.value })} className="w-full border border-black/10 rounded-md px-3 py-2 text-sm" />
          )}
          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">+ Add Lesson</button>
        </form>

        <div className="mt-4 space-y-2">
          {lessons.length === 0 && <p className="text-muted text-sm">No lessons yet.</p>}
          {lessons.map((l, i) => (
            <div key={l._id} className="bg-surface rounded-xl border border-black/5 shadow-sm p-3 flex justify-between items-center">
              <span className="text-sm">{i + 1}. {l.title} <span className="text-muted text-xs">({l.contentType})</span></span>
              <button onClick={() => removeLesson(l._id)} className="text-danger text-xs underline">Remove</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent font-semibold">Learning</p>
          <h1 className="font-display text-2xl font-bold text-primary-dark mt-1">Courses</h1>
          <p className="text-muted mt-1 text-sm">Structured lessons for your classes.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors">
          {showForm ? "Cancel" : "+ New Course"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-black/5 shadow-sm p-5 mt-4 grid grid-cols-2 gap-3">
          <input placeholder="Course Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm col-span-2" rows={2} />
          <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" required>
            <option value="">Select Class</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="border border-black/10 rounded-md px-3 py-2 text-sm" disabled={!form.classId}>
            <option value="">Select Subject</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium col-span-2 hover:bg-primary-light transition-colors">Create Course</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {courses.length === 0 && <p className="text-muted text-sm">No courses yet.</p>}
        {courses.map((c) => (
          <div key={c._id} className="bg-surface rounded-xl border border-black/5 shadow-sm p-4 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openCourse(c)}>
            <div className="flex justify-between items-start">
              <p className="font-display font-semibold text-ink">{c.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isPublished ? "bg-success/10 text-success" : "bg-canvas text-muted"}`}>
                {c.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-muted text-xs mt-1">{c.subjectId?.name}</p>
            <button
              onClick={(e) => { e.stopPropagation(); togglePublish(c); }}
              className="text-primary text-xs underline mt-2"
            >
              {c.isPublished ? "Unpublish" : "Publish"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
