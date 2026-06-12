require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const urlScannerRoute = require('./routes/urlScanner');
const authRoutes = require('./routes/authRoutes');
const scanHistoryRoute = require('./routes/scanHistory');
const historyRoutes = require('./routes/historyRoutes');
const emailAnalyzerRoutes = require("./routes/emailAnalyzer");
const emailRoutes = require('./routes/emailRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const http = require('http');
const rateLimit = require('express-rate-limit');
const { initSocket } = require('./services/socketService');
const { initRedis } = require('./services/redisService');

const app = express();
const server = http.createServer(app);

// rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS'
});

// middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

app.use(express.json());

const path = require('path');
app.use('/screenshots', express.static(path.join(__dirname, 'data/screenshots')));

// routes
app.use('/api', urlScannerRoute);
app.use('/api/auth', authRoutes);
app.use('/api', scanHistoryRoute);
app.use('/api', historyRoutes);
app.use("/api", emailAnalyzerRoutes);
app.use('/api', emailRoutes);
app.use('/api', reportRoutes);
app.use('/api', adminRoutes);
app.use('/api', analyticsRoutes);

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

// Init dynamic services
initSocket(server);
initRedis();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
