# 🔬 CyberPredict Implementation Guide
## Module-by-Module Deep Dive: Dataset Processing to Temporal GNN Prediction

---

# 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Module 1: Dataset Processing Pipeline](#module-1-dataset-processing)
3. [Module 2: Graph Construction](#module-2-graph-construction)
4. [Module 3: Temporal Window Management](#module-3-temporal-windows)
5. [Module 4: Graph Neural Network (GNN)](#module-4-gnn)
6. [Module 5: Temporal Modeling (GRU)](#module-5-gru-temporal)
7. [Module 6: Attack Prediction & Forecasting](#module-6-prediction)
8. [Module 7: Attack Path Detection](#module-7-attack-path)
9. [Complete Data Flow](#complete-data-flow)

---

# 1️⃣ System Overview

## Current Status vs Designed Architecture

### ⚠️ Current Implementation (What's Running Now)
```
CSV Upload → Label Counter (quick_analyzer.py) → Statistics Display
```
- **NO ML models trained**
- **NO graph construction**
- **NO GNN/GRU**
- Just reads existing labels and counts them

### 🎯 Designed Architecture (What Should Happen)
```
CSV Upload → Graph Construction → Temporal Windows → GNN Encoder 
           → GRU Temporal Model → Attack Forecasting → Path Detection
```

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT: Network Traffic CSV                   │
│         (CIC-IDS2017 / UNSW-NB15 / Custom Format)               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MODULE 1: Dataset Processing                       │
│  • Load CSV with Pandas                                         │
│  • Extract features (79 for CIC-IDS2017, 45 for UNSW-NB15)     │
│  • Normalize numerical features                                 │
│  • Encode categorical features                                  │
│  • Handle missing values                                        │
│  Output: Cleaned DataFrame with features + labels               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MODULE 2: Graph Construction                       │
│  • Group flows by time windows (e.g., 5 minutes)                │
│  • Create nodes (hosts = unique IPs)                            │
│  • Create edges (connections = src→dst flows)                   │
│  • Aggregate edge features (packet count, byte count, etc.)     │
│  • Compute node features (degree, traffic volume, etc.)         │
│  Output: Sequence of graph snapshots [G₁, G₂, ..., Gₜ]         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MODULE 3: Temporal Window Management               │
│  • Sliding window over graph sequence                           │
│  • Look-back window: T_history (e.g., 10 snapshots)            │
│  • Forecast horizon: T_future (e.g., 3 snapshots)              │
│  • Create training samples: (G_{t-T}...G_t) → (y_{t+1}...y_{t+H})│
│  Output: Temporal sequences for training/inference              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MODULE 4: Graph Neural Network (GNN)               │
│  Per Snapshot Encoding:                                         │
│  • Input: Graph G_t = (V_t, E_t, X_t, A_t)                      │
│  • GNN Layers: GraphSAGE / GAT / GCN                            │
│  • Message passing: aggregate neighbor info                     │
│  • Node embeddings: h_t^i for each node i                       │
│  • Graph pooling: H_t = READOUT({h_t^i})                        │
│  Output: Graph-level embeddings H₁, H₂, ..., Hₜ                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MODULE 5: Temporal Modeling (GRU)                  │
│  Sequence Encoding:                                             │
│  • Input: [H₁, H₂, ..., Hₜ] (graph embeddings over time)       │
│  • GRU cell: captures temporal dependencies                     │
│  • Hidden state: c_t = GRU(H_t, c_{t-1})                        │
│  • Final context: c_T (encodes entire history)                  │
│  Output: Temporal context vector c_T                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MODULE 6: Attack Prediction & Forecasting          │
│  Multi-Horizon Forecasting:                                     │
│  • Input: Temporal context c_T                                  │
│  • Forecast head: Multi-layer perceptron (MLP)                  │
│  • Output: Risk scores for H₁, H₂, H₃ (future windows)         │
│  • Classification: Attack type per horizon                      │
│  Output: {risk_H1, risk_H2, risk_H3, attack_type}              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MODULE 7: Attack Path Detection                    │
│  Graph Attention Analysis:                                      │
│  • Node attention scores from GNN                               │
│  • Identify high-risk nodes                                     │
│  • Trace edges: entry → pivot → target                         │
│  • Beam search over possible paths                              │
│  Output: Most likely attack path with probabilities             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT: Forecast Result                      │
│  • Current risk score                                           │
│  • Multi-horizon forecasts (H1, H2, H3)                         │
│  • Predicted attack stage                                       │
│  • Attack path visualization                                    │
│  • Feature importance (explainability)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

# 2️⃣ Module 1: Dataset Processing Pipeline

## Purpose
Transform raw network traffic CSV into clean, normalized feature matrices ready for graph construction.

## Input
```
CIC-IDS2017 CSV Format:
- Columns: 79 features + 1 label
- Rows: ~2.8M network flow records
- Format: src_ip, dst_ip, src_port, dst_port, protocol, timestamp, 
          flow_duration, fwd_packets, bwd_packets, fwd_bytes, bwd_bytes, ...
```

## Processing Steps

### Step 1.1: Load CSV
```python
import pandas as pd

def load_dataset(file_path):
    """
    Load CSV with proper encoding and data types.
    """
    df = pd.read_csv(
        file_path,
        encoding='utf-8',
        low_memory=False,
        na_values=['Infinity', 'NaN', 'inf', '-inf']
    )
    return df
```

**What Happens:**
- Pandas reads entire CSV into memory (DataFrame)
- Detects column types automatically
- Handles special values (Infinity, NaN)
- ~2.8M rows × 80 columns for CIC-IDS2017

### Step 1.2: Feature Extraction
```python
def extract_features(df):
    """
    Separate features from labels.
    """
    # Identify label column
    label_col = 'Label'  # or ' Label' (whitespace)
    
    # Features: all columns except label
    feature_cols = [c for c in df.columns if c.strip() != label_col.strip()]
    
    X = df[feature_cols]  # Feature matrix
    y = df[label_col]     # Labels
    
    return X, y
```

**What Happens:**
- Splits data into features (X) and labels (y)
- X shape: (2.8M, 79) for CIC-IDS2017
- y shape: (2.8M,) with values like "BENIGN", "DDoS", "PortScan"

### Step 1.3: Handle Missing Values
```python
def handle_missing_values(X):
    """
    Strategy:
    - Numerical columns: fill with median
    - Categorical columns: fill with mode
    - Drop columns with >50% missing values
    """
    # Identify columns with >50% missing
    missing_pct = X.isnull().sum() / len(X)
    drop_cols = missing_pct[missing_pct > 0.5].index
    X = X.drop(columns=drop_cols)
    
    # Fill numerical columns with median
    numerical_cols = X.select_dtypes(include=['float64', 'int64']).columns
    for col in numerical_cols:
        X[col].fillna(X[col].median(), inplace=True)
    
    # Fill categorical columns with mode
    categorical_cols = X.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        X[col].fillna(X[col].mode()[0], inplace=True)
    
    return X
```

**Why This Matters:**
- ML models cannot handle NaN/missing values
- Median is robust to outliers (better than mean)
- Dropping columns with too many missing avoids poor quality features

### Step 1.4: Feature Normalization
```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler

def normalize_features(X):
    """
    Normalize numerical features to [0, 1] or z-score.
    
    Method 1: Min-Max Scaling (→ [0, 1])
    Method 2: Standardization (→ mean=0, std=1)
    """
    scaler = StandardScaler()  # or MinMaxScaler()
    
    numerical_cols = X.select_dtypes(include=['float64', 'int64']).columns
    X[numerical_cols] = scaler.fit_transform(X[numerical_cols])
    
    return X, scaler
```

**Why This Matters:**
- Different features have different scales (e.g., packet count vs. flow duration)
- Neural networks work better with normalized inputs
- Prevents features with large values from dominating

### Step 1.5: Encode Categorical Features
```python
from sklearn.preprocessing import LabelEncoder

def encode_categorical(X):
    """
    Convert categorical columns (like protocol, src_ip, dst_ip) to integers.
    """
    categorical_cols = X.select_dtypes(include=['object']).columns
    
    encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le
    
    return X, encoders
```

**Example:**
```
Protocol:    TCP    → 0
             UDP    → 1
             ICMP   → 2

Src IP:      192.168.1.1    → 0
             192.168.1.2    → 1
             10.0.0.5       → 2
```

### Step 1.6: Label Encoding
```python
def encode_labels(y):
    """
    Convert attack labels to integers.
    
    Binary classification: BENIGN=0, ATTACK=1
    Multi-class: BENIGN=0, DDoS=1, PortScan=2, ...
    """
    # For CIC-IDS2017: Multi-class
    label_mapping = {
        'BENIGN': 0,
        'DDoS': 1,
        'PortScan': 2,
        'Web Attack': 3,
        'Infiltration': 4,
        'Bot': 5,
        # ... etc
    }
    
    y_encoded = y.map(label_mapping)
    return y_encoded, label_mapping
```

## Output
```python
{
    'X': np.ndarray,           # Shape: (N, D) - N samples, D features
    'y': np.ndarray,           # Shape: (N,) - N labels (integers)
    'feature_names': List[str],
    'label_mapping': Dict[str, int],
    'scaler': StandardScaler,
    'encoders': Dict[str, LabelEncoder]
}
```

---

# 3️⃣ Module 2: Graph Construction

## Purpose
Convert flat network flow records into graph snapshots where:
- **Nodes** = Hosts (unique IP addresses)
- **Edges** = Communications (src → dst connections)

## Conceptual Transformation

### Before (Tabular Data):
```
| src_ip      | dst_ip      | protocol | packets | bytes | label  |
|-------------|-------------|----------|---------|-------|--------|
| 192.168.1.5 | 10.0.0.3    | TCP      | 120     | 45000 | BENIGN |
| 192.168.1.5 | 10.0.0.7    | TCP      | 350     | 89000 | DDoS   |
| 10.0.0.3    | 192.168.1.8 | UDP      | 80      | 12000 | BENIGN |
```

### After (Graph):
```
Nodes:
  - 192.168.1.5 (degree=2, out_traffic=134000)
  - 10.0.0.3    (degree=2, in_traffic=45000, out_traffic=12000)
  - 10.0.0.7    (degree=1, in_traffic=89000)
  - 192.168.1.8 (degree=1, in_traffic=12000)

Edges:
  - 192.168.1.5 → 10.0.0.3 (packets=120, bytes=45000, label=BENIGN)
  - 192.168.1.5 → 10.0.0.7 (packets=350, bytes=89000, label=DDoS)
  - 10.0.0.3 → 192.168.1.8 (packets=80, bytes=12000, label=BENIGN)
```

## Implementation Steps

### Step 2.1: Time Window Segmentation
```python
def create_time_windows(df, window_size='5T'):
    """
    Split data into time windows.
    
    Parameters:
    - window_size: '5T' = 5 minutes, '10T' = 10 minutes
    
    Returns: List of DataFrames, one per window
    """
    # Ensure timestamp is datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sort by timestamp
    df = df.sort_values('timestamp')
    
    # Group by time windows
    df['window_id'] = df['timestamp'].dt.floor(window_size)
    
    windows = []
    for window_id, group in df.groupby('window_id'):
        windows.append({
            'window_id': window_id,
            'data': group,
            'start_time': group['timestamp'].min(),
            'end_time': group['timestamp'].max(),
            'flow_count': len(group)
        })
    
    return windows
```

**What Happens:**
```
Window 1 (00:00-00:05): 15,000 flows
Window 2 (00:05-00:10): 18,500 flows
Window 3 (00:10-00:15): 12,300 flows
...
```

### Step 2.2: Node Creation
```python
def create_nodes(window_df):
    """
    Extract unique hosts (IPs) as nodes.
    Compute node-level features.
    """
    # Get unique IPs (both source and destination)
    src_ips = set(window_df['src_ip'].unique())
    dst_ips = set(window_df['dst_ip'].unique())
    all_ips = src_ips.union(dst_ips)
    
    nodes = []
    for ip in all_ips:
        # Compute node features
        node_features = compute_node_features(ip, window_df)
        nodes.append({
            'id': ip,
            'features': node_features,
            'label': get_node_label(ip, window_df)  # Attack or benign
        })
    
    return nodes

def compute_node_features(ip, df):
    """
    Node-level statistical features.
    """
    # Flows where this IP is source
    out_flows = df[df['src_ip'] == ip]
    # Flows where this IP is destination
    in_flows = df[df['dst_ip'] == ip]
    
    features = {
        'degree_in': len(in_flows),
        'degree_out': len(out_flows),
        'total_degree': len(in_flows) + len(out_flows),
        
        'in_packets': in_flows['packets'].sum(),
        'out_packets': out_flows['packets'].sum(),
        
        'in_bytes': in_flows['bytes'].sum(),
        'out_bytes': out_flows['bytes'].sum(),
        
        'unique_dst': out_flows['dst_ip'].nunique(),  # Destination diversity
        'unique_src': in_flows['src_ip'].nunique(),   # Source diversity
        
        'protocol_entropy': compute_entropy(out_flows['protocol']),
        'port_entropy': compute_entropy(out_flows['dst_port']),
        
        # Behavioral features
        'avg_packet_size': out_flows['bytes'].sum() / max(out_flows['packets'].sum(), 1),
        'flow_rate': len(out_flows) / 300,  # flows per second (5 min = 300 sec)
    }
    
    return list(features.values())
```

**Node Feature Vector Example:**
```
Node: 192.168.1.5
Features: [
    2,      # degree_in
    5,      # degree_out
    7,      # total_degree
    450,    # in_packets
    1230,   # out_packets
    65000,  # in_bytes
    189000, # out_bytes
    5,      # unique destinations contacted
    2,      # unique sources
    1.45,   # protocol entropy
    2.31,   # port entropy
    153.6,  # avg packet size
    0.023   # flow rate (flows/sec)
]
```

### Step 2.3: Edge Creation
```python
def create_edges(window_df):
    """
    Create edges for each src→dst communication.
    Aggregate flows between same pair.
    """
    # Group by (src_ip, dst_ip) to aggregate multiple flows
    edge_groups = window_df.groupby(['src_ip', 'dst_ip'])
    
    edges = []
    for (src, dst), group in edge_groups:
        edge_features = compute_edge_features(group)
        edges.append({
            'source': src,
            'target': dst,
            'features': edge_features,
            'label': get_edge_label(group)  # Attack or benign
        })
    
    return edges

def compute_edge_features(edge_df):
    """
    Edge-level features (aggregated over all flows between src→dst).
    """
    features = {
        'flow_count': len(edge_df),
        'total_packets': edge_df['packets'].sum(),
        'total_bytes': edge_df['bytes'].sum(),
        
        'avg_packets_per_flow': edge_df['packets'].mean(),
        'std_packets_per_flow': edge_df['packets'].std(),
        
        'avg_bytes_per_flow': edge_df['bytes'].mean(),
        'std_bytes_per_flow': edge_df['bytes'].std(),
        
        'protocol_diversity': edge_df['protocol'].nunique(),
        'port_diversity': edge_df['dst_port'].nunique(),
        
        'duration_total': edge_df['flow_duration'].sum(),
        'duration_avg': edge_df['flow_duration'].mean(),
        
        # TCP flags (if available)
        'syn_count': edge_df['syn_flag'].sum(),
        'ack_count': edge_df['ack_flag'].sum(),
        'fin_count': edge_df['fin_flag'].sum(),
    }
    
    return list(features.values())
```

**Edge Feature Vector Example:**
```
Edge: 192.168.1.5 → 10.0.0.7
Features: [
    12,     # flow_count (12 separate flows)
    1850,   # total_packets
    285000, # total_bytes
    154.2,  # avg_packets_per_flow
    45.3,   # std_packets_per_flow
    23750,  # avg_bytes_per_flow
    8920,   # std_bytes_per_flow
    2,      # protocol_diversity (TCP + UDP)
    5,      # port_diversity (5 different ports)
    45.8,   # duration_total (seconds)
    3.82,   # duration_avg
    12,     # SYN flags
    8,      # ACK flags
    3       # FIN flags
]
```

### Step 2.4: Build PyTorch Geometric Graph
```python
import torch
from torch_geometric.data import Data

def build_pyg_graph(nodes, edges):
    """
    Convert nodes and edges into PyTorch Geometric Data object.
    """
    # Create node ID mapping (IP → integer index)
    node_to_idx = {node['id']: idx for idx, node in enumerate(nodes)}
    
    # Node feature matrix: shape (N, D)
    x = torch.tensor([node['features'] for node in nodes], dtype=torch.float)
    
    # Node labels: shape (N,)
    node_labels = torch.tensor([node['label'] for node in nodes], dtype=torch.long)
    
    # Edge index: shape (2, E) - list of [source_idx, target_idx]
    edge_index = []
    edge_features = []
    edge_labels = []
    
    for edge in edges:
        src_idx = node_to_idx[edge['source']]
        dst_idx = node_to_idx[edge['target']]
        
        edge_index.append([src_idx, dst_idx])
        edge_features.append(edge['features'])
        edge_labels.append(edge['label'])
    
    edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
    edge_attr = torch.tensor(edge_features, dtype=torch.float)
    edge_labels = torch.tensor(edge_labels, dtype=torch.long)
    
    # Create PyG Data object
    graph = Data(
        x=x,                          # Node features [N, D]
        edge_index=edge_index,        # Edge connections [2, E]
        edge_attr=edge_attr,          # Edge features [E, F]
        y=node_labels,                # Node labels [N]
        edge_y=edge_labels            # Edge labels [E]
    )
    
    return graph
```

**PyG Graph Object:**
```python
Data(
    x=[1523, 13],           # 1523 nodes, 13 features each
    edge_index=[2, 8947],   # 8947 edges (directed)
    edge_attr=[8947, 14],   # 14 features per edge
    y=[1523],               # Node labels (0=benign, 1=attack)
    edge_y=[8947]           # Edge labels
)
```

## Output
```python
graph_sequence = [G_1, G_2, G_3, ..., G_T]  # List of PyG Data objects

# Each G_t represents one time window
G_1 = Data(x=[1200, 13], edge_index=[2, 5800], ...)  # Window 1
G_2 = Data(x=[1350, 13], edge_index=[2, 6200], ...)  # Window 2
...
```

---

# 4️⃣ Module 4: Graph Neural Network (GNN)

## Purpose
Encode each graph snapshot into a fixed-size embedding vector that captures:
- Node connectivity patterns
- Traffic flow characteristics
- Suspicious communication structures

## GNN Architectures (3 Options)

### Option 1: GraphSAGE (SAmple and aggreGatE)

**Why GraphSAGE?**
- Handles large graphs efficiently
- Inductive learning (generalizes to new nodes)
- Aggregates neighbor information

**Architecture:**
```python
import torch
import torch.nn as nn
from torch_geometric.nn import SAGEConv

class GraphSAGEEncoder(nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels)
        self.conv3 = SAGEConv(hidden_channels, out_channels)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
    
    def forward(self, x, edge_index):
        # Layer 1: Aggregate 1-hop neighbors
        x = self.conv1(x, edge_index)
        x = self.relu(x)
        x = self.dropout(x)
        
        # Layer 2: Aggregate 2-hop neighbors
        x = self.conv2(x, edge_index)
        x = self.relu(x)
        x = self.dropout(x)
        
        # Layer 3: Final embeddings
        x = self.conv3(x, edge_index)
        
        return x  # Shape: [N, out_channels]
```

**How It Works:**

**Step 4.1: Message Passing (Layer 1)**
```
For each node v:
    1. Get neighbors N(v)
    2. Aggregate neighbor features: h_N(v) = MEAN({h_u for u in N(v)})
    3. Concatenate with own features: [h_v || h_N(v)]
    4. Apply transformation: h_v^(1) = ReLU(W_1 · [h_v || h_N(v)])
```

**Example:**
```
Node A (192.168.1.5):
  - Own features: [2, 5, 7, 450, 1230, ...]  (13 dims)
  - Neighbors: B, C, D
  - Neighbor features:
      B: [1, 3, 4, 200, 800, ...]
      C: [0, 2, 2, 100, 300, ...]
      D: [3, 1, 4, 500, 950, ...]
  - Aggregated: MEAN(B, C, D) = [1.33, 2, 3.33, 266, 683, ...]
  - Concatenated: [2, 5, 7, ..., 1.33, 2, 3.33, ...]  (26 dims)
  - After W_1 transformation: [0.45, -1.2, 0.89, 2.1, ...]  (64 dims hidden)
```

**Step 4.2: Multi-Layer Aggregation**
```
Layer 1: 1-hop neighborhood
Layer 2: 2-hop neighborhood (neighbors of neighbors)
Layer 3: 3-hop neighborhood

Final embedding captures:
  - Immediate connections (1-hop)
  - Community structure (2-hop)
  - Global position (3-hop)
```

### Option 2: Graph Attention Network (GAT)

**Why GAT?**
- Learns importance of neighbors (attention weights)
- Focuses on most relevant connections
- Better for heterogeneous graphs

**Architecture:**
```python
from torch_geometric.nn import GATConv

class GATEncoder(nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels, heads=8):
        super().__init__()
        self.conv1 = GATConv(in_channels, hidden_channels, heads=heads, dropout=0.3)
        self.conv2 = GATConv(hidden_channels * heads, out_channels, heads=1, concat=False, dropout=0.3)
    
    def forward(self, x, edge_index):
        # Layer 1: Multi-head attention
        x = self.conv1(x, edge_index)
        x = F.elu(x)
        
        # Layer 2: Single-head output
        x = self.conv2(x, edge_index)
        
        return x
```

**How Attention Works:**
```python
# For edge (i → j), compute attention weight:
e_ij = LeakyReLU(a^T · [W·h_i || W·h_j])

# Normalize across all neighbors:
α_ij = softmax_j(e_ij) = exp(e_ij) / Σ_k exp(e_ik)

# Aggregate with attention weights:
h_i' = Σ_j α_ij · (W·h_j)
```

**Example:**
```
Node A has 3 neighbors: B, C, D

Attention scores:
  A→B: 0.65  (high attention - B is suspicious)
  A→C: 0.25  (medium attention)
  A→D: 0.10  (low attention - D is normal)

Aggregated embedding:
  h_A' = 0.65 * h_B + 0.25 * h_C + 0.10 * h_D
  
(More weight on suspicious neighbor B)
```

### Option 3: Graph Convolutional Network (GCN)

**Why GCN?**
- Simple and effective
- Spectral graph convolution
- Good baseline model

**Architecture:**
```python
from torch_geometric.nn import GCNConv

class GCNEncoder(nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = GCNConv(in_channels, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, out_channels)
    
    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.3, training=self.training)
        x = self.conv2(x, edge_index)
        return x
```

## Graph-Level Pooling

After GNN produces node embeddings, we need a single graph-level embedding.

**Method 1: Global Mean Pooling**
```python
from torch_geometric.nn import global_mean_pool

h_graph = global_mean_pool(x, batch)  # Average all node embeddings
```

**Method 2: Global Max Pooling**
```python
from torch_geometric.nn import global_max_pool

h_graph = global_max_pool(x, batch)  # Max over all node embeddings
```

**Method 3: Global Attention Pooling**
```python
from torch_geometric.nn import GlobalAttention

attention_layer = GlobalAttention(gate_nn=nn.Linear(hidden_channels, 1))
h_graph = attention_layer(x, batch)  # Weighted sum by learned attention
```

## Complete GNN Module

```python
class GNNGraphEncoder(nn.Module):
    """
    Encodes a graph snapshot into a fixed-size embedding.
    """
    def __init__(self, node_features, hidden_dim, output_dim):
        super().__init__()
        
        # GNN layers
        self.gnn = GraphSAGEEncoder(
            in_channels=node_features,
            hidden_channels=hidden_dim,
            out_channels=hidden_dim
        )
        
        # Graph pooling
        self.pool = global_mean_pool
        
        # Final projection
        self.fc = nn.Linear(hidden_dim, output_dim)
    
    def forward(self, data):
        # data is PyG Data object with x, edge_index, batch
        
        # Step 1: GNN encoding (node-level)
        node_embeddings = self.gnn(data.x, data.edge_index)
        # Shape: [N, hidden_dim] where N = total nodes in batch
        
        # Step 2: Graph pooling (graph-level)
        graph_embedding = self.pool(node_embeddings, data.batch)
        # Shape: [batch_size, hidden_dim]
        
        # Step 3: Final projection
        output = self.fc(graph_embedding)
        # Shape: [batch_size, output_dim]
        
        return output
```

**Flow Example:**
```
Input: G_t with 1200 nodes, 5800 edges
       ↓
Node features: [1200, 13] (13 input features)
       ↓
GNN Layer 1: [1200, 64] (64 hidden dims)
       ↓
GNN Layer 2: [1200, 64]
       ↓
GNN Layer 3: [1200, 64]
       ↓
Global pooling: [1, 64] (single graph embedding)
       ↓
Linear projection: [1, 128] (output embedding)
       ↓
Output: h_t ∈ R^128 (graph embedding for time t)
```

---

# 5️⃣ Module 5: Temporal Modeling with GRU

## Purpose
Capture temporal dependencies across graph snapshots:
- How the network evolves over time
- Attack progression patterns
- Temporal context for forecasting

## Why GRU (Gated Recurrent Unit)?

**Advantages:**
- Captures long-term dependencies
- Remembers important past events
- Forgets irrelevant information
- Simpler than LSTM (fewer parameters)

**Alternative: LSTM** (Long Short-Term Memory)
- More powerful but computationally expensive
- Use if GRU performance is insufficient

**Alternative: Transformer**
- Attention-based temporal modeling
- Better for very long sequences
- Higher computational cost

## GRU Architecture

```python
import torch.nn as nn

class TemporalGRUEncoder(nn.Module):
    """
    Encodes a sequence of graph embeddings into temporal context.
    """
    def __init__(self, input_dim, hidden_dim, num_layers=2):
        super().__init__()
        
        self.gru = nn.GRU(
            input_size=input_dim,      # Graph embedding dimension
            hidden_size=hidden_dim,     # GRU hidden state dimension
            num_layers=num_layers,      # Number of stacked GRU layers
            batch_first=True,           # Input shape: (batch, seq, features)
            dropout=0.3                 # Dropout between layers
        )
    
    def forward(self, graph_sequence):
        """
        Args:
            graph_sequence: [batch, T, graph_embedding_dim]
                           T = number of time steps
        
        Returns:
            context: [batch, hidden_dim] - final hidden state
            all_hidden: [batch, T, hidden_dim] - all time steps
        """
        # GRU forward pass
        all_hidden, final_hidden = self.gru(graph_sequence)
        
        # final_hidden shape: [num_layers, batch, hidden_dim]
        # We take the last layer's hidden state
        context = final_hidden[-1]  # [batch, hidden_dim]
        
        return context, all_hidden
```

## How GRU Works (Step-by-Step)

### GRU Cell Internal Operations

```python
# At each time step t, GRU updates hidden state:

# Input at time t:
h_t_prev = previous hidden state
x_t = current input (graph embedding at time t)

# Update gate: controls how much to update
z_t = sigmoid(W_z · [h_t_prev, x_t] + b_z)

# Reset gate: controls how much past to forget
r_t = sigmoid(W_r · [h_t_prev, x_t] + b_r)

# Candidate hidden state: new information
h_tilde_t = tanh(W_h · [r_t ⊙ h_t_prev, x_t] + b_h)

# Final hidden state: mix old and new
h_t = (1 - z_t) ⊙ h_t_prev + z_t ⊙ h_tilde_t
```

**Intuition:**
- **Update gate (z_t)**: "How much should I update my memory?"
  - z_t ≈ 1: Use new information (forget old)
  - z_t ≈ 0: Keep old information (ignore new)

- **Reset gate (r_t)**: "How much should I forget the past?"
  - r_t ≈ 1: Keep all past information
  - r_t ≈ 0: Ignore past information

### Temporal Sequence Processing

**Example: 10 Time Windows**
```
T=1  T=2  T=3  T=4  T=5  T=6  T=7  T=8  T=9  T=10
 ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓    ↓
[H₁] [H₂] [H₃] [H₄] [H₅] [H₆] [H₇] [H₈] [H₉] [H₁₀]
Graph embeddings (each 128-dim)

        ↓ Feed into GRU ↓

GRU processes sequentially:

t=1: h₁ = GRU(H₁, h₀)  (h₀ = zeros)
t=2: h₂ = GRU(H₂, h₁)
t=3: h₃ = GRU(H₃, h₂)
...
t=10: h₁₀ = GRU(H₁₀, h₉)

Final context: c = h₁₀  (captures all temporal information)
```

**What Gets Learned:**
- Early windows (T=1-3): Initial reconnaissance patterns
- Middle windows (T=4-7): Escalation and lateral movement
- Recent windows (T=8-10): Current attack state

**Memory Mechanism:**
```
If attack starts at T=3:
  - h₃ stores "initial compromise detected"
  - h₄ updates with "lateral movement begins"
  - h₅ updates with "privilege escalation"
  - ...
  - h₁₀ contains full attack progression history
```

## Complete Temporal Module

```python
class TemporalContextEncoder(nn.Module):
    """
    Complete temporal encoding module.
    Processes sequence of graphs → temporal context vector.
    """
    def __init__(self, graph_embedding_dim, temporal_hidden_dim):
        super().__init__()
        
        # GRU for temporal modeling
        self.gru = TemporalGRUEncoder(
            input_dim=graph_embedding_dim,
            hidden_dim=temporal_hidden_dim,
            num_layers=2
        )
        
        # Attention layer (optional, for weighted temporal aggregation)
        self.attention = nn.MultiheadAttention(
            embed_dim=temporal_hidden_dim,
            num_heads=4
        )
    
    def forward(self, graph_embeddings):
        """
        Args:
            graph_embeddings: [batch, T, graph_dim]
        
        Returns:
            context: [batch, temporal_hidden_dim]
        """
        # GRU encoding
        context, all_hidden = self.gru(graph_embeddings)
        
        # Optional: Apply attention to focus on important time steps
        # attn_output, attn_weights = self.attention(
        #     all_hidden, all_hidden, all_hidden
        # )
        # context = attn_output[:, -1, :]  # Take last time step after attention
        
        return context
```

---

# 6️⃣ Module 6: Attack Prediction & Forecasting

## Purpose
Predict future attack risk for multiple horizons (H1, H2, H3, ...)

## Architecture

```python
class MultiHorizonForecastHead(nn.Module):
    """
    Forecasts attack risk for multiple future time windows.
    """
    def __init__(self, context_dim, num_horizons=3, num_attack_types=10):
        super().__init__()
        
        # Shared feature extraction
        self.shared = nn.Sequential(
            nn.Linear(context_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3)
        )
        
        # Per-horizon risk prediction heads
        self.risk_heads = nn.ModuleList([
            nn.Linear(128, 1) for _ in range(num_horizons)
        ])
        
        # Per-horizon attack type classification heads
        self.attack_heads = nn.ModuleList([
            nn.Linear(128, num_attack_types) for _ in range(num_horizons)
        ])
    
    def forward(self, context):
        """
        Args:
            context: [batch, context_dim] - from GRU
        
        Returns:
            risk_scores: [batch, num_horizons] - risk per horizon
            attack_logits: [batch, num_horizons, num_attack_types]
        """
        # Shared representation
        features = self.shared(context)  # [batch, 128]
        
        # Predict for each horizon
        risk_scores = []
        attack_logits = []
        
        for h in range(len(self.risk_heads)):
            # Risk score (0-1, continuous)
            risk = torch.sigmoid(self.risk_heads[h](features))
            risk_scores.append(risk)
            
            # Attack type (categorical, logits)
            attack = self.attack_heads[h](features)
            attack_logits.append(attack)
        
        risk_scores = torch.cat(risk_scores, dim=1)  # [batch, num_horizons]
        attack_logits = torch.stack(attack_logits, dim=1)  # [batch, num_horizons, num_types]
        
        return risk_scores, attack_logits
```

## Training Objective

```python
def compute_forecast_loss(predictions, targets, horizons):
    """
    Multi-task loss: risk regression + attack classification
    """
    risk_pred, attack_pred = predictions
    risk_target, attack_target = targets
    
    # Loss 1: Risk prediction (MSE)
    risk_loss = F.mse_loss(risk_pred, risk_target)
    
    # Loss 2: Attack type classification (Cross-Entropy)
    attack_loss = F.cross_entropy(
        attack_pred.reshape(-1, num_attack_types),
        attack_target.reshape(-1)
    )
    
    # Loss 3: Horizon decay weighting (H1 more important than H3)
    horizon_weights = torch.tensor([1.0, 0.8, 0.6])  # H1, H2, H3
    weighted_risk_loss = (risk_loss * horizon_weights).mean()
    
    # Combined loss
    total_loss = weighted_risk_loss + 0.5 * attack_loss
    
    return total_loss
```

## Inference Example

```
Input: Temporal context c ∈ R^256 (from GRU)
       ↓
Forecast Head:
       ↓
Output:
  H1 (next 5 min):    risk = 0.72 (HIGH),     attack_type = "DDoS"      (73% conf)
  H2 (next 10 min):   risk = 0.81 (HIGH),     attack_type = "DDoS"      (68% conf)
  H3 (next 15 min):   risk = 0.89 (CRITICAL), attack_type = "DDoS"      (61% conf)
```

---

# 7️⃣ Module 7: Attack Path Detection

## Purpose
Identify the most likely attack progression path through the network.

## Method: Node Attention + Beam Search

```python
class AttackPathDetector(nn.Module):
    """
    Detects most likely attack path using node attention scores.
    """
    def __init__(self, node_embedding_dim):
        super().__init__()
        
        # Node scoring network
        self.node_scorer = nn.Sequential(
            nn.Linear(node_embedding_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
    
    def forward(self, node_embeddings, edge_index, start_node_idx):
        """
        Args:
            node_embeddings: [N, embedding_dim] - from GNN
            edge_index: [2, E] - graph edges
            start_node_idx: int - entry point node
        
        Returns:
            path: List[int] - sequence of node indices
            probabilities: List[float] - probability per node
        """
        # Step 1: Score all nodes (attack likelihood)
        node_scores = self.node_scorer(node_embeddings).squeeze()  # [N]
        
        # Step 2: Build adjacency list
        adj = self.build_adjacency(edge_index)
        
        # Step 3: Beam search for most likely path
        path, probs = self.beam_search(
            start_node=start_node_idx,
            node_scores=node_scores,
            adjacency=adj,
            beam_width=5,
            max_length=10
        )
        
        return path, probs
    
    def beam_search(self, start_node, node_scores, adjacency, beam_width, max_length):
        """
        Beam search to find high-probability paths.
        """
        # Initialize beam with start node
        beam = [([start_node], node_scores[start_node].item())]
        
        for step in range(max_length):
            candidates = []
            
            for path, score in beam:
                current_node = path[-1]
                neighbors = adjacency[current_node]
                
                for next_node in neighbors:
                    if next_node not in path:  # Avoid cycles
                        new_path = path + [next_node]
                        new_score = score * node_scores[next_node].item()
                        candidates.append((new_path, new_score))
            
            # Keep top K candidates
            beam = sorted(candidates, key=lambda x: -x[1])[:beam_width]
            
            # Early stopping if target reached
            if self.is_target_reached(beam):
                break
        
        # Return best path
        best_path, best_score = beam[0]
        path_probs = [node_scores[idx].item() for idx in best_path]
        
        return best_path, path_probs
```

## Example Output

```
Attack Path Detected:

Node 0 (192.168.1.42) → Entry Point
  Type: Workstation
  Probability: 0.95
  Reason: External connection with suspicious traffic pattern
  
Node 1 (192.168.1.100) → Pivot
  Type: Server
  Probability: 0.78
  Reason: Lateral movement detected, privilege escalation attempt
  
Node 2 (10.0.0.5) → Pivot
  Type: File Server
  Probability: 0.68
  Reason: Unusual data access pattern, credential theft indicators
  
Node 3 (10.0.0.12) → Target
  Type: Database Server
  Probability: 0.82
  Reason: High-value target, data exfiltration detected
```

---

# 8️⃣ Complete Temporal GNN System

## Full Pipeline Integration

```python
class TemporalGNNSystem(nn.Module):
    """
    Complete end-to-end Temporal GNN for attack forecasting.
    """
    def __init__(self, config):
        super().__init__()
        
        # Module 1: Graph Encoder (GNN)
        self.graph_encoder = GNNGraphEncoder(
            node_features=config['node_features'],
            hidden_dim=config['gnn_hidden'],
            output_dim=config['graph_embedding_dim']
        )
        
        # Module 2: Temporal Encoder (GRU)
        self.temporal_encoder = TemporalGRUEncoder(
            input_dim=config['graph_embedding_dim'],
            hidden_dim=config['temporal_hidden'],
            num_layers=2
        )
        
        # Module 3: Forecast Head
        self.forecast_head = MultiHorizonForecastHead(
            context_dim=config['temporal_hidden'],
            num_horizons=3,
            num_attack_types=10
        )
        
        # Module 4: Attack Path Detector
        self.path_detector = AttackPathDetector(
            node_embedding_dim=config['gnn_hidden']
        )
    
    def forward(self, graph_sequence):
        """
        Args:
            graph_sequence: List of PyG Data objects [G_1, ..., G_T]
        
        Returns:
            forecast: Dict with risk scores, attack types, attack path
        """
        # Step 1: Encode each graph
        graph_embeddings = []
        node_embeddings_last = None
        
        for graph in graph_sequence:
            # GNN encoding
            h_graph = self.graph_encoder(graph)
            graph_embeddings.append(h_graph)
            
            # Save node embeddings from last graph (for path detection)
            if graph == graph_sequence[-1]:
                node_embeddings_last = self.graph_encoder.gnn(
                    graph.x, graph.edge_index
                )
        
        # Stack into sequence tensor
        graph_seq_tensor = torch.stack(graph_embeddings, dim=1)  # [batch, T, dim]
        
        # Step 2: Temporal encoding
        context, _ = self.temporal_encoder(graph_seq_tensor)
        
        # Step 3: Multi-horizon forecasting
        risk_scores, attack_logits = self.forecast_head(context)
        
        # Step 4: Attack path detection
        attack_path, path_probs = self.path_detector(
            node_embeddings=node_embeddings_last,
            edge_index=graph_sequence[-1].edge_index,
            start_node_idx=self.find_entry_node(node_embeddings_last)
        )
        
        return {
            'risk_scores': risk_scores,       # [batch, num_horizons]
            'attack_types': attack_logits,    # [batch, num_horizons, num_types]
            'attack_path': attack_path,       # List[int]
            'path_probabilities': path_probs  # List[float]
        }
```

---

# 9️⃣ Complete Data Flow

## From Dataset to Prediction

```
┌────────────────────────────────────────────────────────────┐
│ INPUT: CIC-IDS2017 CSV (2.8M rows)                         │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ MODULE 1: Dataset Processing                               │
│ • Load CSV → DataFrame (2.8M × 80)                         │
│ • Normalize features → X (2.8M × 79)                       │
│ • Encode labels → y (2.8M,)                                │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ MODULE 2: Graph Construction                               │
│ • Time windows (5 min each) → 576 windows                  │
│ • Per window: Extract nodes + edges                        │
│ • Window 1: G_1 (1200 nodes, 5800 edges)                   │
│ • Window 2: G_2 (1350 nodes, 6200 edges)                   │
│ • ...                                                       │
│ • Window 576: G_576 (980 nodes, 4500 edges)                │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ MODULE 3: Temporal Windows                                 │
│ • Sliding window: history = 10, horizon = 3                │
│ • Sample 1: [G_1...G_10] → [y_11, y_12, y_13]              │
│ • Sample 2: [G_2...G_11] → [y_12, y_13, y_14]              │
│ • ...                                                       │
│ • Total samples: 576 - 10 - 3 = 563 training samples       │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ MODULE 4: GNN Encoder (per graph)                          │
│ Input: G_t (1200 nodes, 5800 edges)                        │
│   Node features: [1200, 13]                                │
│   Edge features: [5800, 14]                                │
│        ↓                                                    │
│ GraphSAGE Layer 1: [1200, 64]                              │
│ GraphSAGE Layer 2: [1200, 64]                              │
│ GraphSAGE Layer 3: [1200, 64]                              │
│        ↓                                                    │
│ Global Mean Pool: [1, 64]                                  │
│ Linear Projection: [1, 128]                                │
│        ↓                                                    │
│ Output: H_t ∈ R^128 (graph embedding)                      │
│                                                             │
│ Repeat for all T=10 graphs:                                │
│   [H_1, H_2, H_3, ..., H_10] each ∈ R^128                  │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ MODULE 5: GRU Temporal Encoder                             │
│ Input: [H_1, H_2, ..., H_10] → [10, 128]                   │
│        ↓                                                    │
│ GRU Layer 1 (hidden=256):                                  │
│   t=1:  h_1 = GRU(H_1, h_0)                                │
│   t=2:  h_2 = GRU(H_2, h_1)                                │
│   ...                                                       │
│   t=10: h_10 = GRU(H_10, h_9)                              │
│        ↓                                                    │
│ GRU Layer 2 (hidden=256):                                  │
│   Repeat with Layer 1 output                               │
│        ↓                                                    │
│ Output: c = h_10^(layer2) ∈ R^256 (temporal context)       │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ MODULE 6: Forecast Head                                    │
│ Input: c ∈ R^256                                            │
│        ↓                                                    │
│ Shared MLP: [256 → 128]                                    │
│        ↓                                                    │
│ H1 Head:                                                    │
│   Risk: 0.72 (HIGH)                                        │
│   Attack: DDoS (0.85 confidence)                           │
│                                                             │
│ H2 Head:                                                    │
│   Risk: 0.81 (HIGH)                                        │
│   Attack: DDoS (0.78 confidence)                           │
│                                                             │
│ H3 Head:                                                    │
│   Risk: 0.89 (CRITICAL)                                    │
│   Attack: DDoS (0.71 confidence)                           │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ MODULE 7: Attack Path Detection                            │
│ Input: Node embeddings from G_10 [1200, 64]                │
│        ↓                                                    │
│ Node scoring: [1200, 1] (attack probability per node)      │
│        ↓                                                    │
│ Beam search (entry → target):                              │
│   Path: [42, 105, 89, 234]                                 │
│   Nodes:                                                    │
│     42:  workstation-42  (0.95) [Entry]                    │
│     105: server-web-01   (0.78) [Pivot]                    │
│     89:  server-file-03  (0.68) [Pivot]                    │
│     234: server-db-01    (0.82) [Target]                   │
└────────────────────┬───────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│ FINAL OUTPUT: ForecastResult JSON                          │
│ {                                                           │
│   "current_risk": 0.68,                                    │
│   "current_risk_level": "HIGH",                            │
│   "forecast": [                                             │
│     {"horizon": 1, "risk": 0.72, "label": "H1"},           │
│     {"horizon": 2, "risk": 0.81, "label": "H2"},           │
│     {"horizon": 3, "risk": 0.89, "label": "H3"}            │
│   ],                                                        │
│   "predicted_stage": "Lateral Movement",                   │
│   "target": "server-db-01",                                │
│   "attack_path": {                                         │
│     "nodes": [                                             │
│       {"label": "workstation-42", "probability": 0.95},    │
│       {"label": "server-web-01", "probability": 0.78},     │
│       {"label": "server-file-03", "probability": 0.68},    │
│       {"label": "server-db-01", "probability": 0.82}       │
│     ],                                                      │
│     "probability": 0.82                                    │
│   }                                                         │
│ }                                                           │
└────────────────────────────────────────────────────────────┘
```

---

# 🎯 Summary

## What Each Module Does

| Module | Input | Output | Purpose |
|--------|-------|--------|---------|
| **1. Dataset Processing** | Raw CSV | Normalized features | Clean data for ML |
| **2. Graph Construction** | Flow records | Graph snapshots | Network topology |
| **3. Temporal Windows** | Graph sequence | Training samples | Time series preparation |
| **4. GNN Encoder** | Single graph | Graph embedding | Spatial patterns |
| **5. GRU Temporal** | Graph embeddings | Temporal context | Temporal patterns |
| **6. Forecast Head** | Temporal context | Risk scores | Future prediction |
| **7. Attack Path** | Node embeddings | Attack path | Threat tracing |

## Key Differences from Current System

| Aspect | Current (Label Counter) | Designed (Temporal GNN) |
|--------|------------------------|------------------------|
| **Input** | CSV with labels | CSV (with or without labels) |
| **Processing** | Read labels, count | Graph construction → GNN → GRU |
| **Output** | Attack statistics | Multi-horizon forecasts + paths |
| **Prediction** | None (just counting) | Real ML-based prediction |
| **Temporal** | No temporal modeling | GRU captures time evolution |
| **Graph** | No graph structure | Full graph neural network |
| **Training** | Not needed | Requires training on datasets |

## Current Status

✅ **Implemented:**
- Dataset loading and preprocessing
- Label-based analysis (quick_analyzer.py)
- Frontend visualization

❌ **NOT Implemented (Needs Training):**
- Graph construction from flows
- GNN model training
- GRU temporal model training
- Multi-horizon forecasting
- Attack path detection with ML

## To Make It Work

You need to:
1. Implement graph construction pipeline
2. Train the Temporal GNN model on CIC-IDS2017
3. Save trained model checkpoint
4. Load checkpoint in temporal_gnn.py
5. Replace MockPredictor with TemporalGNNPredictor

---

**This is the complete architecture design. Currently, you're using MockPredictor (heuristics). To get real ML predictions, you need to implement the training pipeline and train the Temporal GNN model.**
