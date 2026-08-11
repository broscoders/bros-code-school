import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export function useMyTeacherRecord() {
  const user = useAuthStore((s) => s.user);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    if (user?.schoolId) {
      api.get(`/people/teachers?schoolId=${user.schoolId}`).then((res) => {
        const me = res.data.find((t: any) => t.userId?._id === user.id || t.userId === user.id);
        setTeacher(me || null);
      });
    }
  }, [user]);

  return teacher;
}
