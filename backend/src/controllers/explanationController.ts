import type { Request, Response } from "express";
import { MOCK_EXPLANATION } from "../utils/mockData";
import { sendError } from "../utils/errors";

export async function getExplanation(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    res.json({ ...MOCK_EXPLANATION, forecastId: id });
  } catch (err) {
    sendError(res, err);
  }
}
