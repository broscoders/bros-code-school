import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function HRManagement() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [deptForm, setDeptForm] = useState({ name: "" });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", employeeId: "", departmentId: "", designation: "", basicSalary: "" });
  const [error, setError] = useState("");

  const load = async () => {
    const [d, s] = await Promise.all([
      api.get(`/hr/departments?schoolId=${schoolId}`),
      api.get(`/hr/staff?schoolId=${schoolId}`),
    ]);
    setDepartments(d.data);
    setStaff(s.data);
  };

  useEffect(() => {
    if (schoolId) load();
  }, [schoolId]);

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/hr/departments", { ...deptForm, schoolId });
    setDeptForm({ name: "" });
    load();
  };

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userRes = await api.post("/auth/register", {
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        role: "RECEPTIONIST",
        schoolId,
      });
      await api.post("/hr/staff", {
        schoolId,
        userId: userRes.data.user.id,
        employeeId: staffForm.employeeId,
        departmentId: staffForm.departmentId,
        designation: staffForm.designation,
        basicSalary: Number(staffForm.basicSalary),
      });
      setStaffForm({ name: "", email: "", password: "", employeeId: "", departmentId: "", designation: "", basicSalary: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add staff");
    }
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">HR</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Staff & HR Management</h1>
      <p className="text-muted mt-1 text-sm">Manage departments and employee profiles.</p>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Departments</h2>
          <form onSubmit={addDepartment} className="flex gap-2 mb-4">
            <input placeholder="Department name" value={deptForm.name} onChange={(e) => setDeptForm({ name: e.target.value })} className="flex-1 border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {departments.length === 0 && <li className="py-2 text-muted">No departments yet.</li>}
            {departments.map((d) => <li key={d._id} className="py-2">{d.name}</li>)}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Add Staff Member</h2>
          <form onSubmit={addStaff} className="space-y-2">
            {error && <p className="text-danger text-xs">{error}</p>}
            <input placeholder="Full Name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Email" type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Password" type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Employee ID" value={staffForm.employeeId} onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <select value={staffForm.departmentId} onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <input placeholder="Designation" value={staffForm.designation} onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input type="number" placeholder="Basic Salary" value={staffForm.basicSalary} onChange={(e) => setStaffForm({ ...staffForm, basicSalary: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">+ Add Staff</button>
          </form>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Employee ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Designation</th>
              <th className="p-3 font-medium">Department</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted">No staff yet.</td></tr>
            ) : (
              staff.map((s) => (
                <tr key={s._id} className="border-t border-black/5">
                  <td className="p-3">{s.employeeId}</td>
                  <td className="p-3">{s.userId?.name}</td>
                  <td className="p-3">{s.designation}</td>
                  <td className="p-3">{s.departmentId?.name || "-"}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">{s.employmentStatus}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
