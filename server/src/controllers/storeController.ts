import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent } from "../utils/accessControl";
import Survey from "../models/Survey";
import SurveyResponse from "../models/SurveyResponse";
import DigitalProduct from "../models/DigitalProduct";
import Purchase from "../models/Purchase";
import ClassModel from "../models/ClassModel";

// Surveys
const clean = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());

export const createSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const title = clean(req.body.title);
    const questions = (Array.isArray(req.body.questions) ? req.body.questions : []).map(clean).filter(Boolean);
    if (!title) return res.status(400).json({ message: "Survey title is required" });
    if (questions.length === 0) return res.status(400).json({ message: "Add at least one question" });
    if (questions.length > 30) return res.status(400).json({ message: "A survey can have at most 30 questions" });
    if (req.body.targetAudience && !["PARENTS", "STUDENTS", "TEACHERS", "ALL"].includes(req.body.targetAudience)) {
      return res.status(400).json({ message: "Invalid audience" });
    }
    const survey = await Survey.create({
      schoolId: req.user!.schoolId, title, questions,
      description: clean(req.body.description) || undefined,
      targetAudience: req.body.targetAudience || "ALL",
    });
    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSurveys = async (req: AuthRequest, res: Response) => {
  try {
    // A parent used to see (and could answer) surveys meant for teachers and
    // vice versa. Staff who manage surveys still see all of them.
    const role = req.user!.role;
    const filter: Record<string, any> = { schoolId: req.user!.schoolId, isActive: true };
    if (role === "PARENT") filter.targetAudience = { $in: ["ALL", "PARENTS"] };
    else if (role === "STUDENT") filter.targetAudience = { $in: ["ALL", "STUDENTS"] };
    else if (role === "TEACHER" || role === "ACADEMY_TEACHER") filter.targetAudience = { $in: ["ALL", "TEACHERS"] };
    const surveys = await Survey.find(filter).sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitSurveyResponse = async (req: AuthRequest, res: Response) => {
  try {
    const survey = await Survey.findOne({ _id: req.body.surveyId, schoolId: req.user!.schoolId, isActive: true });
    if (!survey) return res.status(404).json({ message: "Survey not found" });

    const role = req.user!.role;
    const audience = survey.targetAudience;
    const allowed =
      audience === "ALL" ||
      (audience === "PARENTS" && role === "PARENT") ||
      (audience === "STUDENTS" && role === "STUDENT") ||
      (audience === "TEACHERS" && (role === "TEACHER" || role === "ACADEMY_TEACHER")) ||
      !["PARENT", "STUDENT", "TEACHER", "ACADEMY_TEACHER"].includes(role);
    if (!allowed) return res.status(403).json({ message: "This survey is not for your role" });

    // one answer sheet per person - the same account could submit any number
    // of times and swamp the results
    if (await SurveyResponse.exists({ surveyId: survey._id, respondedBy: req.user!.userId })) {
      return res.status(409).json({ message: "You have already answered this survey" });
    }
    const answers = (Array.isArray(req.body.answers) ? req.body.answers : []).map((a: unknown) => clean(a).slice(0, 2000));
    if (answers.length !== survey.questions.length || answers.every((a: string) => !a)) {
      return res.status(400).json({ message: "Please answer the survey questions" });
    }
    const response = await SurveyResponse.create({ surveyId: survey._id, respondedBy: req.user!.userId, answers });
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSurveyResponses = async (req: AuthRequest, res: Response) => {
  try {
    const survey = await Survey.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    const responses = await SurveyResponse.find({ surveyId: req.params.id }).populate("respondedBy");
    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Digital Store
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const title = clean(req.body.title);
    const fileUrl = clean(req.body.fileUrl);
    const price = req.body.price === undefined || req.body.price === "" ? 0 : Number(req.body.price);
    if (!title || !fileUrl) return res.status(400).json({ message: "Title and file are required" });
    if (!/^https?:\/\//i.test(fileUrl)) return res.status(400).json({ message: "Invalid file link" });
    if (!Number.isFinite(price) || price < 0 || price > 1000000) return res.status(400).json({ message: "Price must be zero or more" });
    const product = await DigitalProduct.create({
      schoolId: req.user!.schoolId, title, fileUrl,
      description: clean(req.body.description) || undefined,
      subjectName: clean(req.body.subjectName) || undefined,
      className: clean(req.body.className) || undefined,
      programId: req.body.programId || undefined,
      price, isFree: price === 0 || !!req.body.isFree,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// The list used to include every product's file link for everyone, so a
// student could open a PAID item straight from the link without ever getting
// access (the "Request Access" button was only cosmetic). The link is now
// sent only for free items, or items this student/parent has been given.
export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const products = await DigitalProduct.find({ schoolId, status: "ACTIVE" }).sort({ createdAt: -1 });
    const limitedRole = req.user!.role === "STUDENT" || req.user!.role === "PARENT";
    if (!limitedRole) return res.json(products);

    const studentId = req.query.studentId as string | undefined;
    let owned = new Set<string>();
    if (studentId && (await canAccessStudent(req, studentId))) {
      const purchases = await Purchase.find({ schoolId, studentId }).select("productId");
      owned = new Set(purchases.map((p) => p.productId.toString()));
    }
    res.json(
      products.map((p) => {
        const o: any = p.toObject();
        if (!p.isFree && !owned.has(p._id.toString())) delete o.fileUrl;
        return o;
      })
    );
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const purchaseProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await DigitalProduct.findOne({ _id: req.body.productId, schoolId: req.user!.schoolId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const allowed = await canAccessStudent(req, req.body.studentId);
    if (!allowed) return res.status(403).json({ message: "You do not have access to purchase for this student" });

    // Self-checkout only exists for free material - there's no payment
    // gateway wired into this endpoint, so a student/parent hitting it
    // directly for a paid product would get the file for free with the
    // "Rs. {price}" tag being purely cosmetic. Every other paid flow in
    // this app (fees, invoices) has staff record the payment after
    // actually collecting it - this matches that instead of trusting the
    // client to only click "Buy" after really paying.
    if (!product.isFree && (req.user!.role === "STUDENT" || req.user!.role === "PARENT")) {
      return res.status(402).json({
        message: "This is a paid item. Please contact the academy office to arrange payment - access will be granted once payment is recorded.",
      });
    }

    const existing = await Purchase.findOne({ schoolId: req.user!.schoolId, productId: product._id, studentId: req.body.studentId });
    if (existing) return res.status(400).json({ message: "Already have access to this item" });

    const purchase = await Purchase.create({ productId: product._id, studentId: req.body.studentId, schoolId: req.user!.schoolId });
    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const purchases = await Purchase.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string }).populate("productId");
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
