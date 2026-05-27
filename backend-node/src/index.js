require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const urlScannerRoute = require('./routes/urlScanner');
const authRoutes = require('./routes/authRoutes');
const scanHistoryRoute = require('./routes/scanHistory');
const historyRoutes = require('./routes/historyRoutes');
const emailAnalyzerRoutes = require("./routes/emailAnalyzer");

const app = express();

// middleware
app.use(helmet());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// routes
app.use('/api', urlScannerRoute);
app.use('/api/auth', authRoutes);
app.use('/api', scanHistoryRoute);
app.use('/api', historyRoutes);
app.use("/api", emailAnalyzerRoutes);

// logger (put AFTER routes or BEFORE — both OK)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'phishguard-backend',
    timestamp: new Date()
  });
});

// test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working successfully'
  });
});


// root
app.get('/', (req, res) => {
  res.send('Backend is running successfully');
});

// error handler (MUST BE LAST)
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
