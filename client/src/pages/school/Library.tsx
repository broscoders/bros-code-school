import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Library as LibraryIcon, BookOpen } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function Library() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "", totalCopies: "1" });
  const [issueForm, setIssueForm] = useState({ bookId: "", studentId: "", dueDate: "" });
  const [msg, setMsg] = useState("");

  const loadBooks = async () => {
    const res = await api.get("/library/books");
    setBooks(res.data);
  };

  useEffect(() => {
    loadBooks();
    if (schoolId) api.get(`/people/students?schoolId=${schoolId}&status=ACTIVE`).then((res) => setStudents(res.data));
  }, [schoolId]);

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/library/books", { ...bookForm, totalCopies: Number(bookForm.totalCopies), availableCopies: Number(bookForm.totalCopies), schoolId });
    setBookForm({ title: "", author: "", category: "", totalCopies: "1" });
    loadBooks();
  };

  const issueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/library/issue", { ...issueForm, schoolId });
      setMsg("Book issued successfully.");
      setIssueForm({ bookId: "", studentId: "", dueDate: "" });
      loadBooks();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Could not issue book");
    }
  };

  const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const issuedBooks = totalBooks - availableBooks;

  return (
    <div className="p-8">
      <p className="section-label">Operations</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
        <LibraryIcon size={22} className="text-primary" />
        Library
      </h1>
      <p className="text-muted mt-1 text-sm">Manage books, copies, and issue/return records.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatCard label="Total Titles" value={books.length} icon={BookOpen} tone="primary" />
        <StatCard label="Total Copies" value={totalBooks} icon={BookOpen} tone="teal" />
        <StatCard label="Currently Issued" value={issuedBooks} icon={BookOpen} tone="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Add Book</h2>
          <form onSubmit={addBook} className="space-y-2">
            <input placeholder="Title" value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} className="w-full" required />
            <input placeholder="Author" value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} className="w-full" />
            <input placeholder="Category" value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} className="w-full" />
            <input type="number" min="1" placeholder="Total Copies" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })} className="w-full" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">
              + Add Book
            </button>
          </form>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Issue Book</h2>
          <form onSubmit={issueBook} className="space-y-2">
            {msg && <p className={`text-xs ${msg.includes("success") ? "text-success" : "text-danger"}`}>{msg}</p>}
            <select value={issueForm.bookId} onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })} className="w-full" required>
              <option value="">Select Book</option>
              {books.filter((b) => b.availableCopies > 0).map((b) => (
                <option key={b._id} value={b._id}>{b.title} ({b.availableCopies} available)</option>
              ))}
            </select>
            <select value={issueForm.studentId} onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })} className="w-full" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
            </select>
            <input type="date" value={issueForm.dueDate} onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })} className="w-full" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">
              Issue Book
            </button>
          </form>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-ink-soft text-left">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Author</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Available / Total</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No books added yet.</td></tr>
            ) : (
              books.map((b) => (
                <tr key={b._id} className="border-t border-border">
                  <td className="p-3 text-ink">{b.title}</td>
                  <td className="p-3 text-muted">{b.author || "-"}</td>
                  <td className="p-3 text-muted">{b.category || "-"}</td>
                  <td className="p-3 text-ink">{b.availableCopies} / {b.totalCopies}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}