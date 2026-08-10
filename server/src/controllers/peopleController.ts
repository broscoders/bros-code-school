import type { Request, Response } from "express";
import Student from "../models/Student";
import Parent from "../models/Parent";
import Teacher from "../models/Teacher";

// Student
export const createStudent = async (req: Request, res: Response) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find({ schoolId: req.query.schoolId }).populate("userId classId sectionId");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id).populate("userId classId sectionId parentId");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Parent
export const createParent = async (req: Request, res: Response) => {
  try {
    const parent = await Parent.create(req.body);
    res.status(201).json(parent);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getParents = async (req: Request, res: Response) => {
  try {
    const parents = await Parent.find({ schoolId: req.query.schoolId }).populate("userId children");
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Teacher
export const createTeacher = async (req: Request, res: Response) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await Teacher.find({ schoolId: req.query.schoolId }).populate("userId subjects assignedClasses");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
