import type { Request, Response } from "express";
import LibraryBook from "../models/LibraryBook";
import LibraryTransaction from "../models/LibraryTransaction";
import Vehicle from "../models/Vehicle";
import Complaint from "../models/Complaint";
import Event from "../models/Event";
import PTMSlot from "../models/PTMSlot";
import Achievement from "../models/Achievement";

// Library
export const addBook = async (req: Request, res: Response) => {
  try {
    const book = await LibraryBook.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getBooks = async (req: Request, res: Response) => {
  try {
    const books = await LibraryBook.find({ schoolId: req.query.schoolId });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const issueBook = async (req: Request, res: Response) => {
  try {
    const record = await LibraryTransaction.create(req.body);
    await LibraryBook.findByIdAndUpdate(req.body.bookId, { $inc: { availableCopies: -1 } });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const returnBook = async (req: Request, res: Response) => {
  try {
    const record = await LibraryTransaction.findByIdAndUpdate(
      req.params.id,
      { status: "RETURNED", returnDate: new Date() },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: "Record not found" });
    await LibraryBook.findByIdAndUpdate(record.bookId, { $inc: { availableCopies: 1 } });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Transport
export const addVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.find({ schoolId: req.query.schoolId });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Complaints
export const createComplaint = async (req: Request, res: Response) => {
  try {
    const ticketNumber = "SC-" + Math.floor(1000 + Math.random() * 9000);
    const complaint = await Complaint.create({ ...req.body, ticketNumber });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await Complaint.find({ schoolId: req.query.schoolId });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Events
export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find({ schoolId: req.query.schoolId }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PTM
export const createPTMSlot = async (req: Request, res: Response) => {
  try {
    const slot = await PTMSlot.create(req.body);
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getPTMSlots = async (req: Request, res: Response) => {
  try {
    const slots = await PTMSlot.find({ teacherId: req.query.teacherId });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const bookPTMSlot = async (req: Request, res: Response) => {
  try {
    const slot = await PTMSlot.findByIdAndUpdate(
      req.params.id,
      { parentId: req.body.parentId, studentId: req.body.studentId, isBooked: true },
      { new: true }
    );
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Achievements
export const addAchievement = async (req: Request, res: Response) => {
  try {
    const achievement = await Achievement.create(req.body);
    res.status(201).json(achievement);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAchievements = async (req: Request, res: Response) => {
  try {
    const list = await Achievement.find({ studentId: req.query.studentId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
