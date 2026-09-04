import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import TimetableSlot from "../models/TimetableSlot";

export const upsertSlot = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, sectionId, dayOfWeek, periodNumber, startTime, endTime, room, isBreak } = req.body;
    // Empty-string form fields (e.g. subject/teacher left blank when marking
    // a period as a break) must never reach Mongoose as literal "" values -
    // casting "" to an ObjectId throws, which is exactly what was
    // surfacing as "Server error" when saving a break period.
    const subjectId = req.body.subjectId || undefined;
    const teacherId = req.body.teacherId || undefined;

    if (!isBreak && teacherId) {
      const teacherConflict = await TimetableSlot.findOne({
        schoolId,
        dayOfWeek,
        periodNumber,
        teacherId,
        sectionId: { $ne: sectionId },
      }).populate("sectionId");
      if (teacherConflict) {
        return res.status(409).json({
          message: `Teacher conflict: already teaching ${(teacherConflict.sectionId as any)?.name || "another section"} at this period.`,
        });
      }
    }

    if (!isBreak && room) {
      const roomConflict = await TimetableSlot.findOne({
        schoolId,
        dayOfWeek,
        periodNumber,
        room,
        sectionId: { $ne: sectionId },
      }).populate("sectionId");
      if (roomConflict) {
        return res.status(409).json({
          message: `Room conflict: ${room} is already booked by ${(roomConflict.sectionId as any)?.name || "another section"} at this period.`,
        });
      }
    }

    const setFields: Record<string, any> = { schoolId, classId, sectionId, dayOfWeek, periodNumber, startTime, endTime, room, isBreak: !!isBreak };
    const unsetFields: Record<string, any> = {};
    if (isBreak) {
      // A break period shouldn't retain a leftover subject/teacher from
      // before it was marked as a break.
      unsetFields.subjectId = "";
      unsetFields.teacherId = "";
    } else {
      if (subjectId) setFields.subjectId = subjectId;
      if (teacherId) setFields.teacherId = teacherId;
    }

    const slot = await TimetableSlot.findOneAndUpdate(
      { schoolId, sectionId, dayOfWeek, periodNumber },
      { $set: setFields, ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getClassTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const slots = await TimetableSlot.find({
      schoolId: req.user!.schoolId,
      sectionId: req.query.sectionId as string,
    })
      .populate("subjectId teacherId")
      .sort({ dayOfWeek: 1, periodNumber: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTeacherTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const slots = await TimetableSlot.find({
      schoolId: req.user!.schoolId,
      teacherId: req.query.teacherId as string,
    })
      .populate("subjectId classId sectionId")
      .sort({ dayOfWeek: 1, periodNumber: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteSlot = async (req: AuthRequest, res: Response) => {
  try {
    const slot = await TimetableSlot.findOneAndDelete({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
