const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// ============================================================
// ROUTES
// ============================================================

// ✅ Get dashboard analytics (all URLs summary) - Requires Auth
router.get('/dashboard', auth, analyticsController.getDashboardAnalytics);

// ✅ Get analytics for a specific URL - Requires Auth
router.get('/url/:shortId', auth, analyticsController.getUrlAnalytics);

// ✅ Track a click (public - called on redirect)
router.get('/track/:shortId', analyticsController.trackClick);

module.exports = router;