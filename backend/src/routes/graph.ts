import { Router } from "express";
import { getGraph } from "../controllers/graphController";

const router = Router();

router.get("/:id", getGraph);

export default router;
