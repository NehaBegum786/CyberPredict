import type { Request, Response } from "express";
import { runForecast, getGraphSnapshot } from "../services/forecastService";
import { MOCK_FORECAST } from "../utils/mockData";
import { sendError, AppError } from "../utils/errors";

/** POST /api/forecast  — run forecast on provided graph sequence */
export async function postForecast(req: Request, res: Response): Promise<void> {
  try {
    const { graph_sequence, horizons } = req.body as {
      graph_sequence?: unknown[];
      horizons?: number;
    };

    const h = Math.min(Math.max(horizons ?? 3, 1), 5);
    const seq = Array.isArray(graph_sequence) ? graph_sequence : [];

    // If no graph sequence provided, use demo snapshot
    const sequence =
      seq.length > 0 ? (seq as Parameters<typeof runForecast>[0]) : [await getGraphSnapshot("demo")];

    const result = await runForecast(sequence, h);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

/** GET /api/forecast/:id  — retrieve stored forecast */
export async function getForecast(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) throw new AppError("Forecast ID required", 400);

    // In demo mode return mock; real implementation would fetch from DB
    const result = {
      ...MOCK_FORECAST,
      id,
      timestamp: new Date().toISOString(),
    };
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}
