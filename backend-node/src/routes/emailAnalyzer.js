const express = require("express");
console.log("EMAIL ANALYZER ROUTE LOADED");

const router = express.Router();
const { analyzeEmail } = require("../controllers/emailController");

router.post("/email-analyzer", analyzeEmail);

module.exports = router;