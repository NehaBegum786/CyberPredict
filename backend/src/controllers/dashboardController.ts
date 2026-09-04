import type { Request, Response } from "express";
import { MOCK_DASHBOARD_STATS, MOCK_ALERTS } from "../utils/mockData";
import { sendError } from "../utils/errors";

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  try {
    const stats = {
      ...MOCK_DASHBOARD_STATS,
      lastUpdated: new Date().toISOString(),
    };
    res.json(stats);
  } catch (err) {
    sendError(res, err);
  }
}

export async function getAlerts(_req: Request, res: Response): Promise<void> {
  try {
    res.json(MOCK_ALERTS);
  } catch (err) {
    sendError(res, err);
  }
}
