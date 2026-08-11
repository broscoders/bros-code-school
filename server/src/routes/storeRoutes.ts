import { Router } from "express";
import {
  createSurvey, getSurveys, submitSurveyResponse, getSurveyResponses,
  createProduct, getProducts, purchaseProduct, getMyPurchases,
} from "../controllers/storeController";

const router = Router();

router.post("/surveys", createSurvey);
router.get("/surveys", getSurveys);
router.post("/surveys/respond", submitSurveyResponse);
router.get("/surveys/:id/responses", getSurveyResponses);

router.post("/store/products", createProduct);
router.get("/store/products", getProducts);
router.post("/store/purchase", purchaseProduct);
router.get("/store/my-purchases", getMyPurchases);

export default router;
