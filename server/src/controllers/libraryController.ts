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
    // Atomic reserve, same reasoning as the hostel-bed fix: read-then-save
    // leaves a window where two simultaneous "issue this book" requests can
    // both see availableCopies > 0 before either write lands, handing out
    // more copies than the library actually has.
    const book = await LibraryBook.findOneAndUpdate(
      { _id: req.body.bookId, schoolId: req.user!.schoolId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    if (!book) return res.status(400).json({ message: "Book not found or no copies available to issue" });

    const record = await LibraryTransaction.create({ ...req.body, schoolId: req.user!.schoolId });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const returnBook = async (req: AuthRequest, res: Response) => {
  try {
    // Only transition an actual "still issued" record to RETURNED. Without
    // the status filter here, calling this twice on the same transaction
    // (double-click, retry) would credit availableCopies a second time,
    // eventually showing more copies available than the library actually
    // owns - the same double-action problem as the refund/payment bugs.
    const record = await LibraryTransaction.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId, status: { $ne: "RETURNED" } },
      { status: "RETURNED", returnDate: new Date() },
      { new: true }
    );
    if (!record) return res.status(400).json({ message: "Record not found or already returned" });
    await LibraryBook.findByIdAndUpdate(record.bookId, { $inc: { availableCopies: 1 } });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
