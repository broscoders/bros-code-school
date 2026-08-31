import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

type Section = { heading?: string; body?: string; imageUrl?: string; order: number };
type Page = { pageType: string; title: string; sections: Section[] };
type SiteData = {
  school: { name: string; logoUrl?: string; primaryColor?: string; secondaryColor?: string; contactEmail?: string; contactPhone?: string; address?: string };
  pages: Page[];
};

export default function PublicSite() {
  const { slug } = useParams();
  const [data, setData] = useState<SiteData | null>(null);
  const [activePage, setActivePage] = useState<string>("HOME");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/public/site/${slug}`)
      .then((res) => {
        setData(res.data);
        if (res.data.pages?.length) setActivePage(res.data.pages[0].pageType);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <p className="text-muted">This school website could not be found.</p>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen bg-canvas" />;
  }

  const current = data.pages.find((p) => p.pageType === activePage);
  const primary = data.school.primaryColor || "#1e9fe0";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.school.logoUrl && <img src={data.school.logoUrl} alt={data.school.name} className="w-9 h-9 rounded object-cover" />}
            <span className="font-semibold text-lg">{data.school.name}</span>
          </div>
          <nav className="flex gap-4 flex-wrap">
            {data.pages.map((p) => (
              <button
                key={p.pageType}
                onClick={() => setActivePage(p.pageType)}
                className="text-sm font-medium"
                style={{ color: activePage === p.pageType ? primary : "#4b5563" }}
              >
                {p.title}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {current ? (
          <>
            <h1 className="text-3xl font-bold mb-8">{current.title}</h1>
            <div className="space-y-10">
              {[...current.sections].sort((a, b) => a.order - b.order).map((s, i) => (
                <section key={i} className="grid md:grid-cols-2 gap-6 items-center">
                  {s.imageUrl && <img src={s.imageUrl} alt={s.heading || ""} className="rounded-lg w-full object-cover" />}
                  <div>
                    {s.heading && <h2 className="text-xl font-semibold mb-2">{s.heading}</h2>}
                    {s.body && <p className="text-gray-600 whitespace-pre-line">{s.body}</p>}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500">This page has no published content yet.</p>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8 text-sm text-gray-500 flex flex-wrap gap-4 justify-between">
          <span>{data.school.address}</span>
          <span>{data.school.contactEmail} {data.school.contactPhone && `· ${data.school.contactPhone}`}</span>
        </div>
      </footer>
    </div>
  );
}
