"""
ForecastingService — orchestrates the prediction pipeline.

This service:
  1. Accepts a graph sequence
  2. Routes to the active predictor (MockPredictor or TemporalGNNPredictor)
  3. Returns the ForecastResult

To switch predictors, change the PREDICTOR_MODE env variable:
    PREDICTOR_MODE=demo   → MockPredictor (default)
    PREDICTOR_MODE=model  → TemporalGNNPredictor (requires trained checkpoint)
"""

import os
from typing import List

from models.mock_predictor import MockPredictor
from models.temporal_gnn import TemporalGNNPredictor
from models.base_predictor import BasePredictor
from schemas import GraphSnapshot, ForecastResult


class ForecastingService:
    """
    Service that routes prediction requests to the correct predictor.
    """

    def __init__(self):
        self._predictor: BasePredictor = self._load_predictor()

    def _load_predictor(self) -> BasePredictor:
        mode = os.getenv("PREDICTOR_MODE", "demo").lower()

        if mode == "model":
            checkpoint = os.getenv("MODEL_CHECKPOINT_PATH", "models/checkpoints/temporal_gnn.pt")
            predictor = TemporalGNNPredictor()
            if os.path.exists(checkpoint):
                try:
                    predictor.load_checkpoint(checkpoint)
                    print(f"[ForecastingService] Loaded TemporalGNNPredictor from {checkpoint}")
                    return predictor
                except Exception as e:
                    print(f"[ForecastingService] Failed to load checkpoint: {e}. Falling back to MockPredictor.")
            else:
                print(f"[ForecastingService] Checkpoint not found: {checkpoint}. Falling back to MockPredictor.")

        print("[ForecastingService] Using MockPredictor (Demo Forecast Mode)")
        return MockPredictor()

    @property
    def predictor_name(self) -> str:
        return self._predictor.name

    @property
    def mode(self) -> str:
        return self._predictor.mode

    def predict(
        self,
        graph_sequence: List[GraphSnapshot],
        horizons: int = 3,
        include_explanation: bool = True,
        include_attack_path: bool = True,
    ) -> ForecastResult:
        """
        Run prediction on the graph sequence.

        Parameters
        ----------
        graph_sequence : List[GraphSnapshot]
            Ordered list of graph snapshots (oldest first, current last).
        horizons : int
            Number of future windows to forecast.
        include_explanation : bool
        include_attack_path : bool

        Returns
        -------
        ForecastResult
        """
        if not graph_sequence:
            raise ValueError("graph_sequence must not be empty")

        return self._predictor.predict(
            graph_sequence=graph_sequence,
            horizons=horizons,
            include_explanation=include_explanation,
            include_attack_path=include_attack_path,
        )


# Module-level singleton
_service: ForecastingService | None = None


def get_forecasting_service() -> ForecastingService:
    global _service
    if _service is None:
        _service = ForecastingService()
    return _service
