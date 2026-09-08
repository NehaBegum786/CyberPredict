"""Quick sampled attack detection for large CSV files"""
import pandas as pd
import json
import sys

def quick_analyze(file_path, sample_size=10000):
    """Analyze a sample of the dataset for quick results"""
    try:
        # Read only first N rows
        df = pd.read_csv(file_path, encoding='latin1', low_memory=False, nrows=sample_size)
        
        # Clean column names (keep original for comparison)
        df.columns = df.columns.str.strip()
        
        # Create lowercase version for matching
        df_lower = df.copy()
        df_lower.columns = df_lower.columns.str.lower().str.replace(' ', '_')
        
        total_records = len(df)
        
        # Try to find label column (case-insensitive)
        label_col = None
        attack_type_col = None
        
        for col in df.columns:
            col_lower = col.lower().strip()
            if col_lower == 'label':
                label_col = col
            elif col_lower in ['attack_type', 'attacktype', 'attack_cat', 'attackcat']:
                attack_type_col = col
        
        if label_col:
            # Get unique label values (case-insensitive check)
            label_values = df[label_col].astype(str).str.upper().str.strip()
            label_counts = label_values.value_counts()
            
            # Check if it's binary (0/1 or Normal/Attack) or multi-class (BENIGN/Attack types)
            benign_variants = ['BENIGN', 'NORMAL', '0', 'BACKGROUND']
            benign_count = sum(label_counts.get(variant, 0) for variant in benign_variants)
            
            attack_count = total_records - benign_count
            attack_percentage = (attack_count / total_records * 100) if total_records > 0 else 0
            
            result = {
                'status': 'success',
                'format': 'CSV with labels',
                'sample_size': total_records,
                'total_records': total_records,
                'benign_count': int(benign_count),
                'attack_count': int(attack_count),
                'attack_percentage': round(attack_percentage, 2),
                'attack_breakdown': {}
            }
            
            # If we have an attack_type column, use that for breakdown
            if attack_type_col and attack_count > 0:
                # Get attack types only from attack rows
                attack_mask = ~label_values.isin(benign_variants)
                if attack_mask.sum() > 0:
                    attack_types = df[attack_mask][attack_type_col].value_counts()
                    for attack_type, count in attack_types.items():
                        percentage = (count / total_records * 100)
                        result['attack_breakdown'][str(attack_type)] = {
                            'count': int(count),
                            'percentage': round(percentage, 2)
                        }
            else:
                # Use label column values as attack types (excluding benign)
                for label_val, count in label_counts.items():
                    if label_val not in benign_variants:
                        percentage = (count / total_records * 100)
                        result['attack_breakdown'][str(label_val)] = {
                            'count': int(count),
                            'percentage': round(percentage, 2)
                        }
            
            return result
        else:
            # No label column - return basic stats
            return {
                'status': 'success',
                'format': 'UNKNOWN',
                'sample_size': total_records,
                'total_records': total_records,
                'benign_count': 0,
                'attack_count': 0,
                'attack_percentage': 0,
                'attack_breakdown': {},
                'note': 'No label column found - unable to detect attacks',
                'available_columns': list(df.columns)
            }
            
    except Exception as e:
        import traceback
        return {
            'status': 'error',
            'error': str(e),
            'traceback': traceback.format_exc(),
            'total_records': 0,
            'benign_count': 0,
            'attack_count': 0,
            'attack_percentage': 0,
            'attack_breakdown': {}
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    sample_size = int(sys.argv[2]) if len(sys.argv) > 2 else 10000
    
    result = quick_analyze(file_path, sample_size)
    print(json.dumps(result, indent=2))
