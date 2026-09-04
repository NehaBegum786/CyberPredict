import type { Request, Response } from "express";
import { getGraphSnapshot } from "../services/forecastService";
import { sendError, AppError } from "../utils/errors";

export async function getGraph(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) throw new AppError("Dataset ID required", 400);

    const snapshot = await getGraphSnapshot(id);
    res.json(snapshot);
  } catch (err) {
    sendError(res, err);
  }
}
