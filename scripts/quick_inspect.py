"""Quick dataset inspection - just read file headers and sample rows"""
import pandas as pd
from pathlib import Path

DATASETS_DIR = Path(__file__).parent.parent / "datasets"

print("\n" + "="*80)
print("DATASET QUICK INSPECTION")
print("="*80)

# CIC-IDS2017
print("\n### CIC-IDS2017 Dataset ###\n")
cic_file = DATASETS_DIR / "Monday-WorkingHours.pcap_ISCX.csv"
df_cic = pd.read_csv(cic_file, nrows=100, encoding='latin1', low_memory=False)

print(f"Columns: {len(df_cic.columns)}")
print(f"Sample shape: {df_cic.shape}")
print(f"\nKey columns:")
for col in df_cic.columns:
    print(f"  - {col.strip()}")

print(f"\nLabel column: ' Label'")
print(f"Classes in sample:")
print(df_cic[' Label'].value_counts())

print(f"\nData types: {df_cic.dtypes.value_counts().to_dict()}")
print(f"Missing values: {df_cic.isnull().sum().sum()}")
print(f"Duplicates in sample: {df_cic.duplicated().sum()}")

# UNSW-NB15
print("\n\n### UNSW-NB15 Dataset ###\n")
unsw_file = DATASETS_DIR / "UNSW_NB15_training-set.csv"
df_unsw = pd.read_csv(unsw_file, nrows=100, encoding='latin1', low_memory=False)

print(f"Columns: {len(df_unsw.columns)}")
print(f"Sample shape: {df_unsw.shape}")
print(f"\nKey columns:")
for col in df_unsw.columns:
    print(f"  - {col}")

# Find label columns
if 'label' in df_unsw.columns:
    print(f"\nLabel column: 'label'")
    print(f"Binary classes in sample:")
    print(df_unsw['label'].value_counts())

if 'attack_cat' in df_unsw.columns:
    print(f"\nAttack category column: 'attack_cat'")
    print(f"Attack types in sample:")
    print(df_unsw['attack_cat'].value_counts())

print(f"\nData types: {df_unsw.dtypes.value_counts().to_dict()}")
print(f"Missing values: {df_unsw.isnull().sum().sum()}")
print(f"Duplicates in sample: {df_unsw.duplicated().sum()}")

print("\n" + "="*80)
print("INSPECTION COMPLETE")
print("="*80)
