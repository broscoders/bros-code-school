import { useState } from "react";
import api from "../services/api";
import FileUpload from "./FileUpload";

type Props = {
  kind: "homework" | "assignment";
  itemId: string;
  submission?: { status: string; marksObtained?: number; feedback?: string; submittedAt?: string; submissionUrl?: string };
  totalMarks?: number;
  onDone: () => void;
};

// Lets a student hand in work for one homework / assignment and shows what
// happened to it afterwards (submitted, marked, marks, teacher's feedback).
export default function SubmitWork({ kind, itemId, submission, totalMarks, onDone }: Props) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const marked = submission && (submission.status === "GRADED" || submission.status === "COMPLETED");

  const submit = async () => {
    setError("");
    if (!url) return setError("Please attach your work first.");
    setBusy(true);
    try {
      await api.post(`/ops/${kind === "homework" ? "homework" : "assignments"}/submit`, {
        [kind === "homework" ? "homeworkId" : "assignmentId"]: itemId,
        submissionUrl: url,
      });
      setUrl("");
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border text-sm">
      {submission && (
        <div className="mb-2">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${marked ? "bg-success-soft text-success" : "bg-primary/10 text-primary"}`}>
            {submission.status === "GRADED" ? "Marked" : submission.status === "COMPLETED" ? "Checked" : "Submitted"}
          </span>
          {submission.submissionUrl && <a href={submission.submissionUrl} target="_blank" rel="noreferrer" className="ml-3 text-primary text-xs underline">My file</a>}
          {submission.status === "GRADED" && (
            <p className="mt-1 text-ink">Marks: <b>{submission.marksObtained}</b>{totalMarks ? ` / ${totalMarks}` : ""}</p>
          )}
          {submission.feedback && <p className="mt-1 text-muted">Teacher: {submission.feedback}</p>}
        </div>
      )}
      {!marked && (
        <div className="flex flex-wrap items-center gap-3">
          <FileUpload folder="bros-code-school/homework" onUploaded={setUrl} label={submission ? "Replace my file" : "Attach my work"} />
          <button onClick={submit} disabled={busy || !url} className="bg-primary text-white px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50">
            {busy ? "Submitting..." : submission ? "Resubmit" : "Submit"}
          </button>
        </div>
      )}
      {error && <p className="text-danger text-xs mt-2">{error}</p>}
    </div>
  );
}
