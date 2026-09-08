"""
Complete Preprocessing Pipeline for CIC-IDS2017 and UNSW-NB15 Datasets
Handles data cleaning, feature engineering, and preparation for ML training
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import json
import pickle
import warnings
warnings.filterwarnings('ignore')

# Paths
BASE_DIR = Path(__file__).parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
OUTPUT_DIR = BASE_DIR / "datasets" / "preprocessed"
OUTPUT_DIR.mkdir(exist_ok=True)

# CIC-IDS2017 files
CIC_FILES = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
]

# UNSW-NB15 files
UNSW_FILES = [
    "UNSW_NB15_training-set.csv",
    "UNSW_NB15_testing-set.csv",
]

print("="*80)
print("DATASET PREPROCESSING PIPELINE")
print("="*80)

# ============================================================================
# STAGE 1: CIC-IDS2017 PREPROCESSING
# ============================================================================

def clean_column_names(df):
    """Remove leading/trailing whitespace from column names"""
    df.columns = df.columns.str.strip()
    return df

def replace_infinities(df):
    """Replace inf and -inf with NaN"""
    return df.replace([np.inf, -np.inf], np.nan)

def handle_missing_values(df, threshold=0.5):
    """Handle missing values - drop columns with >50% missing, impute rest"""
    # Drop columns with too many missing values
    missing_pct = df.isnull().sum() / len(df)
    cols_to_drop = missing_pct[missing_pct > threshold].index.tolist()
    if cols_to_drop:
        print(f"  Dropping {len(cols_to_drop)} columns with >{threshold*100}% missing values")
        df = df.drop(columns=cols_to_drop)
    
    # Impute remaining missing values
    for col in df.columns:
        if df[col].dtype in ['float64', 'int64']:
            df[col].fillna(df[col].median(), inplace=True)
        else:
            df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown', inplace=True)
    
    return df

def preprocess_cic_ids2017():
    """Preprocess CIC-IDS2017 dataset"""
    print("\n" + "="*80)
    print("PREPROCESSING CIC-IDS2017")
    print("="*80)
    
    all_data = []
    total_rows = 0
    
    # Read all files
    print("\nReading files...")
    for idx, filename in enumerate(CIC_FILES, 1):
        filepath = DATASETS_DIR / filename
        print(f"  [{idx}/{len(CIC_FILES)}] {filename}...", end=" ")
        
        try:
            df = pd.read_csv(filepath, encoding='latin1', low_memory=False)
            rows = len(df)
            total_rows += rows
            all_data.append(df)
            print(f"{rows:,} rows")
        except Exception as e:
            print(f"ERROR: {e}")
    
    # Combine all files
    print(f"\nCombining {len(all_data)} files...")
    df_combined = pd.concat(all_data, ignore_index=True)
    print(f"Total rows: {len(df_combined):,}")
    
    # Stage 1: Clean column names
    print("\nStage 1: Cleaning column names...")
    df_combined = clean_column_names(df_combined)
    
    # Stage 2: Handle infinities
    print("Stage 2: Replacing infinite values...")
    df_combined = replace_infinities(df_combined)
    
    # Stage 3: Remove duplicates
    print("Stage 3: Removing duplicates...")
    before_dup = len(df_combined)
    df_combined = df_combined.drop_duplicates()
    after_dup = len(df_combined)
    print(f"  Removed {before_dup - after_dup:,} duplicate rows ({(before_dup-after_dup)/before_dup*100:.2f}%)")
    
    # Stage 4: Handle missing values
    print("Stage 4: Handling missing values...")
    df_combined = handle_missing_values(df_combined)
    
    # Stage 5: Extract label
    print("Stage 5: Processing labels...")
    label_col = 'Label'
    if label_col not in df_combined.columns:
        print(f"  ERROR: Label column not found!")
        return None
    
    # Create binary labels (BENIGN = 0, ATTACK = 1)
    df_combined['label_binary'] = (df_combined[label_col] != 'BENIGN').astype(int)
    
    # Keep original multi-class label
    df_combined['label_multiclass'] = df_combined[label_col]
    
    # Show class distribution
    print(f"\nClass Distribution:")
    class_dist = df_combined[label_col].value_counts()
    for cls, count in class_dist.items():
        pct = count / len(df_combined) * 100
        print(f"  {cls}: {count:,} ({pct:.2f}%)")
    
    # Separate features and labels
    feature_cols = [c for c in df_combined.columns if c not in [label_col, 'label_binary', 'label_multiclass']]
    X = df_combined[feature_cols]
    y_binary = df_combined['label_binary']
    y_multi = df_combined['label_multiclass']
    
    # Convert all numeric
    print("\nStage 6: Converting features to numeric...")
    for col in X.columns:
        X[col] = pd.to_numeric(X[col], errors='coerce')
    
    # Drop any remaining NaN rows
    X = X.fillna(0)
    
    # Stage 7: Split data
    print("Stage 7: Splitting into train/val/test...")
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y_binary, test_size=0.3, random_state=42, stratify=y_binary
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )
    
    print(f"  Train: {len(X_train):,} samples")
    print(f"  Val:   {len(X_val):,} samples")
    print(f"  Test:  {len(X_test):,} samples")
    
    # Stage 8: Normalize features
    print("Stage 8: Normalizing features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    # Convert back to DataFrames
    X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
    X_val_scaled = pd.DataFrame(X_val_scaled, columns=X_val.columns)
    X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns)
    
    # Add labels back
    X_train_scaled['label'] = y_train.values
    X_val_scaled['label'] = y_val.values
    X_test_scaled['label'] = y_test.values
    
    # Stage 9: Save processed data
    print("\nStage 9: Saving processed data...")
    output_dir = OUTPUT_DIR / "cic-ids2017"
    output_dir.mkdir(exist_ok=True)
    
    X_train_scaled.to_parquet(output_dir / "train.parquet", index=False)
    X_val_scaled.to_parquet(output_dir / "val.parquet", index=False)
    X_test_scaled.to_parquet(output_dir / "test.parquet", index=False)
    
    # Save scaler
    with open(output_dir / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    
    # Save metadata
    metadata = {
        "dataset": "CIC-IDS2017",
        "total_records": len(df_combined),
        "num_features": len(feature_cols),
        "feature_names": feature_cols,
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "class_distribution": class_dist.to_dict(),
        "attack_percentage": (y_binary.sum() / len(y_binary) * 100),
    }
    
    with open(output_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"  Saved to: {output_dir}")
    print(f"  Files: train.parquet, val.parquet, test.parquet, scaler.pkl, metadata.json")
    
    return metadata

# ============================================================================
# STAGE 2: UNSW-NB15 PREPROCESSING
# ============================================================================

def preprocess_unsw_nb15():
    """Preprocess UNSW-NB15 dataset"""
    print("\n" + "="*80)
    print("PREPROCESSING UNSW-NB15")
    print("="*80)
    
    # Read training and testing sets
    print("\nReading files...")
    train_file = DATASETS_DIR / UNSW_FILES[0]
    test_file = DATASETS_DIR / UNSW_FILES[1]
    
    df_train = pd.read_csv(train_file, encoding='latin1', low_memory=False)
    df_test = pd.read_csv(test_file, encoding='latin1', low_memory=False)
    
    print(f"  Training set: {len(df_train):,} rows")
    print(f"  Testing set:  {len(df_test):,} rows")
    
    # Combine for processing
    df_combined = pd.concat([df_train, df_test], ignore_index=True)
    print(f"  Combined:     {len(df_combined):,} rows")
    
    # Stage 1: Clean column names (remove BOM)
    print("\nStage 1: Cleaning column names...")
    df_combined.columns = df_combined.columns.str.replace('ï»¿', '').str.strip()
    
    # Stage 2: Handle infinities
    print("Stage 2: Replacing infinite values...")
    df_combined = replace_infinities(df_combined)
    
    # Stage 3: Remove duplicates
    print("Stage 3: Removing duplicates...")
    before_dup = len(df_combined)
    df_combined = df_combined.drop_duplicates()
    after_dup = len(df_combined)
    print(f"  Removed {before_dup - after_dup:,} duplicate rows")
    
    # Stage 4: Handle missing values
    print("Stage 4: Handling missing values...")
    df_combined = handle_missing_values(df_combined)
    
    # Stage 5: Process labels
    print("Stage 5: Processing labels...")
    if 'label' not in df_combined.columns:
        print("  ERROR: 'label' column not found!")
        return None
    
    y_binary = df_combined['label']
    
    # Attack category
    if 'attack_cat' in df_combined.columns:
        y_attack_cat = df_combined['attack_cat']
        print(f"\nAttack Category Distribution:")
        attack_dist = y_attack_cat.value_counts()
        for attack, count in attack_dist.items():
            pct = count / len(df_combined) * 100
            print(f"  {attack}: {count:,} ({pct:.2f}%)")
    
    # Binary distribution
    print(f"\nBinary Label Distribution:")
    binary_dist = y_binary.value_counts()
    for label, count in binary_dist.items():
        label_name = "Normal" if label == 0 else "Attack"
        pct = count / len(df_combined) * 100
        print(f"  {label_name} ({label}): {count:,} ({pct:.2f}%)")
    
    # Separate features
    exclude_cols = ['id', 'label', 'attack_cat']
    feature_cols = [c for c in df_combined.columns if c not in exclude_cols]
    X = df_combined[feature_cols]
    
    # Encode categorical features
    print("\nStage 6: Encoding categorical features...")
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        print(f"  Encoded: {col}")
    
    # Convert all to numeric
    for col in X.columns:
        X[col] = pd.to_numeric(X[col], errors='coerce')
    X = X.fillna(0)
    
    # Stage 7: Use predefined train/test split
    print("Stage 7: Using predefined train/test split...")
    train_size = len(df_train)
    
    X_train = X.iloc[:train_size]
    X_test = X.iloc[train_size:]
    y_train = y_binary.iloc[:train_size]
    y_test = y_binary.iloc[train_size:]
    
    # Create validation set from training
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.2, random_state=42, stratify=y_train
    )
    
    print(f"  Train: {len(X_train):,} samples")
    print(f"  Val:   {len(X_val):,} samples")
    print(f"  Test:  {len(X_test):,} samples")
    
    # Stage 8: Normalize
    print("Stage 8: Normalizing features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)
    
    # Convert back to DataFrames
    X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
    X_val_scaled = pd.DataFrame(X_val_scaled, columns=X_val.columns)
    X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns)
    
    # Add labels
    X_train_scaled['label'] = y_train.values
    X_val_scaled['label'] = y_val.values
    X_test_scaled['label'] = y_test.values
    
    # Stage 9: Save
    print("\nStage 9: Saving processed data...")
    output_dir = OUTPUT_DIR / "unsw-nb15"
    output_dir.mkdir(exist_ok=True)
    
    X_train_scaled.to_parquet(output_dir / "train.parquet", index=False)
    X_val_scaled.to_parquet(output_dir / "val.parquet", index=False)
    X_test_scaled.to_parquet(output_dir / "test.parquet", index=False)
    
    # Save scaler
    with open(output_dir / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    
    # Save metadata
    metadata = {
        "dataset": "UNSW-NB15",
        "total_records": len(df_combined),
        "num_features": len(feature_cols),
        "feature_names": feature_cols,
        "train_samples": len(X_train),
        "val_samples": len(X_val),
        "test_samples": len(X_test),
        "binary_distribution": binary_dist.to_dict(),
        "attack_percentage": (y_binary.sum() / len(y_binary) * 100),
    }
    
    if 'attack_cat' in df_combined.columns:
        metadata['attack_distribution'] = attack_dist.to_dict()
    
    with open(output_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"  Saved to: {output_dir}")
    print(f"  Files: train.parquet, val.parquet, test.parquet, scaler.pkl, metadata.json")
    
    return metadata

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\nStarting preprocessing pipeline...\n")
    
    # Install required packages
    try:
        import sklearn
        import pyarrow
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.check_call(['python', '-m', 'pip', 'install', 'scikit-learn', 'pyarrow', '--quiet'])
    
    # Process both datasets
    cic_metadata = preprocess_cic_ids2017()
    unsw_metadata = preprocess_unsw_nb15()
    
    print("\n" + "="*80)
    print("PREPROCESSING COMPLETE")
    print("="*80)
    print(f"\nProcessed datasets saved to: {OUTPUT_DIR}")
    print("\nNext steps:")
    print("1. Train ML model using preprocessed data")
    print("2. Integrate model with backend API")
    print("3. Update frontend to show real predictions")
    
    return {
        "cic_ids2017": cic_metadata,
        "unsw_nb15": unsw_metadata
    }

if __name__ == "__main__":
    main()
