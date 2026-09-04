import axios from "axios";
import { MOCK_FORECAST, MOCK_GRAPH_SNAPSHOT } from "../utils/mockData";
import type { ForecastResult, GraphSnapshot } from "../types";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const DEMO_MODE = process.env.DEMO_MODE !== "false"; // default true

/**
 * Run a forecast for the given graph sequence.
 * In DEMO_MODE, returns mock data immediately.
 * In model mode, calls the Python ML service.
 */
export async function runForecast(
  graphSequence: GraphSnapshot[],
  horizons: number = 3
): Promise<ForecastResult> {
  if (DEMO_MODE) {
    // Return mock forecast with a small artificial delay
    await new Promise((r) => setTimeout(r, 300));
    return {
      ...MOCK_FORECAST,
      timestamp: new Date().toISOString(),
      forecast: MOCK_FORECAST.forecast.slice(0, horizons),
      mode: "demo",
    };
  }

  // Call real ML service
  const response = await axios.post<ForecastResult>(
    `${ML_SERVICE_URL}/predict`,
    { graph_sequence: graphSequence, horizons },
    { timeout: 30000 }
  );
  return response.data;
}

/**
 * Get the current graph snapshot for a dataset.
 * In DEMO_MODE returns the mock snapshot.
 */
export async function getGraphSnapshot(datasetId: string): Promise<GraphSnapshot> {
  if (DEMO_MODE || datasetId === "demo") {
    return { ...MOCK_GRAPH_SNAPSHOT, datasetId };
  }
  const response = await axios.get<GraphSnapshot>(
    `${ML_SERVICE_URL}/graph/${datasetId}`
  );
  return response.data;
}
