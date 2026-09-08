"""
Real-time Attack Detection Service
Analyzes uploaded CSV files and detects attacks using pattern matching and statistical analysis
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import json

class AttackDetector:
    """
    Real-time attack detector using rule-based and statistical methods
    Works with both CIC-IDS2017 and UNSW-NB15 format CSVs
    """
    
    def __init__(self):
        self.attack_patterns = {
            'DDoS': {
                'flow_packets_s': lambda x: x > 1000,
                'total_fwd_packets': lambda x: x > 100,
                'flow_duration': lambda x: x < 10000,
            },
            'PortScan': {
                'syn_flag_count': lambda x: x > 5,
                'fin_flag_count': lambda x: x == 0,
                'rst_flag_count': lambda x: x > 0,
            },
            'BruteForce': {
                'flow_duration': lambda x: x < 5000,
                'total_fwd_packets': lambda x: x < 20,
                'destination_port': lambda x: x in [22, 21, 3389],  # SSH, FTP, RDP
            },
            'WebAttack': {
                'destination_port': lambda x: x in [80, 443, 8080],
                'total_length_of_fwd_packets': lambda x: x > 1000,
                'flow_duration': lambda x: x < 60000,
            }
        }
    
    def detect_format(self, df: pd.DataFrame) -> str:
        """Detect if CSV is CIC-IDS2017 or UNSW-NB15 format"""
        # Clean column names
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        if 'label' in df.columns and 'attack_cat' in df.columns:
            return 'UNSW-NB15'
        elif any('flow' in col for col in df.columns):
            return 'CIC-IDS2017'
        else:
            return 'UNKNOWN'
    
    def analyze_cic_ids2017(self, df: pd.DataFrame) -> Dict:
        """Analyze CIC-IDS2017 format CSV"""
        # Clean column names
        df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        total_records = len(df)
        
        # Check if Label column exists
        if 'label' not in df.columns:
            # Rule-based detection
            return self._rule_based_detection(df, total_records, 'CIC-IDS2017')
        
        # Ground truth available
        label_counts = df['label'].value_counts()
        attack_counts = label_counts[label_counts.index != 'BENIGN'].to_dict()
        benign_count = label_counts.get('BENIGN', 0)
        
        attack_percentage = ((total_records - benign_count) / total_records * 100) if total_records > 0 else 0
        
        # Detailed results
        results = {
            'total_records': total_records,
            'benign_count': int(benign_count),
            'attack_count': int(total_records - benign_count),
            'attack_percentage': round(attack_percentage, 2),
            'attack_breakdown': {},
            'attack_details': []
        }
        
        # Calculate percentage for each attack type
        for attack_type, count in attack_counts.items():
            percentage = (count / total_records * 100)
            results['attack_breakdown'][str(attack_type)] = {
                'count': int(count),
                'percentage': round(percentage, 2)
            }
        
        # Get sample attack details (first 100 attacks)
        if 'label' in df.columns:
            attack_rows = df[df['label'] != 'BENIGN'].head(100)
            for idx, row in attack_rows.iterrows():
                detail = {
                    'row_number': int(idx) + 1,
                    'attack_type': str(row.get('label', 'Unknown')),
                    'destination_port': int(row.get('destination_port', 0)) if pd.notna(row.get('destination_port')) else 0,
                    'flow_duration': int(row.get('flow_duration', 0)) if pd.notna(row.get('flow_duration')) else 0,
                    'total_fwd_packets': int(row.get('total_fwd_packets', 0)) if pd.notna(row.get('total_fwd_packets')) else 0,
                }
                results['attack_details'].append(detail)
        
        return results
    
    def analyze_unsw_nb15(self, df: pd.DataFrame) -> Dict:
        """Analyze UNSW-NB15 format CSV"""
        # Clean column names
        df.columns = df.columns.str.strip().str.lower().str.replace('ï»¿', '')
        
        total_records = len(df)
        
        # Check if labels exist
        if 'label' not in df.columns:
            return self._rule_based_detection(df, total_records, 'UNSW-NB15')
        
        # Binary classification
        attack_count = df['label'].sum()
        benign_count = total_records - attack_count
        attack_percentage = (attack_count / total_records * 100) if total_records > 0 else 0
        
        results = {
            'total_records': total_records,
            'benign_count': int(benign_count),
            'attack_count': int(attack_count),
            'attack_percentage': round(attack_percentage, 2),
            'attack_breakdown': {},
            'attack_details': []
        }
        
        # Attack category breakdown
        if 'attack_cat' in df.columns:
            attack_cats = df[df['label'] == 1]['attack_cat'].value_counts()
            for attack_type, count in attack_cats.items():
                percentage = (count / total_records * 100)
                results['attack_breakdown'][str(attack_type)] = {
                    'count': int(count),
                    'percentage': round(percentage, 2)
                }
        
        # Get sample attack details
        attack_rows = df[df['label'] == 1].head(100)
        for idx, row in attack_rows.iterrows():
            detail = {
                'row_number': int(idx) + 1,
                'attack_type': str(row.get('attack_cat', 'Unknown')),
                'protocol': str(row.get('proto', 'Unknown')),
                'service': str(row.get('service', 'Unknown')),
                'duration': float(row.get('dur', 0)) if pd.notna(row.get('dur')) else 0,
            }
            results['attack_details'].append(detail)
        
        return results
    
    def _rule_based_detection(self, df: pd.DataFrame, total_records: int, format_type: str) -> Dict:
        """Rule-based attack detection when ground truth labels are not available"""
        detected_attacks = []
        
        # Simple heuristic detection
        # High packet rate (potential DDoS)
        if 'flow_packets_s' in df.columns:
            ddos_mask = df['flow_packets_s'] > 1000
            if ddos_mask.sum() > 0:
                detected_attacks.append(('DDoS', ddos_mask.sum()))
        
        # High SYN flags (potential Port Scan)
        if 'syn_flag_count' in df.columns:
            portscan_mask = df['syn_flag_count'] > 5
            if portscan_mask.sum() > 0:
                detected_attacks.append(('PortScan', portscan_mask.sum()))
        
        attack_count = sum(count for _, count in detected_attacks)
        benign_count = total_records - attack_count
        attack_percentage = (attack_count / total_records * 100) if total_records > 0 else 0
        
        results = {
            'total_records': total_records,
            'benign_count': int(benign_count),
            'attack_count': int(attack_count),
            'attack_percentage': round(attack_percentage, 2),
            'attack_breakdown': {},
            'attack_details': [],
            'note': 'Detected using rule-based heuristics (no ground truth labels)'
        }
        
        for attack_type, count in detected_attacks:
            percentage = (count / total_records * 100)
            results['attack_breakdown'][attack_type] = {
                'count': int(count),
                'percentage': round(percentage, 2)
            }
        
        return results
    
    def analyze(self, csv_path: str) -> Dict:
        """Main analysis function - auto-detects format and analyzes"""
        try:
            # Read CSV
            df = pd.read_csv(csv_path, encoding='latin1', low_memory=False)
            
            # Detect format
            format_type = self.detect_format(df)
            
            # Analyze based on format
            if format_type == 'CIC-IDS2017':
                results = self.analyze_cic_ids2017(df)
            elif format_type == 'UNSW-NB15':
                results = self.analyze_unsw_nb15(df)
            else:
                results = self._rule_based_detection(df, len(df), 'UNKNOWN')
            
            results['format'] = format_type
            results['status'] = 'success'
            
            return results
            
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'total_records': 0,
                'benign_count': 0,
                'attack_count': 0,
                'attack_percentage': 0,
                'attack_breakdown': {},
                'attack_details': []
            }
    
    def generate_report_data(self, results: Dict) -> pd.DataFrame:
        """Generate DataFrame for Excel/CSV export"""
        rows = []
        
        # Summary row
        rows.append({
            'Category': 'SUMMARY',
            'Attack Type': 'Total Records',
            'Count': results['total_records'],
            'Percentage': 100.0,
            'Details': f"{results['total_records']} total network flows analyzed"
        })
        
        rows.append({
            'Category': 'SUMMARY',
            'Attack Type': 'Benign Traffic',
            'Count': results['benign_count'],
            'Percentage': round(100 - results['attack_percentage'], 2),
            'Details': 'Normal network traffic'
        })
        
        rows.append({
            'Category': 'SUMMARY',
            'Attack Type': 'Attack Traffic',
            'Count': results['attack_count'],
            'Percentage': results['attack_percentage'],
            'Details': 'Malicious or suspicious traffic'
        })
        
        # Attack breakdown
        for attack_type, data in results['attack_breakdown'].items():
            rows.append({
                'Category': 'ATTACK',
                'Attack Type': attack_type,
                'Count': data['count'],
                'Percentage': data['percentage'],
                'Details': f"{attack_type} attack detected"
            })
        
        return pd.DataFrame(rows)


def analyze_uploaded_file(file_path: str) -> Dict:
    """Helper function to analyze an uploaded file"""
    detector = AttackDetector()
    return detector.analyze(file_path)


if __name__ == "__main__":
    # Test with a sample file
    import sys
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        detector = AttackDetector()
        results = detector.analyze(file_path)
        print(json.dumps(results, indent=2))
