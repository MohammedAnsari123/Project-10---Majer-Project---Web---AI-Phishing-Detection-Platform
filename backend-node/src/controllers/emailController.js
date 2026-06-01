const supabase = require('../config/supabase');
const { analyzeEmailContent } = require('../services/emailAnalysisService');

const scanEmail = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Email content is required'
      });
    }

    // Run the email analysis service
    const analysis = analyzeEmailContent(content);

    const userEmail = req.user ? req.user.email : 'guest';
    const userId = req.user ? req.user.id : null;

    // Save scan to email_scans
    const { data: scanData, error: scanError } = await supabase
      .from('email_scans')
      .insert([
        {
          user_id: userId,
          user_email: userEmail,
          content: content,
          risk_score: analysis.riskScore,
          risk_level: analysis.riskLevel,
          result: {
            detectedKeywords: analysis.detectedKeywords,
            categories: analysis.categories,
            recommendation: analysis.recommendation
          }
        }
      ])
      .select();

    if (scanError) {
      console.error('Error saving email scan to Supabase:', scanError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to record email scan in database'
      });
    }

    const emailScanId = scanData && scanData[0] ? scanData[0].id : null;

    // Auto-create a security report log
    const { error: reportError } = await supabase
      .from('reports')
      .insert([
        {
          user_id: userId,
          user_email: userEmail,
          report_type: 'EMAIL',
          details: {
  scan_id: emailScanId,
  risk_score: analysis.riskScore,
  risk_level: analysis.riskLevel,

  threat_type: analysis.threatType,
  threat_score: analysis.threatScore,
  category_scores: analysis.categoryScores,

  recommendation: analysis.recommendation,
  detected_keywords: analysis.detectedKeywords,

  preview:
    content.length > 150
      ? content.substring(0, 150) + '...'
      : content
}
        }
      ]);

    if (reportError) {
      console.error('Error auto-generating security report:', reportError.message);
    }

    return res.status(200).json({
  success: true,
  data: {
    id: emailScanId,
    content: content,

    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,

    threatType: analysis.threatType,
    threatScore: analysis.threatScore,
    categoryScores: analysis.categoryScores,

    detectedKeywords: analysis.detectedKeywords,
    recommendation: analysis.recommendation
  }
});

  } catch (error) {
    console.error('Email scan controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  scanEmail
};
