import { Router } from "express";
import { postForecast, getForecast } from "../controllers/forecastController";

const router = Router();

router.post("/",    postForecast);
router.get("/:id",  getForecast);

export default router;
