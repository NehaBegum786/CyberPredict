import { Router } from "express";
import { getAttackPath } from "../controllers/attackPathController";

const router = Router();
router.get("/:id", getAttackPath);

export default router;
