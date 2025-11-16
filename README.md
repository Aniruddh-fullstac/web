## Social Analytics Excel → Looker Studio App

This app ingests Excel/CSV exports (like `Copy of Fevicryl.xlsx`), auto-detects tables across all sheets, normalizes them with Gemini, merges metrics, and publishes a clean Google Sheet for Looker Studio with five tabs: Overview, Reach, Views, Impressions, Engagement.

### 1. Environment variables

Create a `.env.local` file in the `web` directory:

```bash
GEMINI_API_KEY=your_gemini_key_here

GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Make sure the service account has permission to create and edit Google Sheets in your Google account.

### 2. Install dependencies

```bash
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000/upload` to use the uploader UI.

### 4. Flow

1. Go to `/upload`.
2. Drag & drop `Copy of Fevicryl.xlsx` (or similar exports).
3. The app:
   - reads all sheets
   - detects tables separated by blank rows
   - sends samples to Gemini to normalize the schema and classify table types
   - merges tables into Overview/Reach/Views/Impressions/Engagement datasets
   - creates a Google Sheet with five tabs and writes the merged data.
4. You are redirected to `/result` with a link to the new Google Sheet, ready to be wired into a Looker Studio dashboard.

