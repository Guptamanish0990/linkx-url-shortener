const Url = require('../models/Url')

async function createShortUrl(data) {
  const url = new Url(data)
  return await url.save()
}

async function getTopUrls() {
  return await Url.find().sort({ clicks: -1 }).limit(10)
}

module.exports = { createShortUrl, getTopUrls }
