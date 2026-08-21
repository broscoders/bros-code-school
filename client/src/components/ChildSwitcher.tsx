import { useEffect } from "react";
import { useChildStore } from "../store/childStore";

interface Props {
  children: any[];
}

export default function ChildSwitcher({ children }: Props) {
  const { selectedChildId, setSelectedChild } = useChildStore();

  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChild(children[0]._id);
    }
  }, [children]);

  if (children.length === 0) return null;

  return (
    <div className="flex gap-2 mb-6">
      {children.map((child) => (
        <button
          key={child._id}
          onClick={() => setSelectedChild(child._id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            selectedChildId === child._id
              ? "bg-primary text-white border-primary"
              : "bg-surface text-primary-dark border-border hover:border-primary/30"
          }`}
        >
          {child.userId?.name} — {child.classId?.name || "Class"}
        </button>
      ))}
    </div>
  );
}
