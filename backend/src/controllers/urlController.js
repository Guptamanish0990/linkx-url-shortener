const Url = require('../models/Url');

// ============================================================
// GENERATE SHORT ID
// ============================================================
const generateShortId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return timestamp + random;
};

// ============================================================
// SHORTEN URL
// ============================================================
exports.shortenUrl = async (req, res) => {
  try {
    const { url, customAlias } = req.body;

    console.log('📥 Received URL:', url);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    let shortId = customAlias || generateShortId();

    // Check if custom alias exists
    if (customAlias) {
      const existing = await Url.findOne({ shortId: customAlias });
      if (existing) {
        return res.status(409).json({ error: 'Custom alias already taken' });
      }
    }

    // Check if URL already exists for user
    const userId = req.user?._id || null;
    const existingUrl = await Url.findOne({ originalUrl: url, userId });
    if (existingUrl) {
      return res.status(200).json({
        shortUrl: `${req.protocol}://${req.get('host')}/${existingUrl.shortId}`,
        shortId: existingUrl.shortId,
        url: existingUrl,
        isExisting: true,
      });
    }

    // Create new URL with analytics fields initialized
    const newUrl = new Url({
      originalUrl: url,
      shortId: shortId,
      customAlias: customAlias || null,
      userId: userId,
      visitors: [],
      dailyStats: [],
      locationStats: [],
      deviceStats: [],
      browserStats: [],
      referrerStats: [],
    });

    await newUrl.save();

    const shortUrl = `${req.protocol}://${req.get('host')}/${shortId}`;

    console.log('✅ Short URL created:', shortUrl);

    res.status(201).json({
      shortUrl: shortUrl,
      shortId: shortId,
      url: newUrl,
      isExisting: false,
    });

  } catch (error) {
    console.error('❌ Error creating short URL:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
};

// ============================================================
// GET USER URLS
// ============================================================
exports.getUserUrls = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const urls = await Url.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ urls });
  } catch (error) {
    console.error('❌ Error fetching URLs:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
};

// ============================================================
// DELETE URL
// ============================================================
exports.deleteUrl = async (req, res) => {
  try {
    const { shortId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const url = await Url.findOne({ shortId, userId });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    await url.deleteOne();
    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting URL:', error);
    res.status(500).json({ error: 'Failed to delete URL' });
  }
};

// ============================================================
// GET URL STATS (Public)
// ============================================================
exports.getUrlStats = async (req, res) => {
  try {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({
      shortId: url.shortId,
      originalUrl: url.originalUrl,
      clicks: url.clicks || 0,
      totalClicks: url.totalClicks || 0,
      uniqueVisitors: url.uniqueVisitors || 0,
      createdAt: url.createdAt,
      lastClickedAt: url.lastClickedAt,
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};