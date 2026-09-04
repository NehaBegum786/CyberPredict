import type { Request, Response } from "express";
import { MOCK_ATTACK_PATH } from "../utils/mockData";
import { sendError } from "../utils/errors";

export async function getAttackPath(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    // In demo mode always return mock path
    res.json({ ...MOCK_ATTACK_PATH, forecastId: id });
  } catch (err) {
    sendError(res, err);
  }
}
