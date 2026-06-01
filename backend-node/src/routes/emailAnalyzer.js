const express = require("express");
console.log("EMAIL ANALYZER ROUTE LOADED");

const router = express.Router();

const { analyzeText } = require("../utils/keywordDetector");
const detectThreatType = require("../utils/threatClassifier");

router.post("/email-analyzer", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Email content is required"
      });
    }

    // Existing keyword analysis
    const result = analyzeText(content);
    console.log('AnalyzeText Result:', result);

const threatAnalysis = detectThreatType(content);

console.log('Threat Analysis:', threatAnalysis);

return res.status(200).json({
  success: true,

  data: {
    ...result.data,

    threatType: threatAnalysis.threatType,
    threatScore: threatAnalysis.score,
    categoryScores: threatAnalysis.categoryScores
  }
});

  } catch (error) {
    console.error("Email Analyzer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

module.exports = router;