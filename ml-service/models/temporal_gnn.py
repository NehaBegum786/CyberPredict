"""
TemporalGNNPredictor — placeholder for the proposed Temporal GNN model.

Architecture concept:
    Graph snapshots [G_1, ..., G_T]
          ↓
    GNN Encoder (per snapshot)
          ↓ node/edge embeddings h_t
    Temporal Encoder (across windows)
          ↓ temporal context c_T
    Forecast Head
          ↓
    Multi-horizon risk + attack path

Candidate architectures:
    GNN layer:       GCN / GraphSAGE / GAT
    Temporal layer:  GRU / Transformer / TGN (Temporal Graph Network)

Status: NOT TRAINED — requires:
    1. Dataset preparation (CICIDS2017, NF-ToN-IoT, or custom)
    2. Training loop implementation (train.py)
    3. Model checkpoint saved to models/checkpoints/temporal_gnn.pt
    4. Calling load_checkpoint() before use

TODO: Implement full training pipeline and replace MockPredictor.
"""

from typing import List, Optional
from models.base_predictor import BasePredictor
from schemas import GraphSnapshot, ForecastResult


class TemporalGNNPredictor(BasePredictor):
    """
    Placeholder for the Temporal GNN predictor.

    This class defines the interface and architecture sketch.
    It will raise NotImplementedError until a trained checkpoint is loaded.

    Usage (once trained):
        predictor = TemporalGNNPredictor()
        predictor.load_checkpoint("models/checkpoints/temporal_gnn.pt")
        result = predictor.predict(graph_sequence, horizons=3)
    """

    def __init__(self):
        self._model = None
        self._is_loaded = False
        # TODO: Initialize model architecture here
        # Example:
        #   self._gnn = GraphSAGE(in_channels=16, hidden_channels=64, out_channels=32)
        #   self._temporal = GRU(input_size=32, hidden_size=64, num_layers=2)
        #   self._forecast_head = Linear(64, horizons)

    @property
    def mode(self) -> str:
        return "model"

    def is_ready(self) -> bool:
        return self._is_loaded

    def load_checkpoint(self, checkpoint_path: str) -> None:
        """
        Load trained model weights from a checkpoint file.

        Parameters
        ----------
        checkpoint_path : str
            Path to the .pt checkpoint saved by train.py

        TODO: Implement this method after training.
        Example:
            import torch
            checkpoint = torch.load(checkpoint_path, map_location="cpu")
            self._gnn.load_state_dict(checkpoint["gnn_state_dict"])
            self._temporal.load_state_dict(checkpoint["temporal_state_dict"])
            self._forecast_head.load_state_dict(checkpoint["head_state_dict"])
            self._is_loaded = True
        """
        raise NotImplementedError(
            "TemporalGNNPredictor.load_checkpoint() is not yet implemented. "
            "Train the model first using train.py."
        )

    def _encode_graph(self, graph: GraphSnapshot):
        """
        TODO: Convert a GraphSnapshot to a PyTorch Geometric Data object
        and pass it through the GNN encoder.

        Returns node embeddings h ∈ R^{N × d}
        """
        raise NotImplementedError("GNN encoder not implemented — model not trained.")

    def _encode_temporal(self, embeddings_sequence: list):
        """
        TODO: Pass the sequence of per-snapshot node embeddings through
        the temporal encoder (GRU / Transformer).

        Returns temporal context c ∈ R^{d_t}
        """
        raise NotImplementedError("Temporal encoder not implemented — model not trained.")

    def _forecast_head(self, context, horizons: int):
        """
        TODO: Apply the forecast head to project future risk scores
        for each horizon H1..Hn.
        """
        raise NotImplementedError("Forecast head not implemented — model not trained.")

    def predict(
        self,
        graph_sequence: List[GraphSnapshot],
        horizons: int = 3,
        include_explanation: bool = True,
        include_attack_path: bool = True,
    ) -> ForecastResult:
        """
        Full inference pipeline.

        TODO: Once load_checkpoint() is implemented, this method should:
          1. Encode each snapshot: h_t = self._encode_graph(G_t)
          2. Encode temporal sequence: c = self._encode_temporal([h_1, ..., h_T])
          3. Forecast: risks = self._forecast_head(c, horizons)
          4. Identify target via node attention scores
          5. Build attack path via beam search over predicted node embeddings
          6. Compute SHAP values for explainability
        """
        if not self._is_loaded:
            raise RuntimeError(
                "TemporalGNNPredictor is not ready. "
                "Load a trained checkpoint with load_checkpoint() first. "
                "Use MockPredictor for demonstration."
            )
        # Execution flow (post-training):
        # embeddings = [self._encode_graph(g) for g in graph_sequence]
        # context = self._encode_temporal(embeddings)
        # risk_scores = self._forecast_head(context, horizons)
        # ... build ForecastResult ...
        raise NotImplementedError("Full inference pipeline pending model training.")
