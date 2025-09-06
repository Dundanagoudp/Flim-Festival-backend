import mongoose from 'mongoose';

// Analytics Data Schema for storing dashboard metrics
const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  activeSessions: {
    type: Number,
    default: 0
  },
  pageViews: {
    type: Number,
    default: 0
  },
  bounceRate: {
    type: Number,
    default: 0
  },
  mobileVisitors: {
    type: Number,
    default: 0
  },
  desktopVisitors: {
    type: Number,
    default: 0
  },
  browserStats: {
    chrome: { type: Number, default: 0 },
    safari: { type: Number, default: 0 },
    firefox: { type: Number, default: 0 },
    edge: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deviceStats: {
    mobile: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  monthlyTrend: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Visitor Data Schema for detailed visitor tracking
const visitorSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  visitors: {
    type: Number,
    required: true,
    default: 0
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet'],
    required: true
  },
  browser: {
    type: String,
    enum: ['chrome', 'safari', 'firefox', 'edge', 'other'],
    required: true
  },
  source: {
    type: String,
    enum: ['direct', 'social', 'search', 'referral', 'email'],
    default: 'direct'
  }
}, {
  timestamps: true
});

// Dashboard Settings Schema
const dashboardSettingsSchema = new mongoose.Schema({
  refreshInterval: {
    type: Number,
    default: 300000 // 5 minutes in milliseconds
  },
  chartTypes: {
    areaChart: { type: Boolean, default: true },
    barChart: { type: Boolean, default: true },
    pieChart: { type: Boolean, default: true },
    radarChart: { type: Boolean, default: true }
  },
  dateRange: {
    startDate: Date,
    endDate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Quick Actions Schema
const quickActionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create models
const Analytics = mongoose.model('Analytics', analyticsSchema);
const Visitor = mongoose.model('Visitor', visitorSchema);
const DashboardSettings = mongoose.model('DashboardSettings', dashboardSettingsSchema);
const QuickAction = mongoose.model('QuickAction', quickActionSchema);

export { Analytics, Visitor, DashboardSettings, QuickAction };
