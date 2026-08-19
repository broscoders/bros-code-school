import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import TimetableSlot from "../models/TimetableSlot";

export const upsertSlot = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, sectionId, dayOfWeek, periodNumber, startTime, endTime, subjectId, teacherId, room, isBreak } = req.body;

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

    const slot = await TimetableSlot.findOneAndUpdate(
      { schoolId, sectionId, dayOfWeek, periodNumber },
      { schoolId, classId, sectionId, dayOfWeek, periodNumber, startTime, endTime, subjectId, teacherId, room, isBreak: !!isBreak },
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
