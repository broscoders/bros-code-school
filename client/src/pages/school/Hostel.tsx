import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Hostel() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [buildingForm, setBuildingForm] = useState({ name: "", type: "BOYS", wardenName: "" });
  const [roomForm, setRoomForm] = useState({ buildingId: "", roomNumber: "", capacity: "2" });
  const [allocForm, setAllocForm] = useState({ studentId: "", roomId: "", monthlyFee: "" });

  const loadBuildings = async () => {
    const res = await api.get(`/hostel/buildings?schoolId=${schoolId}`);
    setBuildings(res.data);
  };

  const loadAllocations = async () => {
    const res = await api.get(`/hostel/allocations?schoolId=${schoolId}`);
    setAllocations(res.data);
  };

  useEffect(() => {
    if (schoolId) {
      loadBuildings();
      loadAllocations();
      api.get(`/people/students?schoolId=${schoolId}`).then((res) => setStudents(res.data));
    }
  }, [schoolId]);

  useEffect(() => {
    if (roomForm.buildingId) {
      api.get(`/hostel/rooms?buildingId=${roomForm.buildingId}`).then((res) => setRooms(res.data));
    }
  }, [roomForm.buildingId]);

  useEffect(() => {
    if (allocForm.roomId) return;
    if (roomForm.buildingId) api.get(`/hostel/rooms?buildingId=${roomForm.buildingId}`).then((res) => setRooms(res.data));
  }, [allocForm]);

  const addBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/hostel/buildings", { ...buildingForm, schoolId });
    setBuildingForm({ name: "", type: "BOYS", wardenName: "" });
    loadBuildings();
  };

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/hostel/rooms", { ...roomForm, schoolId, capacity: Number(roomForm.capacity) });
    setRoomForm({ ...roomForm, roomNumber: "" });
    const res = await api.get(`/hostel/rooms?buildingId=${roomForm.buildingId}`);
    setRooms(res.data);
  };

  const allocate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post("/hostel/allocate", { ...allocForm, schoolId, monthlyFee: Number(allocForm.monthlyFee) });
    setAllocForm({ studentId: "", roomId: "", monthlyFee: "" });
    loadAllocations();
  };

  return (
    <div className="p-8">
      <p className="text-xs uppercase tracking-wider text-accent font-semibold">Residential</p>
      <h1 className="font-display text-2xl font-bold text-ink mt-1">Hostel Management</h1>
      <p className="text-muted mt-1 text-sm">Manage buildings, rooms and student allocation.</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3 text-sm">Buildings</h2>
          <form onSubmit={addBuilding} className="space-y-2 mb-3">
            <input placeholder="Building Name" value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <select value={buildingForm.type} onChange={(e) => setBuildingForm({ ...buildingForm, type: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm">
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
            </select>
            <input placeholder="Warden Name" value={buildingForm.wardenName} onChange={(e) => setBuildingForm({ ...buildingForm, wardenName: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full">+ Add Building</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {buildings.length === 0 && <li className="py-2 text-muted">No buildings yet.</li>}
            {buildings.map((b) => <li key={b._id} className="py-2">{b.name} ({b.type})</li>)}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3 text-sm">Rooms</h2>
          <form onSubmit={addRoom} className="space-y-2 mb-3">
            <select value={roomForm.buildingId} onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Building</option>
              {buildings.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <input placeholder="Room Number" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <input type="number" placeholder="Capacity" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full">+ Add Room</button>
          </form>
          <ul className="text-sm divide-y divide-black/5">
            {rooms.length === 0 && <li className="py-2 text-muted">Select a building to see rooms.</li>}
            {rooms.map((r) => (
              <li key={r._id} className="py-2 flex justify-between">
                <span>Room {r.roomNumber}</span>
                <span className="text-muted text-xs">{r.occupied}/{r.capacity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface rounded-2xl border border-black/5 shadow-sm p-5">
          <h2 className="font-display font-semibold text-ink mb-3 text-sm">Allocate Student</h2>
          <form onSubmit={allocate} className="space-y-2 mb-3">
            <select value={allocForm.studentId} onChange={(e) => setAllocForm({ ...allocForm, studentId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.userId?.name}</option>)}
            </select>
            <select value={allocForm.roomId} onChange={(e) => setAllocForm({ ...allocForm, roomId: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Room</option>
              {rooms.map((r) => <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.occupied}/{r.capacity})</option>)}
            </select>
            <input type="number" placeholder="Monthly Fee" value={allocForm.monthlyFee} onChange={(e) => setAllocForm({ ...allocForm, monthlyFee: e.target.value })} className="w-full border border-black/10 rounded-lg px-3 py-2 text-sm" required />
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium w-full">+ Allocate</button>
          </form>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-black/5 shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-ink text-left">
            <tr><th className="p-3 font-medium">Student</th><th className="p-3 font-medium">Room</th><th className="p-3 font-medium">Monthly Fee</th></tr>
          </thead>
          <tbody>
            {allocations.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-muted">No allocations yet.</td></tr>
            ) : (
              allocations.map((a) => (
                <tr key={a._id} className="border-t border-black/5">
                  <td className="p-3">{a.studentId?.userId?.name}</td>
                  <td className="p-3">Room {a.roomId?.roomNumber}</td>
                  <td className="p-3">Rs. {a.monthlyFee}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

