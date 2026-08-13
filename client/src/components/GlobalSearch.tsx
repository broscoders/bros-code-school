import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { Search } from "lucide-react";

export default function GlobalSearch() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const search = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    const res = await api.get(`/search?q=${val}&schoolId=${schoolId}`);
    setResults(res.data);
    setOpen(true);
  };

  const hasResults = results && (results.students?.length || results.teachers?.length || results.leads?.length || results.books?.length);

  return (
    <div className="relative w-80">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search students, teachers, leads..."
          className="w-full border border-black/10 rounded-lg pl-9 pr-3 py-2 text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {open && (
        <div className="absolute mt-2 w-full bg-surface rounded-xl shadow-lg border border-black/10 z-50 max-h-96 overflow-y-auto">
          {!hasResults ? (
            <p className="p-4 text-sm text-muted">No results found.</p>
          ) : (
            <>
              {results.students?.length > 0 && (
                <div className="p-2">
                  <p className="text-[10px] uppercase text-muted px-2 mb-1">Students</p>
                  {results.students.map((s: any) => (
                    <button key={s._id} onClick={() => { navigate("/students"); setOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-canvas text-sm">
                      {s.userId?.name} <span className="text-muted text-xs">({s.admissionNumber})</span>
                    </button>
                  ))}
                </div>
              )}
              {results.teachers?.length > 0 && (
                <div className="p-2 border-t border-black/5">
                  <p className="text-[10px] uppercase text-muted px-2 mb-1">Teachers</p>
                  {results.teachers.map((t: any) => (
                    <button key={t._id} onClick={() => { navigate("/teachers"); setOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-canvas text-sm">
                      {t.userId?.name} <span className="text-muted text-xs">({t.employeeId})</span>
                    </button>
                  ))}
                </div>
              )}
              {results.leads?.length > 0 && (
                <div className="p-2 border-t border-black/5">
                  <p className="text-[10px] uppercase text-muted px-2 mb-1">Leads</p>
                  {results.leads.map((l: any) => (
                    <button key={l._id} onClick={() => { navigate("/crm"); setOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-canvas text-sm">
                      {l.name} <span className="text-muted text-xs">({l.status})</span>
                    </button>
                  ))}
                </div>
              )}
              {results.books?.length > 0 && (
                <div className="p-2 border-t border-black/5">
                  <p className="text-[10px] uppercase text-muted px-2 mb-1">Library Books</p>
                  {results.books.map((b: any) => (
                    <button key={b._id} onClick={() => { navigate("/operations"); setOpen(false); }} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-canvas text-sm">
                      {b.title}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
