const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const connectDB = require('./config/database');
const Url = require('./models/Url');

const app = express();

// ============================================================
// ✅ DATABASE CONNECTION (Non-blocking)
// ============================================================
console.log('📡 Connecting to MongoDB...');
connectDB();

// ============================================================
// ✅ MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ============================================================
// ✅ HELPER FUNCTIONS
// ============================================================
function detectDevice(userAgent) {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
  return 'Desktop';
}

function detectBrowser(userAgent) {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  return 'Other';
}

function detectOS(userAgent) {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Other';
}

function getDomain(referrer) {
  if (!referrer || referrer === 'Direct') return 'Direct';
  try {
    const url = new URL(referrer);
    return url.hostname.replace('www.', '');
  } catch {
    return 'Direct';
  }
}

async function getLocation(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName`);
    const data = await response.json();
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
      };
    }
    return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
  } catch {
    return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
  }
}

// ============================================================
// ✅ HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: states[dbState] || 'unknown',
  });
});

// ============================================================
// ✅ API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// ============================================================
// ✅ REDIRECT ROUTE - FAST + ANALYTICS (BEST OF BOTH)
// ============================================================
app.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;

    // ✅ Step 1: Check DB connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ DB not connected');
      return res.status(503).send('Service unavailable. Please try again.');
    }

    // ✅ Step 2: Find URL - WITH TIMEOUT
    const url = await Url.findOne({ shortId })
      .lean()
      .maxTimeMS(5000);

    if (!url) {
      return res.status(404).send('URL not found');
    }

    // ✅ Step 3: Track analytics ASYNCHRONOUSLY (non-blocking)
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const referrer = req.headers.referer || req.headers.referrer || 'Direct';

    const device = detectDevice(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    // Get location (async, but we don't wait for it to finish)
    getLocation(ip).then(location => {
      const country = location.country || 'Unknown';

      // ✅ Update all stats in one query
      Url.updateOne(
        { shortId },
        {
          $inc: { clicks: 1, totalClicks: 1 },
          $set: { lastClickedAt: new Date() },
          $push: {
            visitors: {
              ip,
              device,
              browser,
              os,
              location: {
                country: location.country || 'Unknown',
                city: location.city || 'Unknown',
                region: location.region || 'Unknown',
              },
              referrer: referrer !== 'Direct' ? referrer : 'Direct',
              timestamp: new Date(),
            }
          },
          // Update daily stats
          $addToSet: {
            // We'll handle daily stats separately
          }
        }
      ).then(() => {
        // Update daily stats separately
        const today = new Date().toISOString().split('T')[0];
        Url.updateOne(
          { shortId, 'dailyStats.date': today },
          { $inc: { 'dailyStats.$.count': 1 } }
        ).then(result => {
          if (result.matchedCount === 0) {
            // If no daily stat for today, add it
            Url.updateOne(
              { shortId },
              { $push: { dailyStats: { date: today, count: 1 } } }
            ).catch(err => console.error('❌ Daily stats error:', err));
          }
        }).catch(err => console.error('❌ Daily stats error:', err));

        // Update location stats
        if (location.country) {
          Url.updateOne(
            { shortId, 'locationStats.country': location.country },
            { $inc: { 'locationStats.$.count': 1 } }
          ).then(result => {
            if (result.matchedCount === 0) {
              Url.updateOne(
                { shortId },
                { $push: { locationStats: { country: location.country, count: 1 } } }
              ).catch(err => console.error('❌ Location stats error:', err));
            }
          }).catch(err => console.error('❌ Location stats error:', err));
        }

        // Update device stats
        Url.updateOne(
          { shortId, 'deviceStats.device': device },
          { $inc: { 'deviceStats.$.count': 1 } }
        ).then(result => {
          if (result.matchedCount === 0) {
            Url.updateOne(
              { shortId },
              { $push: { deviceStats: { device, count: 1 } } }
            ).catch(err => console.error('❌ Device stats error:', err));
          }
        }).catch(err => console.error('❌ Device stats error:', err));

        // Update browser stats
        Url.updateOne(
          { shortId, 'browserStats.browser': browser },
          { $inc: { 'browserStats.$.count': 1 } }
        ).then(result => {
          if (result.matchedCount === 0) {
            Url.updateOne(
              { shortId },
              { $push: { browserStats: { browser, count: 1 } } }
            ).catch(err => console.error('❌ Browser stats error:', err));
          }
        }).catch(err => console.error('❌ Browser stats error:', err));

        // Update referrer stats
        const referrerDomain = getDomain(referrer);
        Url.updateOne(
          { shortId, 'referrerStats.source': referrerDomain },
          { $inc: { 'referrerStats.$.count': 1 } }
        ).then(result => {
          if (result.matchedCount === 0) {
            Url.updateOne(
              { shortId },
              { $push: { referrerStats: { source: referrerDomain, count: 1 } } }
            ).catch(err => console.error('❌ Referrer stats error:', err));
          }
        }).catch(err => console.error('❌ Referrer stats error:', err));

      }).catch(err => console.error('❌ Click tracking error:', err));
    }).catch(err => console.error('❌ Location error:', err));

    console.log(`📊 Tracked: ${shortId} → ${device} | ${browser} (${url.clicks + 1} total)`);

    // ✅ Step 4: Redirect immediately (don't wait for analytics)
    const target = url.originalUrl.match(/^https?:\/\//)
      ? url.originalUrl
      : `https://${url.originalUrl}`;

    res.redirect(target);

  } catch (error) {
    console.error('❌ Redirect error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================================
// ✅ 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// ✅ ERROR HANDLER
// ============================================================
app.use(errorHandler);

module.exports = app;