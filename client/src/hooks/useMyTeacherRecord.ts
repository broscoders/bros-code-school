import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

// Loads the logged-in teacher's own record (assigned classes + subjects).
// Uses the dedicated /people/teachers/me endpoint instead of downloading
// every teacher in the school and searching for yourself in the browser.
export function useMyTeacherRecord() {
  const user = useAuthStore((s) => s.user);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    api
      .get("/people/teachers/me")
      .then((res) => { if (!cancelled) setTeacher(res.data); })
      .catch(() => { if (!cancelled) setTeacher(null); });
    return () => { cancelled = true; };
  }, [user?.id]);

  return teacher;
}
