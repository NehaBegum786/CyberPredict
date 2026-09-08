# CyberPredict Datasets

This directory contains network intrusion detection datasets used for training and analysis.

## ⚠️ Dataset Files Not Included in Git

Due to their large size (2.8M+ rows, hundreds of MB), the actual CSV files are **NOT** committed to the Git repository.

## 📥 Download Datasets

### CIC-IDS2017
**Download from:** https://www.unb.ca/cic/datasets/ids-2017.html

**Required Files:**
- Monday-WorkingHours.pcap_ISCX.csv
- Tuesday-WorkingHours.pcap_ISCX.csv
- Wednesday-workingHours.pcap_ISCX.csv
- Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv
- Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv
- Friday-WorkingHours-Morning.pcap_ISCX.csv
- Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv
- Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv

**Description:**
- 8 CSV files covering different attack types
- ~2.8 million network flow records
- 79 features per flow
- Multi-class labels (BENIGN, DDoS, PortScan, Web Attack, etc.)

### UNSW-NB15
**Download from:** https://research.unsw.edu.au/projects/unsw-nb15-dataset

**Required Files:**
- UNSW_NB15_training-set.csv
- UNSW_NB15_testing-set.csv
- UNSW-NB15_1.csv (optional)
- UNSW-NB15_2.csv (optional)
- UNSW-NB15_3.csv (optional)
- UNSW-NB15_4.csv (optional)
- NUSW-NB15_features.csv (optional - feature descriptions)
- UNSW-NB15_LIST_EVENTS.csv (optional - event list)

**Description:**
- 2 main CSV files (training + testing)
- ~257,000 network flow records
- 45 features per flow
- Binary labels (0=Normal, 1=Attack) + attack categories

## 📂 Directory Structure

After downloading, place the files in this directory:

```
datasets/
├── README.md (this file)
├── DATASET_ANALYSIS.md (analysis report)
├── Monday-WorkingHours.pcap_ISCX.csv
├── Tuesday-WorkingHours.pcap_ISCX.csv
├── Wednesday-workingHours.pcap_ISCX.csv
├── Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv
├── Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv
├── Friday-WorkingHours-Morning.pcap_ISCX.csv
├── Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv
├── Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv
├── UNSW_NB15_training-set.csv
├── UNSW_NB15_testing-set.csv
├── UNSW-NB15_1.csv
├── UNSW-NB15_2.csv
├── UNSW-NB15_3.csv
├── UNSW-NB15_4.csv
├── NUSW-NB15_features.csv
└── UNSW-NB15_LIST_EVENTS.csv
```

## 🚀 Usage

Once downloaded, the datasets can be:

1. **Analyzed directly** via the Traffic Analyzer page (`/traffic-analyzer`)
   - Upload any CSV file
   - Get real-time attack detection
   - Download analysis reports

2. **Pre-processed** for ML training:
   ```bash
   python scripts/preprocess_datasets.py
   ```
   This will create preprocessed files in `datasets/preprocessed/`

3. **Used for research** - See `DATASET_ANALYSIS.md` for detailed statistics

## 📊 Quick Stats

| Dataset | Records | Features | Attack % |
|---------|---------|----------|----------|
| CIC-IDS2017 | ~2.8M | 79 | ~20% |
| UNSW-NB15 | ~257K | 45 | ~37% |

## 🔗 References

1. **CIC-IDS2017**
   - Sharafaldin, I., Lashkari, A.H. and Ghorbani, A.A., 2018. Toward generating a new intrusion detection dataset and intrusion traffic characterization. ICISSp, pp.108-116.

2. **UNSW-NB15**
   - Moustafa, N. and Slay, J., 2015. UNSW-NB15: a comprehensive data set for network intrusion detection systems (UNSW-NB15 network data set). Military Communications and Information Systems Conference (MilCIS), pp.1-6.

## ⚙️ Alternative: Use Sample Data

If you don't want to download the full datasets, you can:
- Upload smaller CSV files with similar column structure
- Use the demo mode (no dataset required)
- Generate synthetic data using the preprocessing scripts

## 💾 Storage Requirements

- CIC-IDS2017: ~2.5 GB (all 8 files)
- UNSW-NB15: ~500 MB (all files)
- **Total**: ~3 GB

Make sure you have sufficient disk space before downloading.
