import { useState } from "react";
import api from "../services/api";
import { Upload, CheckCircle } from "lucide-react";

interface Props {
  onUploaded: (url: string) => void;
  folder?: string;
  label?: string;
}

export default function FileUpload({ onUploaded, folder = "bros-code-school/general", label = "Attach a file" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploaded(false);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data.url);
      setUploaded(true);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="flex items-center gap-2 border border-dashed border-black/20 rounded-md px-3 py-2 text-sm cursor-pointer hover:border-primary/40 transition-colors">
      {uploaded ? <CheckCircle size={16} className="text-success" /> : <Upload size={16} className="text-muted" />}
      <span className="text-muted">{uploading ? "Uploading..." : uploaded ? "File attached" : label}</span>
      <input type="file" className="hidden" onChange={handleChange} disabled={uploading} />
    </label>
  );
}
