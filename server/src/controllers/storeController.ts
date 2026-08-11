import type { Request, Response } from "express";
import Survey from "../models/Survey";
import SurveyResponse from "../models/SurveyResponse";
import DigitalProduct from "../models/DigitalProduct";
import Purchase from "../models/Purchase";

// Surveys
export const createSurvey = async (req: Request, res: Response) => {
  try {
    const survey = await Survey.create(req.body);
    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSurveys = async (req: Request, res: Response) => {
  try {
    const surveys = await Survey.find({ schoolId: req.query.schoolId, isActive: true });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitSurveyResponse = async (req: Request, res: Response) => {
  try {
    const response = await SurveyResponse.create(req.body);
    res.status(201).json(response);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSurveyResponses = async (req: Request, res: Response) => {
  try {
    const responses = await SurveyResponse.find({ surveyId: req.params.id }).populate("respondedBy");
    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Digital Store
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await DigitalProduct.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await DigitalProduct.find({ schoolId: req.query.schoolId, status: "ACTIVE" });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const purchaseProduct = async (req: Request, res: Response) => {
  try {
    const purchase = await Purchase.create(req.body);
    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyPurchases = async (req: Request, res: Response) => {
  try {
    const purchases = await Purchase.find({ studentId: req.query.studentId }).populate("productId");
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
