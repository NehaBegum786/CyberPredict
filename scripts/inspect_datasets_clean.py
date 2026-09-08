"""
Dataset Inspection Script for CIC-IDS2017 and UNSW-NB15
Analyzes columns, data types, missing values, duplicates, and class distribution
"""

import pandas as pd
import os
import sys
from pathlib import Path

# Dataset paths
DATASETS_DIR = Path(__file__).parent.parent / "datasets"

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

def inspect_cic_ids2017():
    """Inspect CIC-IDS2017 dataset"""
    print("=" * 80)
    print("CIC-IDS2017 DATASET INSPECTION")
    print("=" * 80)
    
    total_rows = 0
    all_columns = None
    label_distribution = {}
    
    # Inspect first file in detail
    first_file = DATASETS_DIR / CIC_FILES[0]
    print(f"\n[Detailed inspection of: {CIC_FILES[0]}]\n")
    
    try:
        # Read first file with limited rows for inspection
        print(f"Reading file... (this may take a moment)")
        df_sample = pd.read_csv(first_file, nrows=500, encoding='latin1', low_memory=False)
        
        print(f"[OK] Shape (first 500 rows): {df_sample.shape}")
        print(f"[OK] Columns ({len(df_sample.columns)}):")
        for i, col in enumerate(df_sample.columns, 1):
            print(f"    {i:2d}. {col}")
        
        print(f"\n Data Types:")
        print(df_sample.dtypes.value_counts())
        
        print(f"\n Missing Values (first 500 rows):")
        missing = df_sample.isnull().sum()
        missing_pct = (missing / len(df_sample) * 100).round(2)
        missing_df = pd.DataFrame({'Missing': missing, 'Percentage': missing_pct})
        missing_df = missing_df[missing_df['Missing'] > 0].sort_values('Missing', ascending=False)
        if len(missing_df) > 0:
            print(missing_df.head(10))
        else:
            print("    No missing values detected")
        
        print(f"\n Duplicate Rows (first 500 rows): {df_sample.duplicated().sum()}")
        
        # Check for label column
        label_col = None
        possible_labels = ['Label', 'label', 'Attack', 'attack', 'class', 'Class']
        for col in possible_labels:
            if col in df_sample.columns:
                label_col = col
                break
        
        if label_col:
            print(f"\n Label Column Found: '{label_col}'")
            print(f" Class Distribution (first 500 rows):")
            class_dist = df_sample[label_col].value_counts()
            for cls, count in class_dist.items():
                print(f"    {cls}: {count} ({count/len(df_sample)*100:.2f}%)")
        else:
            print(f"\n  Label column not found. Available columns: {list(df_sample.columns)}")
        
        print(f"\n Sample Data (first 3 rows):")
        print(df_sample.head(3).to_string(max_colwidth=30))
        
        all_columns = df_sample.columns.tolist()
        
    except Exception as e:
        print(f" Error reading {first_file}: {e}")
        return
    
    # Get statistics for all files
    print(f"\n" + "=" * 80)
    print(" STATISTICS ACROSS ALL CIC-IDS2017 FILES")
    print("=" * 80)
    
    for file in CIC_FILES:
        filepath = DATASETS_DIR / file
        try:
            # Just count rows using chunked reading
            print(f"Counting rows in {file}...")
            chunk_size = 50000
            rows = sum(1 for _ in pd.read_csv(filepath, encoding='latin1', chunksize=chunk_size, low_memory=False))
            total_rows += rows * chunk_size  # approximate
            
            print(f" {file}: ~{rows * chunk_size:,} rows (estimated)")
        except Exception as e:
            print(f" {file}: Error - {e}")
    
    print(f"\n TOTAL RECORDS: {total_rows:,}")
    
    if label_distribution:
        print(f"\n OVERALL CLASS DISTRIBUTION:")
        sorted_labels = sorted(label_distribution.items(), key=lambda x: x[1], reverse=True)
        for cls, count in sorted_labels:
            pct = count / total_rows * 100
            print(f"    {cls}: {count:,} ({pct:.2f}%)")
    
    return {
        'dataset': 'CIC-IDS2017',
        'total_rows': total_rows,
        'num_files': len(CIC_FILES),
        'columns': all_columns,
        'label_column': label_col,
        'class_distribution': label_distribution
    }

def inspect_unsw_nb15():
    """Inspect UNSW-NB15 dataset"""
    print("\n\n" + "=" * 80)
    print(" UNSW-NB15 DATASET INSPECTION")
    print("=" * 80)
    
    # Inspect training set in detail
    train_file = DATASETS_DIR / UNSW_FILES[0]
    print(f"\n Detailed inspection of: {UNSW_FILES[0]}\n")
    
    try:
        print(f"Reading file... (this may take a moment)")
        df_train = pd.read_csv(train_file, nrows=500, encoding='latin1', low_memory=False)
        
        print(f" Shape (first 500 rows): {df_train.shape}")
        print(f" Columns ({len(df_train.columns)}):")
        for i, col in enumerate(df_train.columns, 1):
            print(f"    {i:2d}. {col}")
        
        print(f"\n Data Types:")
        print(df_train.dtypes.value_counts())
        
        print(f"\n Missing Values (first 500 rows):")
        missing = df_train.isnull().sum()
        missing_pct = (missing / len(df_train) * 100).round(2)
        missing_df = pd.DataFrame({'Missing': missing, 'Percentage': missing_pct})
        missing_df = missing_df[missing_df['Missing'] > 0].sort_values('Missing', ascending=False)
        if len(missing_df) > 0:
            print(missing_df.head(10))
        else:
            print("    No missing values detected")
        
        print(f"\n Duplicate Rows (first 500 rows): {df_train.duplicated().sum()}")
        
        # Check for label columns
        label_col = None
        attack_cat_col = None
        possible_labels = ['label', 'Label', 'class', 'Class']
        possible_attack_cats = ['attack_cat', 'Attack_cat', 'attack_category']
        
        for col in possible_labels:
            if col in df_train.columns:
                label_col = col
                break
        
        for col in possible_attack_cats:
            if col in df_train.columns:
                attack_cat_col = col
                break
        
        if label_col:
            print(f"\n Label Column Found: '{label_col}'")
            print(f" Binary Class Distribution (first 500 rows):")
            class_dist = df_train[label_col].value_counts()
            for cls, count in class_dist.items():
                label_name = "Normal" if cls == 0 else "Attack"
                print(f"    {label_name} ({cls}): {count} ({count/len(df_train)*100:.2f}%)")
        
        if attack_cat_col:
            print(f"\n Attack Category Column Found: '{attack_cat_col}'")
            print(f" Attack Types (first 500 rows):")
            attack_dist = df_train[attack_cat_col].value_counts()
            for attack, count in attack_dist.items():
                print(f"    {attack}: {count} ({count/len(df_train)*100:.2f}%)")
        
        if not label_col and not attack_cat_col:
            print(f"\n  Label columns not found. Available columns: {list(df_train.columns)}")
        
        print(f"\n Sample Data (first 3 rows):")
        print(df_train.head(3).to_string(max_colwidth=30))
        
    except Exception as e:
        print(f" Error reading {train_file}: {e}")
        return
    
    # Get statistics for all files
    print(f"\n" + "=" * 80)
    print(" STATISTICS ACROSS ALL UNSW-NB15 FILES")
    print("=" * 80)
    
    total_rows = 0
    label_distribution = {0: 0, 1: 0}
    attack_distribution = {}
    
    for file in UNSW_FILES:
        filepath = DATASETS_DIR / file
        try:
            print(f"Counting rows in {file}...")
            df = pd.read_csv(filepath, encoding='latin1', low_memory=False)
            rows = len(df)
            total_rows += rows
            
            if label_col and label_col in df.columns:
                for cls, count in df[label_col].value_counts().items():
                    label_distribution[cls] = label_distribution.get(cls, 0) + count
            
            if attack_cat_col and attack_cat_col in df.columns:
                for attack, count in df[attack_cat_col].value_counts().items():
                    attack_distribution[attack] = attack_distribution.get(attack, 0) + count
            
            print(f" {file}: {rows:,} rows")
        except Exception as e:
            print(f" {file}: Error - {e}")
    
    print(f"\n TOTAL RECORDS: {total_rows:,}")
    
    if label_distribution:
        print(f"\n OVERALL BINARY CLASS DISTRIBUTION:")
        for cls, count in sorted(label_distribution.items()):
            label_name = "Normal" if cls == 0 else "Attack"
            pct = count / total_rows * 100
            print(f"    {label_name} ({cls}): {count:,} ({pct:.2f}%)")
    
    if attack_distribution:
        print(f"\n OVERALL ATTACK TYPE DISTRIBUTION:")
        sorted_attacks = sorted(attack_distribution.items(), key=lambda x: x[1], reverse=True)
        for attack, count in sorted_attacks:
            pct = count / total_rows * 100
            print(f"    {attack}: {count:,} ({pct:.2f}%)")
    
    return {
        'dataset': 'UNSW-NB15',
        'total_rows': total_rows,
        'num_files': len(UNSW_FILES),
        'columns': df_train.columns.tolist(),
        'label_column': label_col,
        'attack_category_column': attack_cat_col,
        'binary_distribution': label_distribution,
        'attack_distribution': attack_distribution
    }

def main():
    print("\n" + "="*80)
    print("Starting Dataset Inspection...")
    print("="*80 + "\n")
    
    # Inspect both datasets
    cic_info = inspect_cic_ids2017()
    unsw_info = inspect_unsw_nb15()
    
    print("\n\n" + "=" * 80)
    print(" INSPECTION COMPLETE")
    print("=" * 80)
    print("\nNext steps:")
    print("1. Review the inspection results above")
    print("2. Identify preprocessing requirements (handling missing values, duplicates, encoding)")
    print("3. Approve the preprocessing pipeline before implementation")
    
if __name__ == "__main__":
    main()

