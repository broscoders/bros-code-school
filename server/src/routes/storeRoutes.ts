import { Router } from "express";
import {
  createSurvey, getSurveys, submitSurveyResponse, getSurveyResponses,
  createProduct, getProducts, purchaseProduct, getMyPurchases,
} from "../controllers/storeController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMIC_STAFF, ACADEMY_STAFF, EVERYONE, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/surveys", protect, requireRole(...ACADEMIC_STAFF), createSurvey);
router.get("/surveys", protect, requireRole(...EVERYONE), getSurveys);
router.post("/surveys/respond", protect, requireRole(...EVERYONE), submitSurveyResponse);
router.get("/surveys/:id/responses", protect, requireRole(...ACADEMIC_STAFF), getSurveyResponses);

router.post("/store/products", protect, requireRole(...ACADEMY_STAFF), createProduct);
router.get("/store/products", protect, requireRole(...EVERYONE), getProducts);
router.post("/store/purchase", protect, requireRole(ROLES.STUDENT, ROLES.PARENT, ...ACADEMY_STAFF), purchaseProduct);
router.get("/store/my-purchases", protect, requireRole(...EVERYONE), getMyPurchases);

export default router;
