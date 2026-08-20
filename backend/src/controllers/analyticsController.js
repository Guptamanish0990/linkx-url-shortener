const Url = require('../models/Url');

// ============================================================
// GET DASHBOARD ANALYTICS
// ============================================================
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const urls = await Url.find({ userId });

    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + (url.totalClicks || 0), 0);
    const uniqueVisitors = urls.reduce((sum, url) => sum + (url.uniqueVisitors || 0), 0);

    // Top performing URLs
    const topUrls = urls
      .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
      .slice(0, 10)
      .map(u => ({
        shortId: u.shortId,
        originalUrl: u.originalUrl,
        clicks: u.totalClicks || 0,
        uniqueVisitors: u.uniqueVisitors || 0,
        createdAt: u.createdAt,
        lastClickedAt: u.lastClickedAt,
      }));

    // Daily clicks (last 7 days)
    const now = new Date();
    const dailyClicks = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let count = 0;
      urls.forEach(url => {
        const stat = url.dailyStats?.find(d => d.date === dateStr);
        if (stat) count += stat.count;
      });

      dailyClicks.push({
        date: dateStr,
        count: count,
      });
    }

    // Aggregate locations
    const locationMap = new Map();
    urls.forEach(url => {
      url.locationStats?.forEach(l => {
        locationMap.set(l.country, (locationMap.get(l.country) || 0) + l.count);
      });
    });
    const topLocations = Array.from(locationMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate devices
    const deviceMap = new Map();
    urls.forEach(url => {
      url.deviceStats?.forEach(d => {
        deviceMap.set(d.device, (deviceMap.get(d.device) || 0) + d.count);
      });
    });
    const devices = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate browsers
    const browserMap = new Map();
    urls.forEach(url => {
      url.browserStats?.forEach(b => {
        browserMap.set(b.browser, (browserMap.get(b.browser) || 0) + b.count);
      });
    });
    const browsers = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate referrers
    const referrerMap = new Map();
    urls.forEach(url => {
      url.referrerStats?.forEach(r => {
        referrerMap.set(r.source, (referrerMap.get(r.source) || 0) + r.count);
      });
    });
    const topReferrers = Array.from(referrerMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity
    let recentActivity = [];
    urls.forEach(url => {
      url.visitors?.forEach(v => {
        recentActivity.push({
          shortId: url.shortId,
          originalUrl: url.originalUrl,
          timestamp: v.timestamp,
          device: v.device,
          browser: v.browser,
          location: v.location?.country || 'Unknown',
          referrer: v.referrer,
        });
      });
    });
    recentActivity = recentActivity
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);

    res.json({
      totalClicks,
      totalUrls,
      uniqueVisitors,
      avgClicksPerUrl: totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0,
      dailyClicks,
      topUrls,
      topLocations,
      devices,
      browsers,
      topReferrers,
      recentActivity,
      timeRange: '7 days',
    });

  } catch (error) {
    console.error('❌ Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to get dashboard analytics: ' + error.message });
  }
};

// ============================================================
// GET URL ANALYTICS
// ============================================================
exports.getUrlAnalytics = async (req, res) => {
  try {
    const { shortId } = req.params;
    const userId = req.user?._id;

    const url = await Url.findOne({ shortId, userId });
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({
      shortId: url.shortId,
      originalUrl: url.originalUrl,
      totalClicks: url.totalClicks || 0,
      uniqueVisitors: url.uniqueVisitors || 0,
      createdAt: url.createdAt,
      lastClickedAt: url.lastClickedAt,
      dailyStats: url.dailyStats || [],
      locationStats: url.locationStats || [],
      deviceStats: url.deviceStats || [],
      browserStats: url.browserStats || [],
      referrerStats: url.referrerStats || [],
      recentVisitors: url.visitors?.slice(-20).reverse() || [],
    });
  } catch (error) {
    console.error('❌ Get URL analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

// ============================================================
// TRACK CLICK (Public)
// ============================================================
exports.trackClick = async (req, res) => {
  try {
    const { shortId } = req.params;

    const url = await Url.findOne({ shortId });
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    url.clicks = (url.clicks || 0) + 1;
    await url.save();

    res.json({
      success: true,
      shortId: shortId,
      totalClicks: url.clicks,
    });
  } catch (error) {
    console.error('❌ Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
};