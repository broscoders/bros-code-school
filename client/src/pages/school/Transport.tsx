import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { Bus, Users } from "lucide-react";
import StatCard from "../../components/StatCard";

export default function Transport() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: "", driverName: "", driverContact: "", routeName: "", stops: "" });
  const [assignForm, setAssignForm] = useState({ studentId: "", vehicleId: "", monthlyFee: "" });
  const [msg, setMsg] = useState("");

  const loadVehicles = async () => {
    const res = await api.get("/transport/vehicles");
    setVehicles(res.data);
  };
  const loadAssignments = async () => {
    const res = await api.get("/transport/assignments");
    setAssignments(res.data);
  };

  useEffect(() => {
    loadVehicles();
    loadAssignments();
    if (schoolId) api.get(`/people/students?schoolId=${schoolId}&status=ACTIVE`).then((res) => setStudents(res.data));
  }, [schoolId]);

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const stopsArr = vehicleForm.stops.split(",").map((s) => s.trim()).filter(Boolean);
    await api.post("/transport/vehicles", { ...vehicleForm, stops: stopsArr, schoolId });
    setVehicleForm({ vehicleNumber: "", driverName: "", driverContact: "", routeName: "", stops: "" });
    loadVehicles();
  };

  const assignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/transport/assign", { ...assignForm, monthlyFee: Number(assignForm.monthlyFee), schoolId });
      setAssignForm({ studentId: "", vehicleId: "", monthlyFee: "" });
      loadAssignments();
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Could not assign student");
    }
  };

  const removeAssignment = async (id: string) => {
    await api.put(`/transport/assign/${id}/remove`, {});
    loadAssignments();
  };

  return (
    <div className="p-8">
      <p className="section-label">Operations</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1 flex items-center gap-2">
        <Bus size={22} className="text-primary" />
        Transport
      </h1>
      <p className="text-muted mt-1 text-sm">Manage vehicles, routes, and student transport assignments.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <StatCard label="Vehicles / Routes" value={vehicles.length} icon={Bus} tone="primary" />
        <StatCard label="Students Assigned" value={assignments.length} icon={Users} tone="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Add Vehicle / Route</h2>
          <form onSubmit={addVehicle} className="space-y-2">
            <input placeholder="Vehicle Number (e.g. LEA-1234)" value={vehicleForm.vehicleNumber} onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })} className="w-full" required />
            <input placeholder="Driver Name" value={vehicleForm.driverName} onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })} className="w-full" required />
            <input placeholder="Driver Contact" value={vehicleForm.driverContact} onChange={(e) => setVehicleForm({ ...vehicleForm, driverContact: e.target.value })} className="w-full" required />
            <input placeholder="Route Name (e.g. Route A - Gulberg)" value={vehicleForm.routeName} onChange={(e) => setVehicleForm({ ...vehicleForm, routeName: e.target.value })} className="w-full" required />
            <input placeholder="Stops, comma separated" value={vehicleForm.stops} onChange={(e) => setVehicleForm({ ...vehicleForm, stops: e.target.value })} className="w-full" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">
              + Add Vehicle
            </button>
          </form>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3">Assign Student to Route</h2>
          <form onSubmit={assignStudent} className="space-y-2">
            {msg && <p className="text-danger text-xs">{msg}</p>}
            <select value={assignForm.studentId} onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} className="w-full" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name} ({s.admissionNumber})</option>)}
            </select>
            <select value={assignForm.vehicleId} onChange={(e) => setAssignForm({ ...assignForm, vehicleId: e.target.value })} className="w-full" required>
              <option value="">Select Vehicle / Route</option>
              {vehicles.map((v) => <option key={v._id} value={v._id}>{v.routeName} ({v.vehicleNumber})</option>)}
            </select>
            <input type="number" placeholder="Monthly Fee" value={assignForm.monthlyFee} onChange={(e) => setAssignForm({ ...assignForm, monthlyFee: e.target.value })} className="w-full" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full hover:bg-primary-dark transition-colors">
              Assign
            </button>
          </form>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm mt-6 p-5">
        <h2 className="font-display font-semibold text-ink mb-3">Vehicles &amp; Routes</h2>
        <ul className="text-sm divide-y divide-border">
          {vehicles.length === 0 && <li className="py-2 text-muted">No vehicles added yet.</li>}
          {vehicles.map((v) => (
            <li key={v._id} className="py-2">
              <p className="text-ink font-medium">{v.routeName} <span className="text-muted font-normal">({v.vehicleNumber})</span></p>
              <p className="text-muted text-xs mt-0.5">Driver: {v.driverName} &middot; {v.driverContact}</p>
              {v.stops?.length > 0 && <p className="text-muted text-xs mt-0.5">Stops: {v.stops.join(", ")}</p>}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-ink-soft text-left">
            <tr>
              <th className="p-3 font-medium">Student</th>
              <th className="p-3 font-medium">Route</th>
              <th className="p-3 font-medium">Monthly Fee</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted">No students assigned yet.</td></tr>
            ) : (
              assignments.map((a) => (
                <tr key={a._id} className="border-t border-border">
                  <td className="p-3 text-ink">{a.studentId?.userId?.name}</td>
                  <td className="p-3 text-muted">{a.vehicleId?.routeName}</td>
                  <td className="p-3 text-ink">Rs. {a.monthlyFee?.toLocaleString()}</td>
                  <td className="p-3">
                    <button onClick={() => removeAssignment(a._id)} className="text-danger text-xs underline">Remove</button>
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