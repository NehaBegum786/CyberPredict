"""Quick sampled attack detection for large CSV files"""
import pandas as pd
import json
import sys

def quick_analyze(file_path, sample_size=10000):
    """Analyze a sample of the dataset for quick results"""
    try:
        # Read only first N rows
        df = pd.read_csv(file_path, encoding='latin1', low_memory=False, nrows=sample_size)
        
        # Clean column names
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        total_records = len(df)
        
        # Detect format and analyze
        if 'label' in df.columns:
            # Check if CIC-IDS2017 format
            if df['label'].dtype == 'object':
                # CIC format
                label_counts = df['label'].value_counts()
                attack_counts = label_counts[label_counts.index != 'BENIGN'].to_dict()
                benign_count = label_counts.get('BENIGN', 0)
                
                attack_count = total_records - benign_count
                attack_percentage = (attack_count / total_records * 100) if total_records > 0 else 0
                
                result = {
                    'status': 'success',
                    'format': 'CIC-IDS2017',
                    'sample_size': total_records,
                    'total_records': total_records,  # Note: this is just the sample
                    'benign_count': int(benign_count),
                    'attack_count': int(attack_count),
                    'attack_percentage': round(attack_percentage, 2),
                    'attack_breakdown': {}
                }
                
                for attack_type, count in attack_counts.items():
                    percentage = (count / total_records * 100)
                    result['attack_breakdown'][str(attack_type)] = {
                        'count': int(count),
                        'percentage': round(percentage, 2)
                    }
                
                return result
            else:
                # UNSW format (binary label)
                attack_count = df['label'].sum()
                benign_count = total_records - attack_count
                attack_percentage = (attack_count / total_records * 100)
                
                result = {
                    'status': 'success',
                    'format': 'UNSW-NB15',
                    'sample_size': total_records,
                    'total_records': total_records,
                    'benign_count': int(benign_count),
                    'attack_count': int(attack_count),
                    'attack_percentage': round(attack_percentage, 2),
                    'attack_breakdown': {}
                }
                
                if 'attack_cat' in df.columns:
                    attack_cats = df[df['label'] == 1]['attack_cat'].value_counts()
                    for attack_type, count in attack_cats.items():
                        percentage = (count / total_records * 100)
                        result['attack_breakdown'][str(attack_type)] = {
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
                'note': 'No label column found - unable to detect attacks'
            }
            
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e),
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
