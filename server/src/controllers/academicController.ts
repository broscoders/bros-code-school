import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import AcademicSession from "../models/AcademicSession";
import ClassModel from "../models/ClassModel";
import Section from "../models/Section";
import Subject from "../models/Subject";
import Student from "../models/Student";

// Academic Session
export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Session name is required" });
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Please provide valid start and end dates" });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ message: "End date must be after the start date" });
    }
    if (await AcademicSession.exists({ schoolId, name })) {
      return res.status(409).json({ message: `A session named "${name}" already exists` });
    }
    // The first session becomes the active one. Later sessions are created
    // inactive (activate them from the status dropdown) - before, every new
    // session was created active too, so a school ended up with several
    // "current" sessions at once.
    const hasActive = await AcademicSession.exists({ schoolId, isActive: true });
    const session = await AcademicSession.create({
      schoolId, name, startDate, endDate,
      isActive: !hasActive,
      status: hasActive ? "CLOSED" : "ACTIVE",
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await AcademicSession.find({ schoolId: req.user!.schoolId });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Closing a session doesn't delete or hide anything - attendance, fees,
// exams and results all keep pointing at their original session/class
// records forever (blueprint 19: "must not erase previous attendance,
// fees, exams or results"). It only stops it being the default for new
// records like admissions and new class assignments.
export const setSessionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["ACTIVE", "CLOSED", "ARCHIVED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const session = await AcademicSession.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (status === "ACTIVE") {
      // Only one session is "the current one" at a time - activating this
      // one demotes any other active session rather than leaving two
      // sessions both marked active.
      await AcademicSession.updateMany({ schoolId: req.user!.schoolId, _id: { $ne: session._id } }, { isActive: false, status: "CLOSED" });
      session.isActive = true;
    } else {
      session.isActive = false;
    }
    session.status = status;
    await session.save();

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint 19: "Copy selected configuration from previous session" - sets
// up a new session's Classes/Sections/Subjects from an existing session's
// structure instead of the admin re-entering everything by hand. This
// creates brand new records for the new session; it never touches or
// re-parents the old session's data.
export const copySessionConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { fromSessionId, toSessionId } = req.body;
    const schoolId = req.user!.schoolId;

    const toSession = await AcademicSession.findOne({ _id: toSessionId, schoolId });
    if (!toSession) return res.status(404).json({ message: "Target session not found" });

    const oldClasses = await ClassModel.find({ schoolId, sessionId: fromSessionId });
    let classesCreated = 0, sectionsCreated = 0, subjectsCreated = 0;

    for (const oldClass of oldClasses) {
      const existing = await ClassModel.findOne({ schoolId, sessionId: toSessionId, name: oldClass.name });
      const newClass = existing || (await ClassModel.create({ schoolId, sessionId: toSessionId, name: oldClass.name }));
      if (!existing) classesCreated++;

      const oldSections = await Section.find({ schoolId, classId: oldClass._id });
      for (const oldSection of oldSections) {
        const existingSection = await Section.findOne({ schoolId, classId: newClass._id, name: oldSection.name });
        if (!existingSection) {
          await Section.create({ schoolId, classId: newClass._id, name: oldSection.name, capacity: oldSection.capacity });
          sectionsCreated++;
        }
      }

      const oldSubjects = await Subject.find({ schoolId, classId: oldClass._id });
      for (const oldSubject of oldSubjects) {
        const existingSubject = await Subject.findOne({ schoolId, classId: newClass._id, name: oldSubject.name });
        if (!existingSubject) {
          await Subject.create({ schoolId, classId: newClass._id, name: oldSubject.name, code: oldSubject.code });
          subjectsCreated++;
        }
      }
    }

    res.json({ classesCreated, sectionsCreated, subjectsCreated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Class
export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const name = String(req.body.name || "").trim();
    const { sessionId, academicSystem } = req.body;
    if (!name || !sessionId || !academicSystem) return res.status(400).json({ message: "Session, class name and academic system are required" });
    if (!(await AcademicSession.exists({ _id: sessionId, schoolId }))) return res.status(404).json({ message: "Session not found in your school" });
    if (await ClassModel.exists({ schoolId, sessionId, name })) {
      return res.status(400).json({ message: `A class named "${name}" already exists in this session` });
    }
    const newClass = await ClassModel.create({ schoolId, sessionId, name, academicSystem });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const classes = await ClassModel.find({ schoolId: req.user!.schoolId });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Section
export const createSection = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const name = String(req.body.name || "").trim();
    const { classId } = req.body;
    if (!name || !classId) return res.status(400).json({ message: "Class and section name are required" });
    if (!(await ClassModel.exists({ _id: classId, schoolId }))) return res.status(404).json({ message: "Class not found in your school" });
    let capacity: number | undefined;
    if (req.body.capacity !== undefined && req.body.capacity !== null && req.body.capacity !== "") {
      capacity = Number(req.body.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) return res.status(400).json({ message: "Capacity must be a whole number between 1 and 500" });
    }
    if (await Section.exists({ schoolId, classId, name })) {
      return res.status(400).json({ message: `Section "${name}" already exists in this class` });
    }
    const section = await Section.create({ schoolId, classId, name, capacity });
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSections = async (req: AuthRequest, res: Response) => {
  try {
    const sections = await Section.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Subject
export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const name = String(req.body.name || "").trim();
    const { classId, code } = req.body;
    if (!name || !classId) return res.status(400).json({ message: "Class and subject name are required" });
    if (!(await ClassModel.exists({ _id: classId, schoolId }))) return res.status(404).json({ message: "Class not found in your school" });
    if (await Subject.exists({ schoolId, classId, name })) {
      return res.status(400).json({ message: `Subject "${name}" already exists in this class` });
    }
    const subject = await Subject.create({ schoolId, classId, name, code });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const subjects = await Subject.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};


// Blueprint section 21/113: end-of-year promotion. Moves each student to a new
// class/section while preserving their old assignment in classHistory.
export const promoteStudents = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentIds, toClassId, toSectionId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !toClassId || !toSectionId) {
      return res.status(400).json({ message: "studentIds, toClassId and toSectionId are required" });
    }

    const targetClass = await ClassModel.findOne({ _id: toClassId, schoolId });
    if (!targetClass) return res.status(404).json({ message: "Destination class not found in your school" });
    const targetSection = await Section.findOne({ _id: toSectionId, classId: toClassId, schoolId });
    if (!targetSection) return res.status(404).json({ message: "Destination section not found in the destination class" });
    if (targetSection.capacity) {
      const taken = await Student.countDocuments({ sectionId: toSectionId, schoolId, status: "ACTIVE" });
      if (taken + studentIds.length > targetSection.capacity) {
        return res.status(400).json({ message: `Section "${targetSection.name}" has ${targetSection.capacity - taken} free seat(s), but ${studentIds.length} students were selected` });
      }
    }

    const students = await Student.find({ _id: { $in: studentIds }, schoolId, status: "ACTIVE" });

    let promoted = 0;
    for (const student of students) {
      const lastHistoryEntry = student.classHistory[student.classHistory.length - 1];
      const fromDate = lastHistoryEntry?.toDate || student.admissionDate;

      student.classHistory.push({
        classId: student.classId,
        sectionId: student.sectionId,
        fromDate,
        toDate: new Date(),
      });
      student.classId = toClassId;
      student.sectionId = toSectionId;
      await student.save();
      promoted++;
    }

    res.json({ message: `Promoted ${promoted} student(s) to ${targetClass.name} - ${targetSection.name}`, promoted });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint section 21: final-year students become Alumni, history preserved.
export const graduateStudents = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds is required" });
    }

    const students = await Student.find({ _id: { $in: studentIds }, schoolId, status: "ACTIVE" });

    let graduated = 0;
    for (const student of students) {
      const lastHistoryEntry = student.classHistory[student.classHistory.length - 1];
      const fromDate = lastHistoryEntry?.toDate || student.admissionDate;

      student.classHistory.push({
        classId: student.classId,
        sectionId: student.sectionId,
        fromDate,
        toDate: new Date(),
      });
      student.status = "GRADUATED";
      student.statusReason = "Completed final year";
      student.statusChangedAt = new Date();
      await student.save();
      graduated++;
    }

    res.json({ message: `Graduated ${graduated} student(s). They are now Alumni.`, graduated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
