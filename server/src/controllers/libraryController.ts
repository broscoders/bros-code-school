import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import LibraryBook from "../models/LibraryBook";
import LibraryTransaction from "../models/LibraryTransaction";

export const addBook = async (req: AuthRequest, res: Response) => {
  try {
    const book = await LibraryBook.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getBooks = async (req: AuthRequest, res: Response) => {
  try {
    const books = await LibraryBook.find({ schoolId: req.user!.schoolId });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const issueBook = async (req: AuthRequest, res: Response) => {
  try {
    const book = await LibraryBook.findOne({ _id: req.body.bookId, schoolId: req.user!.schoolId });
    if (!book) return res.status(404).json({ message: "Book not found" });

    const record = await LibraryTransaction.create({ ...req.body, schoolId: req.user!.schoolId });
    book.availableCopies -= 1;
    await book.save();

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const returnBook = async (req: AuthRequest, res: Response) => {
  try {
    const record = await LibraryTransaction.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
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
