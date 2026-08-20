const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true,
  },
  shortId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  customAlias: {
    type: String,
    sparse: true,
    trim: true,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Analytics Fields
  totalClicks: {
    type: Number,
    default: 0,
  },
  uniqueVisitors: {
    type: Number,
    default: 0,
  },
  lastClickedAt: {
    type: Date,
    default: null,
  },
  visitors: [{
    ip: { type: String, default: 'Unknown' },
    device: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    location: {
      country: { type: String, default: 'Unknown' },
      city: { type: String, default: 'Unknown' },
      region: { type: String, default: 'Unknown' },
    },
    referrer: { type: String, default: 'Direct' },
    timestamp: { type: Date, default: Date.now },
  }],
  dailyStats: [{
    date: { type: String },
    count: { type: Number, default: 0 },
  }],
  locationStats: [{
    country: { type: String, default: 'Unknown' },
    count: { type: Number, default: 0 },
  }],
  deviceStats: [{
    device: { type: String, default: 'Unknown' },
    count: { type: Number, default: 0 },
  }],
  browserStats: [{
    browser: { type: String, default: 'Unknown' },
    count: { type: Number, default: 0 },
  }],
  referrerStats: [{
    source: { type: String, default: 'Direct' },
    count: { type: Number, default: 0 },
  }],
}, {
  timestamps: true,
});

// ✅ Indexes for faster queries
urlSchema.index({ shortId: 1 });
urlSchema.index({ userId: 1, createdAt: -1 });
urlSchema.index({ 'visitors.timestamp': -1 });

module.exports = mongoose.model('Url', urlSchema);