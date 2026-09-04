"""
Abstract base class for all predictor implementations.

To add a new predictor:
1. Subclass BasePredictor
2. Implement predict() and (optionally) is_ready()
3. Register it in app.py

Current implementations:
  - MockPredictor       (heuristic demo — usable immediately)
  - TemporalGNNPredictor (placeholder — requires training)
"""

from abc import ABC, abstractmethod
from typing import List
from schemas import GraphSnapshot, ForecastResult


class BasePredictor(ABC):
    """
    Abstract interface that every predictor must implement.
    The frontend/backend APIs only interact with this interface,
    so predictors can be swapped without changing any other code.
    """

    @property
    def name(self) -> str:
        return self.__class__.__name__

    @property
    def mode(self) -> str:
        """Returns 'demo' or 'model'."""
        return "demo"

    def is_ready(self) -> bool:
        """
        Returns True if the predictor is ready to serve predictions.
        Override in subclasses that require model loading.
        """
        return True

    @abstractmethod
    def predict(
        self,
        graph_sequence: List[GraphSnapshot],
        horizons: int = 3,
        include_explanation: bool = True,
        include_attack_path: bool = True,
    ) -> ForecastResult:
        """
        Given a sequence of graph snapshots (G_1, G_2, ..., G_T),
        return a ForecastResult containing:
          - current risk score
          - multi-horizon risk forecasts
          - predicted attack stage
          - likely target node
          - predicted attack path
          - explanation / feature importance

        Parameters
        ----------
        graph_sequence : list of GraphSnapshot
            Ordered sequence of graph snapshots from oldest to most recent.
            graph_sequence[-1] is the current state.
        horizons : int
            Number of future time windows to forecast (1–5).
        include_explanation : bool
            Whether to compute and include explainability data.
        include_attack_path : bool
            Whether to compute and include the predicted attack path.

        Returns
        -------
        ForecastResult
            Full forecast result with mode field set appropriately.
        """
        ...
