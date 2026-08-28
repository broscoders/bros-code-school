import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Users } from "lucide-react";

export default function HRManagement() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const user = useAuthStore((s) => s.user);
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [deptForm, setDeptForm] = useState({ name: "" });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "", role: "RECEPTIONIST", employeeId: "", departmentId: "", designation: "", basicSalary: "" });
  const [error, setError] = useState("");
  const [managingStaff, setManagingStaff] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({ employmentStatus: "ACTIVE", reason: "" });

  const openManage = (staffMember: any) => {
    setManagingStaff(staffMember);
    setStatusForm({ employmentStatus: staffMember.employmentStatus || "ACTIVE", reason: "" });
  };

  const saveStatus = async () => {
    if (!managingStaff) return;
    await api.put(`/hr/staff/${managingStaff._id}/status`, { ...statusForm, changedByName: user?.name });
    setManagingStaff(null);
    load();
  };

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
        role: staffForm.role,
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
      setStaffForm({ name: "", email: "", password: "", role: "RECEPTIONIST", employeeId: "", departmentId: "", designation: "", basicSalary: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add staff");
    }
  };

  return (
    <div className="p-8">
      <div className="border-b border-border pb-5 mb-6">
        <p className="section-label">HR</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2"><Users size={22} className="text-primary" />Staff &amp; HR Management</h1>
        <p className="text-muted mt-1 text-sm">Manage departments and employee profiles.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Departments</h2>
          <form onSubmit={addDepartment} className="flex gap-2 mb-4">
            <input placeholder="Department name" value={deptForm.name} onChange={(e) => setDeptForm({ name: e.target.value })} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {departments.length === 0 && <li className="py-2 text-muted">No departments yet.</li>}
            {departments.map((d) => <li key={d._id} className="py-2">{d.name}</li>)}
          </ul>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Add Staff Member</h2>
          <form onSubmit={addStaff} className="space-y-2">
            {error && <p className="text-danger text-xs">{error}</p>}
            <input placeholder="Full Name" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Email" type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input placeholder="Password" type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required>
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="LIBRARIAN">Librarian</option>
              <option value="TRANSPORT_MANAGER">Transport Manager</option>
              <option value="NURSE">Nurse</option>
              <option value="HOSTEL_WARDEN">Hostel Warden</option>
              <option value="ADMISSION_STAFF">Admission Staff</option>
              <option value="ACADEMIC_COORDINATOR">Academic Coordinator</option>
              <option value="HEAD">Head / Vice Principal</option>
            </select>
            <input placeholder="Employee ID" value={staffForm.employeeId} onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <select value={staffForm.departmentId} onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm">
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <input placeholder="Designation" value={staffForm.designation} onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <input type="number" placeholder="Basic Salary" value={staffForm.basicSalary} onChange={(e) => setStaffForm({ ...staffForm, basicSalary: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">+ Add Staff</button>
          </form>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr>
              <th className="p-3 font-medium">Employee ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Designation</th>
              <th className="p-3 font-medium">Department</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No staff yet.</td></tr>
            ) : (
              staff.map((s) => (
                <tr key={s._id} className="border-t border-border">
                  <td className="p-3">{s.employeeId}</td>
                  <td className="p-3">{s.userId?.name}</td>
                  <td className="p-3">{s.designation}</td>
                  <td className="p-3">{s.departmentId?.name || "-"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.employmentStatus === "TERMINATED" ? "bg-danger-soft text-danger" : s.employmentStatus === "ON_LEAVE" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}>{s.employmentStatus}</span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => openManage(s)} className="text-primary text-xs underline">Manage</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {managingStaff && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setManagingStaff(null)}>
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-ink mb-1">{managingStaff.userId?.name}</h2>
            <p className="text-muted text-xs mb-4">Change employment status</p>
            <select value={statusForm.employmentStatus} onChange={(e) => setStatusForm({ ...statusForm, employmentStatus: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2">
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
            <textarea placeholder="Reason (optional)" value={statusForm.reason} onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-4" rows={2} />
            <div className="flex gap-2">
              <button onClick={saveStatus} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 hover:bg-primary-dark transition-colors">Save</button>
              <button onClick={() => setManagingStaff(null)} className="border border-border text-ink px-4 py-2 rounded-lg text-sm font-medium hover:bg-canvas transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
