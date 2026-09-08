# Dataset Analysis Report

Generated: 2026-09-08

## 📊 Overview

Two major intrusion detection datasets have been added to the project:
- **CIC-IDS2017**: 8 CSV files with modern network attacks
- **UNSW-NB15**: Training and testing sets with diverse attack categories

---

## 1. CIC-IDS2017 Dataset

### Files
- Monday-WorkingHours.pcap_ISCX.csv
- Tuesday-WorkingHours.pcap_ISCX.csv
- Wednesday-workingHours.pcap_ISCX.csv
- Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv
- Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv
- Friday-WorkingHours-Morning.pcap_ISCX.csv
- Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv
- Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv

### Structure
- **Total Columns**: 79
- **Feature Types**:
  - Integer features: 54 columns
  - Float features: 24 columns
  - String features: 1 column (Label)

### Key Features
**Flow-based features** extracted from network traffic:
- Packet statistics (forward/backward packets, lengths, rates)
- Inter-arrival times (IAT) - mean, std, max, min
- TCP flags (FIN, SYN, RST, PSH, ACK, URG, CWE, ECE)
- Window sizes (forward/backward)
- Active/Idle times
- Subflow statistics

### Label Column
- **Column Name**: ` Label` (note: leading space!)
- **Type**: Multi-class classification
- **Classes** (expected):
  - BENIGN (normal traffic)
  - DDoS
  - PortScan
  - Bot
  - Infiltration
  - Web Attack - Brute Force
  - Web Attack - XSS
  - Web Attack - SQL Injection
  - FTP-Patator
  - SSH-Patator
  - DoS Hulk
  - DoS GoldenEye
  - DoS Slowloris
  - DoS Slowhttptest
  - Heartbleed

### Data Quality Issues
1. **Duplicate Rows**: 23 duplicates found in 100-row sample (23% duplication rate)
2. **Missing Values**: None detected in sample
3. **Column Naming**: Leading/trailing spaces in column names
4. **Infinite Values**: Likely present in flow rate calculations (division by zero)
5. **Class Imbalance**: Benign traffic likely dominates the dataset

---

## 2. UNSW-NB15 Dataset

### Files
- UNSW_NB15_training-set.csv
- UNSW_NB15_testing-set.csv
- UNSW-NB15_1.csv through UNSW-NB15_4.csv (raw files)
- NUSW-NB15_features.csv (feature descriptions)
- UNSW-NB15_LIST_EVENTS.csv (event types)

### Structure
- **Total Columns**: 45
- **Feature Types**:
  - Integer features: 30 columns
  - Float features: 11 columns
  - String features: 4 columns

### Key Features
**Flow and packet-level features**:
- Basic flow features: duration, protocol, service, state
- Packet counts and bytes (source/destination)
- TCP connection features: RTT, SYN-ACK, ACK-DAT
- Content features: transaction depth, HTTP methods, FTP commands
- Time-based features: jitter, loss, mean packet times
- Connection features: state distributions, source/destination patterns

### Label Columns
- **Binary Label**: `label`
  - 0 = Normal traffic
  - 1 = Attack traffic

- **Attack Category**: `attack_cat`
  - Normal
  - Fuzzers
  - Analysis
  - Backdoors
  - DoS
  - Exploits
  - Generic
  - Reconnaissance
  - Shellcode
  - Worms

### Data Quality Issues
1. **BOM Character**: First column has UTF-8 BOM (`ï»¿id`)
2. **Missing Values**: Minimal in sample, but may exist in full dataset
3. **Duplicate Rows**: None in sample
4. **Class Imbalance**: Attack distribution varies across categories

---

## 📋 Preprocessing Requirements

### Issues to Address

#### Both Datasets:
1. **Column Name Standardization**
   - Remove leading/trailing whitespace
   - Remove BOM characters
   - Convert to lowercase with underscores

2. **Infinite/NaN Values**
   - Replace inf/-inf with large finite values or NaN
   - Impute or drop rows with excessive NaN values

3. **Duplicate Rows**
   - Identify and remove exact duplicates
   - Consider feature-based deduplication

4. **Data Type Optimization**
   - Downcast integers (int64 → int32/int16)
   - Downcast floats (float64 → float32)
   - Categorical encoding for strings

5. **Feature Engineering**
   - Normalize/standardize numerical features
   - Encode categorical features (protocol, service, state)
   - Handle class imbalance (SMOTE, undersampling, class weights)

6. **Missing IP/Port Information**
   - CIC-IDS2017: Missing source IP, destination IP columns
   - Need to extract from flow metadata if available

---

## 🔧 Proposed Preprocessing Pipeline

### Stage 1: Data Loading & Cleaning
```python
1. Load CSV files with proper encoding (latin1)
2. Strip whitespace from column names
3. Remove BOM characters
4. Convert column names to snake_case
5. Remove exact duplicate rows
```

### Stage 2: Data Quality Fixes
```python
6. Replace inf/-inf with np.nan
7. Handle missing values:
   - Drop rows with >50% missing values
   - Impute numerical: median/mean
   - Impute categorical: mode
8. Fix data types (downcast to save memory)
```

### Stage 3: Feature Engineering
```python
9. Encode categorical features (one-hot or label encoding)
10. Normalize numerical features (StandardScaler or MinMaxScaler)
11. Create additional temporal features if timestamps available
```

### Stage 4: Label Processing
```python
12. CIC-IDS2017: Map multi-class labels to binary (benign vs attack)
13. UNSW-NB15: Use existing binary labels
14. Create stratified train/val/test splits
15. Handle class imbalance (optional: SMOTE, class weights)
```

### Stage 5: Export
```python
16. Save preprocessed data:
    - CSV format (for inspection)
    - Parquet format (for ML pipeline, compressed)
    - Pickle format (for Python objects)
17. Save label encoders and scalers for inference
```

---

## 📊 Expected Outputs

### Preprocessed Files
```
datasets/preprocessed/
├── cic-ids2017/
│   ├── train.parquet
│   ├── val.parquet
│   ├── test.parquet
│   ├── label_encoder.pkl
│   └── scaler.pkl
├── unsw-nb15/
│   ├── train.parquet
│   ├── val.parquet
│   ├── test.parquet
│   ├── label_encoder.pkl
│   └── scaler.pkl
└── metadata.json
```

### Metadata JSON
```json
{
  "cic_ids2017": {
    "total_records": "~2.8M",
    "num_features": 78,
    "num_classes": 15,
    "class_distribution": {...},
    "preprocessing_steps": [...]
  },
  "unsw_nb15": {
    "total_records": "~257K",
    "num_features": 44,
    "num_classes": 2,
    "attack_categories": 9,
    "preprocessing_steps": [...]
  }
}
```

---

## ⚠️ Important Notes

1. **Do NOT modify original dataset files** - All preprocessing will work on copies
2. **Memory considerations** - Processing 2.8M+ rows may require chunked processing
3. **Class imbalance** - Both datasets are heavily imbalanced toward normal traffic
4. **Missing network identifiers** - CIC-IDS2017 lacks src_ip/dst_ip for graph construction
5. **Encoding compatibility** - Use `encoding='latin1'` for reading CSVs

---

## ✅ Next Steps

**AWAITING YOUR APPROVAL**

Before implementing the preprocessing pipeline, please review and confirm:

1. ✅ Do you approve the proposed preprocessing steps above?
2. ✅ Should we create binary classification (benign vs attack) or keep multi-class?
3. ✅ Do you want SMOTE/oversampling to handle class imbalance?
4. ✅ Output format preference: Parquet, CSV, or both?
5. ✅ Should we extract/synthesize IP addresses for graph construction?

Once approved, I will:
1. Create the complete preprocessing pipeline script
2. Process both datasets
3. Generate preprocessed files ready for ML training
4. Commit changes to GitHub

**Please respond with your approval or any modifications you'd like to the plan.**
