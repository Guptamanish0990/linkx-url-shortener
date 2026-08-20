const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const auth = require('../middleware/auth');

// ============================================================
// ROUTES
// ============================================================

// ✅ PUBLIC - Anyone can shorten (Guest mode)
router.post('/shorten', urlController.shortenUrl);  // ← KEEP THIS

// 🔒 PRIVATE - Need login
router.get('/urls', auth, urlController.getUserUrls);
router.delete('/urls/:shortId', auth, urlController.deleteUrl);

module.exports = router;