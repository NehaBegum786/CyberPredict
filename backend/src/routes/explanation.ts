import { Router } from "express";
import { getExplanation } from "../controllers/explanationController";

const router = Router();
router.get("/:id", getExplanation);

export default router;
