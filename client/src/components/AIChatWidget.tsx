import { useState } from "react";
import api from "../services/api";
import { MessageCircle, X, Send } from "lucide-react";

interface Props {
  extraBody?: Record<string, any>;
}

export default function AIChatWidget({ extraBody }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! Ask me about attendance, homework, results, fees, or exams." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message: userMsg, ...extraBody });
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: err.response?.data?.message || "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-surface rounded-xl shadow-xl border border-black/10 flex flex-col z-50">
          <div className="bg-primary-dark text-white p-3 rounded-t-xl flex justify-between items-center">
            <span className="font-display text-sm font-semibold">Ask Assistant</span>
            <button onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`p-2 rounded-lg max-w-[85%] ${m.role === "user" ? "bg-primary text-white ml-auto" : "bg-canvas text-ink"}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="text-muted text-xs">Thinking...</div>}
          </div>
          <div className="p-2 border-t border-black/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a question..."
              className="flex-1 border border-black/10 rounded-md px-2 py-1.5 text-sm"
            />
            <button onClick={send} className="bg-primary text-white p-2 rounded-md">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-accent text-primary-dark flex items-center justify-center shadow-lg z-50 hover:scale-105 transition-transform"
      >
        <MessageCircle size={20} />
      </button>
    </>
  );
}
