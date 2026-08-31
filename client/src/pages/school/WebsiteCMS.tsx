import { useEffect, useState } from "react";
import api from "../../services/api";
import { Globe, Plus, Trash2 } from "lucide-react";

const PAGE_TYPES = ["HOME", "ABOUT", "ADMISSIONS", "EVENTS", "GALLERY", "CONTACT", "FAQ"];

type Section = { heading?: string; body?: string; imageUrl?: string; order: number };
type WebsitePage = { _id: string; pageType: string; title: string; sections: Section[]; status: "DRAFT" | "PUBLISHED"; publishedAt?: string };

export default function WebsiteCMS() {
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [activeType, setActiveType] = useState("HOME");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [slug, setSlug] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get("/website/pages");
    setPages(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const existing = pages.find((p) => p.pageType === activeType);
    setTitle(existing?.title || "");
    setSections(existing?.sections?.length ? existing.sections : [{ heading: "", body: "", order: 0 }]);
  }, [activeType, pages]);

  const activePage = pages.find((p) => p.pageType === activeType);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  };

  const savePage = async () => {
    if (!title.trim()) {
      flash("Title is required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/website/pages", { pageType: activeType, title, sections });
      flash("Saved as draft");
      load();
    } catch (err: any) {
      flash(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (status: "DRAFT" | "PUBLISHED") => {
    if (!activePage) {
      flash("Save the page first before publishing");
      return;
    }
    try {
      await api.put(`/website/pages/${activePage._id}/status`, { status });
      flash(status === "PUBLISHED" ? "Page published" : "Page unpublished");
      load();
    } catch (err: any) {
      flash(err.response?.data?.message || "Failed to update status");
    }
  };

  const saveSlug = async () => {
    try {
      const res = await api.put("/website/slug", { slug });
      setSlug(res.data.slug);
      flash("Web address saved");
    } catch (err: any) {
      flash(err.response?.data?.message || "Failed to save web address");
    }
  };

  const updateSection = (i: number, field: keyof Section, value: string) => {
    const next = [...sections];
    next[i] = { ...next[i], [field]: value };
    setSections(next);
  };

  const addSection = () => setSections([...sections, { heading: "", body: "", order: sections.length }]);
  const removeSection = (i: number) => setSections(sections.filter((_, idx) => idx !== i));

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">Growth &amp; Communication</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
          <Globe size={22} className="text-primary" />
          Website / CMS
        </h1>
        <p className="text-muted mt-1 text-sm">Manage your school's public marketing site. Only Admin/Principal can publish.</p>
      </div>

      {msg && <p className="text-sm text-primary mb-4">{msg}</p>}

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5 mb-6">
        <p className="text-sm font-medium text-ink mb-2">Public web address</p>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-muted">yourapp.com/site/</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="your-school-name"
            className="border border-border rounded-md px-3 py-1.5 text-sm w-56"
          />
          <button onClick={saveSlug} className="bg-primary text-white text-xs px-3 py-1.5 rounded-md font-medium hover:bg-primary-dark">
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {PAGE_TYPES.map((t) => {
          const p = pages.find((pg) => pg.pageType === t);
          return (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                activeType === t ? "bg-primary text-white border-primary" : "bg-surface text-ink-soft border-border hover:bg-canvas"
              }`}
            >
              {t}
              {p?.status === "PUBLISHED" && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-success inline-block" />}
            </button>
          );
        })}
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${activePage?.status === "PUBLISHED" ? "bg-success-soft text-success" : "bg-white/5 text-muted"}`}>
            {activePage?.status || "Not saved yet"}
          </span>
          <div className="flex gap-2">
            <button onClick={savePage} disabled={saving} className="bg-white/5 border border-border text-ink text-xs px-3 py-1.5 rounded-md font-medium hover:bg-canvas disabled:opacity-50">
              {saving ? "Saving..." : "Save Draft"}
            </button>
            {activePage?.status === "PUBLISHED" ? (
              <button onClick={() => setStatus("DRAFT")} className="bg-danger/10 text-danger text-xs px-3 py-1.5 rounded-md font-medium hover:bg-danger/20">
                Unpublish
              </button>
            ) : (
              <button onClick={() => setStatus("PUBLISHED")} className="bg-success text-white text-xs px-3 py-1.5 rounded-md font-medium hover:opacity-90">
                Publish
              </button>
            )}
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
          className="w-full border border-border rounded-md px-3 py-2 text-sm mb-4 font-medium"
        />

        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="border border-border rounded-lg p-3 relative">
              <button onClick={() => removeSection(i)} className="absolute top-2 right-2 text-muted hover:text-danger">
                <Trash2 size={14} />
              </button>
              <input
                value={s.heading || ""}
                onChange={(e) => updateSection(i, "heading", e.target.value)}
                placeholder="Section heading"
                className="w-full border border-border rounded-md px-3 py-1.5 text-sm mb-2 font-medium"
              />
              <textarea
                value={s.body || ""}
                onChange={(e) => updateSection(i, "body", e.target.value)}
                placeholder="Section content"
                rows={3}
                className="w-full border border-border rounded-md px-3 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>

        <button onClick={addSection} className="flex items-center gap-1.5 text-primary text-xs font-medium mt-3 hover:underline">
          <Plus size={14} /> Add Section
        </button>
      </div>
    </div>
  );
}
