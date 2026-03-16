const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { extractStructuredData } = require("../utils/ai");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "text/plain"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and TXT files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "A question is required." });
    }

    const filePath = req.file.path;
    let documentText = "";

    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      documentText = pdfData.text;
    } else if (req.file.mimetype === "text/plain") {
      documentText = fs.readFileSync(filePath, "utf8");
    }

    if (!documentText || documentText.trim().length < 10) {
      return res.status(422).json({
        error: "Could not extract readable text from the document.",
      });
    }

    const geminiResult = await extractStructuredData(documentText, question);

    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      extracted_data: geminiResult.extracted_data,
      relevance_summary: geminiResult.relevance_summary,
      document_text: documentText,
      question: question,
    });

  } catch (error) {
    console.error("Upload route error:", error.message);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
});

module.exports = router;