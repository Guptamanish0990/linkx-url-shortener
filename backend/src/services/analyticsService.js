const Url = require('../models/Url')

async function getAnalytics() {
  const urls = await Url.find().sort({ clicks: -1 }).limit(10)
  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0)
  return { totalClicks, urls }
}

module.exports = { getAnalytics }
