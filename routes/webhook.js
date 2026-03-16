const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/", async (req, res) => {
  try {
    const { document_text, extracted_data, question, recipient_email } = req.body;

    if (!recipient_email || !recipient_email.includes("@")) {
      return res.status(400).json({ error: "A valid recipient email is required." });
    }

    if (!document_text || !extracted_data || !question) {
      return res.status(400).json({ error: "Missing required fields for automation." });
    }

    const payload = {
      document_text,
      extracted_data,
      question,
      recipient_email,
    };

    const n8nResponse = await axios.post(
      process.env.N8N_WEBHOOK_URL,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    const { answer, email_body, status } = n8nResponse.data;

    return res.status(200).json({
      success: true,
      answer: answer || "No analytical answer returned.",
      email_body: email_body || "No email body returned.",
      status: status || "unknown",
    });
  } catch (error) {
    console.error("Webhook route error:", error.message);

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({ error: "n8n webhook timed out. Make sure your workflow is active." });
    }

    if (error.response) {
      return res.status(502).json({
        error: "n8n returned an error.",
        details: error.response.data,
      });
    }

    return res.status(500).json({ error: "Failed to contact n8n webhook." });
  }
});

module.exports = router;