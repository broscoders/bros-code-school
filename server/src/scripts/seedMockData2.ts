import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User";
import School from "../models/School";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import HostelBuilding from "../models/HostelBuilding";
import HostelRoom from "../models/HostelRoom";
import StaffProfile from "../models/StaffProfile";
import DisciplineIncident from "../models/DisciplineIncident";
import Visitor from "../models/Visitor";
import PTMSlot from "../models/PTMSlot";
import Lead from "../models/Lead";
import Certificate from "../models/Certificate";

dotenv.config();

const PASSWORD = "Test@123";
const SCHOOL_ID = "6a7a34b8f4bf247132b2fe3e";

async function ensureUser(name: string, email: string, role: string, schoolId: mongoose.Types.ObjectId) {
  let user = await User.findOne({ email });
  if (user) return user;
  const hashed = await bcrypt.hash(PASSWORD, 10);
  user = await User.create({ name, email, password: hashed, role, schoolId, isEmailVerified: true });
  return user;
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const school = await School.findById(SCHOOL_ID);
  if (!school) throw new Error("School not found");
  const schoolId = school._id as mongoose.Types.ObjectId;

  const admin = await User.findOne({ role: "SCHOOL_ADMIN", schoolId });
  const students = await Student.find({ schoolId }).limit(6);
  const teachers = await Teacher.find({ schoolId }).limit(3);

  console.log("Creating hostel building + rooms...");
  let building = await HostelBuilding.findOne({ schoolId, name: "Boys Hostel A" });
  if (!building) {
    building = await HostelBuilding.create({ schoolId, name: "Boys Hostel A", type: "BOYS", wardenName: "Mr. Tariq" });
  }
  const roomNumbers = ["101", "102", "103"];
  const rooms = [];
  for (const num of roomNumbers) {
    let room = await HostelRoom.findOne({ schoolId, buildingId: building._id, roomNumber: num });
    if (!room) {
      room = await HostelRoom.create({ schoolId, buildingId: building._id, roomNumber: num, capacity: 2, occupied: 0 });
    }
    rooms.push(room);
  }

  console.log("Creating HR staff profiles (Accountant, Librarian, Receptionist)...");
  const staffData = [
    { name: "Bilal Accountant", email: "bilal.accountant.demo@test.com", role: "ACCOUNTANT", designation: "Accountant", salary: 45000 },
    { name: "Nadia Librarian", email: "nadia.librarian.demo@test.com", role: "LIBRARIAN", designation: "Librarian", salary: 35000 },
    { name: "Faisal Reception", email: "faisal.reception.demo@test.com", role: "RECEPTIONIST", designation: "Receptionist", salary: 30000 },
  ];
  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i];
    const user = await ensureUser(s.name, s.email, s.role, schoolId);
    const existing = await StaffProfile.findOne({ userId: user._id });
    if (!existing) {
      await StaffProfile.create({
        schoolId,
        userId: user._id,
        employeeId: `STAFF-DEMO-${i + 1}`,
        designation: s.designation,
        joiningDate: new Date(),
        employmentStatus: "ACTIVE",
        basicSalary: s.salary,
      });
    }
  }

  console.log("Creating discipline incidents...");
  if (admin && students.length > 0) {
    const incidentExists = await DisciplineIncident.findOne({ schoolId, studentId: students[0]._id });
    if (!incidentExists) {
      await DisciplineIncident.create({
        schoolId,
        studentId: students[0]._id,
        reportedBy: admin._id,
        incidentType: "MINOR",
        description: "Talking during class without permission.",
        actionTaken: "Verbal warning given.",
        parentNotified: true,
        status: "RESOLVED",
      });
    }
    if (students.length > 1) {
      const incidentExists2 = await DisciplineIncident.findOne({ schoolId, studentId: students[1]._id });
      if (!incidentExists2) {
        await DisciplineIncident.create({
          schoolId,
          studentId: students[1]._id,
          reportedBy: admin._id,
          incidentType: "WARNING",
          description: "Late submission of homework repeatedly.",
          status: "OPEN",
        });
      }
    }
  }

  console.log("Creating visitor log entries...");
  const visitorSamples = [
    { name: "Mr. Aslam", contact: "0300-9998887", purpose: "Admission inquiry", personToMeet: "Admission Office", status: "CHECKED_OUT" as const },
    { name: "Mrs. Naz", contact: "0300-7778886", purpose: "Meeting class teacher", personToMeet: "Ayesha Khan", status: "CHECKED_IN" as const },
  ];
  for (const v of visitorSamples) {
    const exists = await Visitor.findOne({ schoolId, name: v.name });
    if (!exists) {
      await Visitor.create({
        schoolId,
        name: v.name,
        contact: v.contact,
        purpose: v.purpose,
        personToMeet: v.personToMeet,
        status: v.status,
        checkOutTime: v.status === "CHECKED_OUT" ? new Date() : undefined,
      });
    }
  }

  console.log("Creating PTM slots (available + booked)...");
  if (teachers.length > 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const slotTimes = ["10:00 AM", "10:30 AM", "11:00 AM"];
    for (let i = 0; i < slotTimes.length; i++) {
      const exists = await PTMSlot.findOne({ schoolId, teacherId: teachers[0]._id, time: slotTimes[i], date: tomorrow });
      if (!exists) {
        await PTMSlot.create({
          schoolId,
          teacherId: teachers[0]._id,
          date: tomorrow,
          time: slotTimes[i],
          isBooked: false,
        });
      }
    }
  }

  console.log("Creating CRM leads...");
  const leadSamples = [
    { name: "Interested Parent 1", contact: "0300-1112223", source: "Walk-in", status: "NEW" as const },
    { name: "Interested Parent 2", contact: "0300-4445556", source: "Facebook Ad", status: "CONTACTED" as const },
    { name: "Interested Parent 3", contact: "0300-7778889", source: "Referral", status: "DEMO_SCHEDULED" as const },
  ];
  for (const l of leadSamples) {
    const exists = await Lead.findOne({ schoolId, name: l.name });
    if (!exists) {
      await Lead.create({
        schoolId,
        name: l.name,
        contact: l.contact,
        source: l.source,
        interestedIn: "Grade 9 Admission",
        status: l.status,
        assignedTo: admin?._id,
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });
    }
  }

  console.log("Issuing a sample certificate...");
  if (students.length > 0) {
    const certExists = await Certificate.findOne({ schoolId, studentId: students[0]._id, type: "ACHIEVEMENT" });
    if (!certExists) {
      const certificateNumber = "CERT-DEMO-" + Date.now().toString(36).toUpperCase();
      await Certificate.create({
        schoolId,
        studentId: students[0]._id,
        title: "Certificate of Excellence",
        type: "ACHIEVEMENT",
        issueDate: new Date(),
        certificateNumber,
      });
    }
  }

  console.log("\n=== DONE ===");
  console.log("Hostel: 1 building, 3 rooms");
  console.log("HR Staff: Accountant, Librarian, Receptionist (password: " + PASSWORD + ")");
  console.log("Discipline: 2 incidents");
  console.log("Visitors: 2 log entries");
  console.log("PTM Slots: 3 available slots for tomorrow (first teacher)");
  console.log("CRM Leads: 3 in different pipeline stages");
  console.log("Certificates: 1 sample issued");

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});