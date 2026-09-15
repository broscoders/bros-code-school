import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent } from "../utils/accessControl";
import Survey from "../models/Survey";
import SurveyResponse from "../models/SurveyResponse";
import DigitalProduct from "../models/DigitalProduct";
import Purchase from "../models/Purchase";

// Surveys
export const createSurvey = async (req: AuthRequest, res: Response) => {
  try {
    const survey = await Survey.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSurveys = async (req: AuthRequest, res: Response) => {
  try {
    const surveys = await Survey.find({ schoolId: req.user!.schoolId, isActive: true });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitSurveyResponse = async (req: AuthRequest, res: Response) => {
  try {
    const survey = await Survey.findOne({ _id: req.body.surveyId, schoolId: req.user!.schoolId });
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    const response = await SurveyResponse.create({ ...req.body, respondedBy: req.user!.userId });
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
    const product = await DigitalProduct.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const products = await DigitalProduct.find({ schoolId: req.user!.schoolId, status: "ACTIVE" });
    res.json(products);
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
