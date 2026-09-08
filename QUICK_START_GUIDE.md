# Quick Start Guide - CyberPredict Attack Detection

**🎯 Goal:** Upload a CSV file and get attack detection results with downloadable reports

---

## 🚀 Step 1: Start the Application

### Open 2 Terminal Windows:

**Terminal 1 - Backend:**
```bash
cd d:\ai\cyberpredict\backend
npm run dev
```
✅ Wait for: "CyberPredict Backend http://localhost:4000"

**Terminal 2 - Frontend:**
```bash
cd d:\ai\cyberpredict\frontend
npm run dev
```
✅ Wait for: "Ready in X.Xs"

---

## 📁 Step 2: Prepare Your CSV File

### Option A: Use Your Own Dataset
Place your network traffic CSV in the `datasets/` folder.

**Required columns** (CIC-IDS2017 format):
- `Label` - Attack type (BENIGN, DDoS, PortScan, etc.)
- Flow-based features (79 columns)

**OR**

**Required columns** (UNSW-NB15 format):
- `label` - Binary (0=Normal, 1=Attack)
- `attack_cat` - Attack category
- Flow features (45 columns)

### Option B: Download Real Datasets
See `datasets/README.md` for download links:
- CIC-IDS2017: https://www.unb.ca/cic/datasets/ids-2017.html
- UNSW-NB15: https://research.unsw.edu.au/projects/unsw-nb15-dataset

---

## 🌐 Step 3: Open the Website

1. Open browser: **http://localhost:3000**
2. Click on **Traffic Analyzer** in the sidebar

---

## 📤 Step 4: Upload CSV File

1. **Drag & drop** your CSV file into the upload area
   
   OR
   
2. **Click** the upload area to browse files

3. ✅ File is uploaded and parsed

---

## 📊 Step 5: View Results

After upload, you'll see:

### Statistics Cards:
```
┌─────────────────────────────────────┐
│ Total Records: 50,000              │
│ Benign Traffic: 45,234 (90.47%)   │
│ Attack Traffic: 4,766 (9.53%)     │
└─────────────────────────────────────┘
```

### Attack Breakdown:
```
DDoS          ████████░░ 6.4%  (3,200 attacks)
PortScan      ███░░░░░░░ 2.4%  (1,200 attacks)
Web Attack    █░░░░░░░░░ 0.73% (366 attacks)
```

### Risk Level:
- 🟢 **LOW** (<5% attacks)
- 🟡 **MEDIUM** (5-15% attacks)
- 🟠 **HIGH** (15-30% attacks)
- 🔴 **CRITICAL** (>30% attacks)

---

## 💾 Step 6: Download Report

Click one of the download buttons:

### 1. Download CSV
```csv
ATTACK ANALYSIS REPORT
Generated: 2026-09-08T22:30:00Z
Dataset: company_traffic.csv

SUMMARY
Total Records,50000
Benign Traffic,45234,90.47%
Attack Traffic,4766,9.53%

ATTACK BREAKDOWN
Attack Type,Count,Percentage
DDoS,3200,6.4%
PortScan,1200,2.4%
Web Attack,366,0.73%
```

### 2. Download Excel
Same format as CSV, opens in Microsoft Excel

### 3. Download JSON
```json
{
  "status": "success",
  "format": "CIC-IDS2017",
  "total_records": 50000,
  "benign_count": 45234,
  "attack_count": 4766,
  "attack_percentage": 9.53,
  "attack_breakdown": {
    "DDoS": {"count": 3200, "percentage": 6.4},
    "PortScan": {"count": 1200, "percentage": 2.4},
    "Web Attack": {"count": 366, "percentage": 0.73}
  }
}
```

---

## 🔄 Step 7: Refresh Test (Persistence)

1. **Refresh the page** (F5)
2. ✅ Your uploaded data is still there!
3. Navigate to another page
4. Come back to Traffic Analyzer
5. ✅ Data still persists!

**Why?** IndexedDB stores your data in the browser.

---

## 🎓 Example Walkthrough

### Scenario: Analyze Monday's Traffic

1. Download CIC-IDS2017 dataset
2. Extract `Monday-WorkingHours.pcap_ISCX.csv`
3. Start servers (Step 1)
4. Open http://localhost:3000/traffic-analyzer
5. Upload `Monday-WorkingHours.pcap_ISCX.csv`
6. Wait 5-10 seconds for analysis
7. See results:
   ```
   Total: 529,918 records
   Benign: 529,918 (100%)
   Attacks: 0 (0%)
   Risk: LOW 🟢
   ```
8. Download CSV report
9. Open in Excel and review

---

## 🛠️ Troubleshooting

### Problem: Backend won't start
**Solution:** Check if Python is installed
```bash
python --version
```
Install if missing: https://www.python.org/downloads/

### Problem: "Pandas not found" error
**Solution:** Install pandas
```bash
pip install pandas
```

### Problem: Analysis takes too long
**Solution:** File is too large. The analyzer uses 10K row sampling for speed.
- Expected time: 5-10 seconds for any file size
- If longer, check console for errors

### Problem: Download doesn't work
**Solution:** 
1. Make sure backend is running (http://localhost:4000)
2. Check browser console for errors (F12)
3. Try a different format (CSV/Excel/JSON)

### Problem: Data disappeared after refresh
**Solution:** 
1. Check if IndexedDB is enabled in browser
2. Open DevTools → Application → IndexedDB
3. Look for "CyberPredictDB"
4. If missing, browser storage might be disabled

---

## 📋 Checklist

Before starting, make sure you have:
- [ ] Node.js installed (v18+)
- [ ] Python installed (v3.8+)
- [ ] Pandas installed (`pip install pandas`)
- [ ] Git repository cloned
- [ ] Dependencies installed (`npm install` in both folders)
- [ ] CSV file ready (or download link saved)
- [ ] Browser with IndexedDB support (Chrome, Firefox, Edge)

---

## 🎯 What You Can Do Now

### 1. Analyze Traffic
- Upload any network CSV file
- Get instant attack detection
- See percentage breakdown

### 2. Download Reports
- Export as CSV for spreadsheets
- Export as Excel for presentations
- Export as JSON for automation

### 3. Compare Datasets
- Upload CIC-IDS2017 Monday file
- Download report
- Upload Friday DDoS file
- Download report
- Compare attack percentages

### 4. Share Results
- Export reports and share with team
- Present statistics in meetings
- Document security incidents

---

## 🔗 Useful Links

- **GitHub Repo:** https://github.com/NehaBegum786/CyberPredict
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Dataset Info:** See `datasets/README.md`
- **Full Documentation:** See `IMPLEMENTATION_SUMMARY.md`

---

## 💡 Pro Tips

1. **Large Files:** The analyzer samples 10,000 rows for speed. For full analysis, use the preprocessing script.

2. **Multiple Files:** You can upload multiple files one by one. Each will be stored separately in IndexedDB.

3. **API Access:** You can also use the API directly:
   ```bash
   # Upload
   curl -F "file=@traffic.csv" http://localhost:4000/api/upload
   
   # Download report
   curl http://localhost:4000/api/upload/DATASET_ID/download?format=json
   ```

4. **Clear Storage:** To clear all stored data:
   - DevTools → Application → IndexedDB → CyberPredictDB → Delete

5. **Batch Analysis:** Upload files via API in a loop for automated processing.

---

## ✅ Success Indicators

You know it's working when:
- ✅ Upload shows statistics immediately
- ✅ Attack percentage calculated correctly
- ✅ Download buttons generate files
- ✅ Files open in Excel/text editor
- ✅ Data persists after refresh
- ✅ Risk level color matches percentage

---

## 🎉 You're Ready!

**Everything is set up and working.** Go ahead and upload your first CSV file!

**Questions?** Check the documentation:
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `datasets/README.md` - Dataset download guide
- `docs/DATASET_INTEGRATION_IMPACT.md` - Feature impact

**Have fun detecting attacks! 🚀🔒**
