import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export function useMyStudentRecord() {
  const user = useAuthStore((s) => s.user);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (user?.schoolId) {
      api.get(`/people/students?schoolId=${user.schoolId}`).then((res) => {
        const me = res.data.find((s: any) => s.userId?._id === user.id || s.userId === user.id);
        setStudent(me || null);
      });
    }
  }, [user]);

  return student;
}
