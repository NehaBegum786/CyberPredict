import { Router } from "express";
import { getDashboard, getAlerts } from "../controllers/dashboardController";

const router = Router();

router.get("/",       getDashboard);
router.get("/alerts", getAlerts);

export default router;
