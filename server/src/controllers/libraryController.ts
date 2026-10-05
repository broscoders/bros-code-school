import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import LibraryBook from "../models/LibraryBook";
import LibraryTransaction from "../models/LibraryTransaction";
import Student from "../models/Student";

export const addBook = async (req: AuthRequest, res: Response) => {
  try {
    const title = String(req.body.title || "").trim();
    const copies = Number(req.body.totalCopies ?? 1);
    if (!title) return res.status(400).json({ message: "Book title is required" });
    if (!Number.isInteger(copies) || copies < 1 || copies > 10000) {
      return res.status(400).json({ message: "Total copies must be a whole number of 1 or more" });
    }
    // availableCopies is always equal to totalCopies for a new book - the
    // client used to send it, so a book could be created with 0 or 999 "available"
    const book = await LibraryBook.create({
      schoolId: req.user!.schoolId,
      title,
      author: req.body.author ? String(req.body.author).trim() : undefined,
      category: req.body.category ? String(req.body.category).trim() : undefined,
      totalCopies: copies,
      availableCopies: copies,
    });
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
    const schoolId = req.user!.schoolId;
    const { bookId, studentId } = req.body;
    const due = new Date(req.body.dueDate);
    if (!bookId || !studentId) return res.status(400).json({ message: "Book and student are required" });
    if (Number.isNaN(due.getTime())) return res.status(400).json({ message: "A valid due date is required" });
    if (due.getTime() < new Date().setHours(0, 0, 0, 0)) return res.status(400).json({ message: "Due date cannot be in the past" });

    // Validate EVERYTHING before touching the stock. Before, the copy was
    // taken first and then the record was created, so a bad student id threw
    // after the copy count had already dropped - that copy was lost forever.
    if (!(await Student.exists({ _id: studentId, schoolId, status: "ACTIVE" }))) {
      return res.status(404).json({ message: "Active student not found in your school" });
    }
    if (await LibraryTransaction.exists({ schoolId, bookId, studentId, status: { $ne: "RETURNED" } })) {
      return res.status(409).json({ message: "This student already has this book issued" });
    }

    // Atomic reserve (two simultaneous requests can't both take the last copy)
    const book = await LibraryBook.findOneAndUpdate(
      { _id: bookId, schoolId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    if (!book) return res.status(400).json({ message: "Book not found or no copies available to issue" });

    try {
      const record = await LibraryTransaction.create({ schoolId, bookId, studentId, dueDate: due });
      res.status(201).json(record);
    } catch (createErr) {
      await LibraryBook.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } }); // give the copy back
      throw createErr;
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Issued / overdue / returned records, so the Library screen can show who has
// which book and let staff return it. This list did not exist at all, so a
// book that was issued could never be returned from the UI.
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { schoolId: req.user!.schoolId };
    const status = req.query.status as string | undefined;
    if (status === "OPEN") filter.status = { $ne: "RETURNED" };
    else if (status === "RETURNED") filter.status = "RETURNED";
    const list = await LibraryTransaction.find(filter)
      .populate("bookId", "title author")
      .populate({ path: "studentId", select: "admissionNumber userId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 })
      .limit(300);
    res.json(list);
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
