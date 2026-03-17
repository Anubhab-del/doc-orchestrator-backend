# DocOrchestrator — Backend API

> Node.js + Express backend for AI-powered document parsing and n8n workflow automation.

---

## Live API
```
https://doc-orchestrator-backend.onrender.com
```

Health check:
```
https://doc-orchestrator-backend.onrender.com/health
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | Server framework |
| Multer | File upload handling |
| pdf-parse | PDF text extraction |
| Groq SDK | AI structured extraction |
| Axios | HTTP requests to n8n |
| dotenv | Environment variable management |

---

## Architecture
```
Client Request
      │
      ▼
Express Server (server.js)
      │
      ├── POST /api/upload
      │       │
      │       ├── Multer receives file
      │       ├── pdf-parse extracts text
      │       ├── Groq AI extracts structured JSON
      │       └── Returns extracted_data + document_text
      │
      └── POST /api/webhook
              │
              ├── Receives document context + recipient email
              ├── POSTs to n8n Production Webhook URL
              └── Returns answer + email_body + status
```

---

## Project Structure
```
server/
├── routes/
│   ├── upload.js        File upload + PDF parsing + Groq AI call
│   └── webhook.js       n8n webhook bridge
├── utils/
│   └── ai.js            Groq SDK + structured extraction prompt
├── uploads/             Temporary file storage (auto-cleared)
├── server.js            Entry point + middleware + routes
├── .env                 Environment variables (never committed)
├── .gitignore
└── package.json
```

---

## Environment Variables

Create a `.env` file in the server root:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/document-orchestrator
CLIENT_URL=https://document-orchestrator-frontend.vercel.app/
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `GROQ_API_KEY` | From console.groq.com |
| `N8N_WEBHOOK_URL` | Production webhook URL from n8n |
| `CLIENT_URL` | Frontend URL for CORS |

---

## API Reference

### GET `/health`
Returns server status.

**Response:**
```json
{
  "status": "OK",
  "message": "Document Orchestrator API is running.",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### POST `/api/upload`
Accepts a document file and analytical question. Extracts structured data using Groq AI.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `document` | File | PDF or TXT file (max 10MB) |
| `question` | String | Analytical question about the document |

**Response:**
```json
{
  "success": true,
  "extracted_data": {
    "technical_skills": "React, Node.js, MongoDB",
    "experience": "2 years"
  },
  "relevance_summary": "Extracted technical skills as requested.",
  "document_text": "Full extracted text...",
  "question": "What are the technical skills?"
}
```

---

### POST `/api/webhook`
Triggers n8n automation workflow. Sends analytical email to recipient.

**Request:** `application/json`

| Field | Type | Description |
|---|---|---|
| `document_text` | String | Full extracted document text |
| `extracted_data` | Object | Structured JSON from extraction |
| `question` | String | Original user question |
| `recipient_email` | String | Email address for alert |

**Response:**
```json
{
  "success": true,
  "answer": "The candidate has strong proficiency in...",
  "email_body": "Dear Recipient, please find below...",
  "status": "Email sent successfully to user@example.com"
}
```

---

## Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

Server runs at `http://localhost:5000`

---

## Deployment on Render

1. Push this folder to a GitHub repository
2. Go to render.com → New Web Service
3. Connect the GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: Free
5. Add all environment variables in the Render dashboard
6. Click Deploy

---

## Security

- All API keys stored in `.env` — never committed to Git
- CORS restricted to frontend URL only
- Uploaded files deleted immediately after processing
- File type validation — only PDF and TXT accepted
- File size limit — 10MB maximum
