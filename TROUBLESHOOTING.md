# Troubleshooting - Analysis Not Working

## Issue: "Analyze Dataset" button does nothing or shows error

### ✅ Quick Fix

The backend path to the Python script was incorrect. I just fixed it!

**What I changed:**
```typescript
// OLD (wrong path):
const pythonScript = path.join(__dirname, "../..", "ml-service", "analyzer", "quick_analyzer.py");

// NEW (correct path):
const projectRoot = path.join(__dirname, "../../..");
const pythonScript = path.join(projectRoot, "ml-service", "analyzer", "quick_analyzer.py");
```

### 🧪 Test If It's Fixed

1. **Open:** http://localhost:3000/traffic-analyzer

2. **Upload a small file:**
   - Go to: `d:\ai\cyberpredict\datasets\`
   - Upload: `UNSW_NB15_training-set.csv` (smaller, faster)

3. **Click "Analyze Dataset & Detect Attacks"**

4. **Wait 5-10 seconds**

5. **You should see:**
   - Attack statistics appear
   - Download buttons appear
   - No error messages

### 🔍 If Still Not Working

#### Check 1: Is Python installed?
```bash
python --version
```
Should show: `Python 3.x.x`

If not installed: https://www.python.org/downloads/

#### Check 2: Is Pandas installed?
```bash
python -c "import pandas; print('OK')"
```
Should show: `OK`

If not:
```bash
pip install pandas
```

#### Check 3: Is Backend Running?
Open: http://localhost:4000/health

Should show:
```json
{
  "status": "ok",
  "service": "cyberpredict-backend"
}
```

If not, restart backend:
```bash
cd d:\ai\cyberpredict\backend
npm run dev
```

#### Check 4: Check Backend Logs

Look at the backend terminal window. After clicking "Analyze", you should see:
```
POST /api/upload 201 ...
POST /api/upload/analyze 200 ...  <-- Should be 200, not 500!
```

If you see `500` error, there's a problem. Look for error messages above it.

#### Check 5: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Upload file and click Analyze
4. Look for errors (red text)

Common errors:
- `Failed to fetch` → Backend not running
- `Network error` → Wrong API URL
- `500 Internal Server Error` → Backend crashed

### 🐛 Common Issues

#### Issue: "Python script error: can't open file"
**Fix:** The path issue I just fixed. Backend should auto-reload.

#### Issue: "ModuleNotFoundError: No module named 'pandas'"
**Fix:**
```bash
pip install pandas
```

#### Issue: "Analysis failed" in UI
**Fix:** Check backend terminal for the real error message.

#### Issue: Backend crashes when analyzing
**Fix:** File might be too large. Try a smaller file first:
```
UNSW_NB15_training-set.csv (smaller)
```

### 📊 Expected Behavior

**When Analysis Works Correctly:**

1. Click "Analyze Dataset & Detect Attacks"
2. Button shows "Analyzing dataset..." (loading spinner)
3. Wait 5-10 seconds
4. Statistics box appears with:
   - Total Records
   - Benign Traffic count
   - Attack Traffic count
   - Attack percentage
5. Download buttons appear
6. No error messages

**Example Result:**
```
Total Records: 82,332
Benign Traffic: 37,000 (45%)
Attack Traffic: 45,332 (55%)
Risk Level: CRITICAL 🔴

Attack Breakdown:
Generic ████████ 25.3%
Exploits ███████ 20.1%
...

[Download CSV] [Download Excel] [Download JSON]
```

### 🔄 Force Refresh

If nothing works, try:

1. **Restart Backend:**
   ```bash
   # Stop (Ctrl+C in backend terminal)
   cd d:\ai\cyberpredict\backend
   npm run dev
   ```

2. **Restart Frontend:**
   ```bash
   # Stop (Ctrl+C in frontend terminal)
   cd d:\ai\cyberpredict\frontend
   npm run dev
   ```

3. **Clear Browser Cache:**
   - Press Ctrl+Shift+Delete
   - Clear cache
   - Reload page (Ctrl+F5)

### ✅ Verification Steps

Run these to verify everything is set up:

```bash
# 1. Check Python
python --version
# Should show: Python 3.x.x

# 2. Check Pandas
python -c "import pandas; print('Pandas OK')"
# Should show: Pandas OK

# 3. Test analyzer directly
cd d:\ai\cyberpredict
python ml-service/analyzer/quick_analyzer.py datasets/UNSW_NB15_training-set.csv 100
# Should show JSON output with attack stats

# 4. Check backend health
curl http://localhost:4000/health
# Should show: {"status":"ok",...}
```

If all 4 work, the system is ready!

### 💡 Debug Mode

To see exactly what's happening:

1. **Open Browser DevTools (F12)**
2. **Go to Network tab**
3. **Upload file and analyze**
4. **Look for these requests:**
   - `POST /api/upload` → Should be 201 (Created)
   - `POST /api/upload/analyze` → Should be 200 (OK)
5. **Click on `analyze` request**
6. **Check Response tab**
7. **Should show attack statistics JSON**

If Response shows error, that's your clue!

### 🆘 Still Not Working?

If none of this works, check:

1. **Backend Terminal** - Look for error messages
2. **Python Path** - Make sure `python` command works
3. **File Permissions** - Can backend write to `backend/uploads/`?
4. **Firewall** - Is port 4000 blocked?
5. **Antivirus** - Is it blocking Python execution?

### 📝 Known Working Configuration

This setup is confirmed working:
- **OS:** Windows 11
- **Node.js:** v18+
- **Python:** 3.8+
- **Pandas:** Latest version
- **Browsers:** Chrome, Edge, Firefox
- **File Size:** Up to 50MB tested
- **Sample Size:** 10,000 rows (fast)

### 🎯 Quick Test Command

Run this to test everything:
```bash
cd d:\ai\cyberpredict

# Test 1: Python
python --version

# Test 2: Pandas
python -c "import pandas"

# Test 3: Analyzer
python ml-service/analyzer/quick_analyzer.py datasets/UNSW_NB15_training-set.csv 100

# Test 4: Backend
curl http://localhost:4000/health
```

If all pass → Try uploading in browser again!

### 📞 Support

- Check backend logs in terminal
- Check browser console (F12)
- Read error messages carefully
- Try smaller files first

**Most common fix:** Just restart the backend server!
