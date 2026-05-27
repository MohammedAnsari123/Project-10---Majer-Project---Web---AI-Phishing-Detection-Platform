const express = require("express");

const router = express.Router();

const { analyzeText } = require("../utils/keywordDetector");

router.post("/email-analyzer", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Email content is required"
      });
    }

    const result = analyzeText(content);

    return res.status(200).json(result);

  } catch (error) {
    console.error("Email Analyzer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

module.exports = router;