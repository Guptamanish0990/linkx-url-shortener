import { useState, useEffect } from 'react';
import { getDashboardAnalytics } from '../services/api';import './Analytics.css';

interface DailyClick {
  day: string;
  clicks: number;
}

interface TopLink {
  id: string | number;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
  percentage: number;
}

interface Referrer {
  source: string;
  count: number;
}

interface LocationStat {
  country: string;
  count: number;
}

interface DeviceStat {
  device: 'Mobile' | 'Desktop' | 'Tablet';
  count: number;
  percentage: number;
}

interface AnalyticsData {
  totalClicks: number;
  uniqueVisitors: number;
  avgClicksPerDay: number;
  bounceRate: number;
  dailyClicks: DailyClick[];
  topLinks: TopLink[];
  referrers: Referrer[];
  locations: LocationStat[];
  devices: DeviceStat[];
  quickStats: {
    bestDay: { day: string; clicks: number };
    worstDay: { day: string; clicks: number };
  };
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching analytics for ${timeRange} days...`);
        const days = parseInt(timeRange);
        const response = await getDashboardAnalytics(days); // Corrected function call
        setAnalyticsData(response.data as AnalyticsData);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load analytics data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return <div className="analytics-container"><p>Loading analytics...</p></div>;
  }

  if (error) {
    return <div className="analytics-container"><p className="error-box">{error}</p></div>;
  }

  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return <div className="analytics-container"><p>No analytics data available.</p></div>;
  }

  const maxClicks = Math.max(...(analyticsData.dailyClicks || []).map(d => d.clicks), 0);
  const maxReferrer = Math.max(...(analyticsData.referrers || []).map(r => r.count), 0);

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>📊 Analytics Dashboard</h1>
          <p>Track your link performance and audience insights</p>
        </div>
        <div className="time-range-selector">
          <button className={timeRange === '7' ? 'active' : ''} onClick={() => setTimeRange('7')}>7 Days</button>
          <button className={timeRange === '30' ? 'active' : ''} onClick={() => setTimeRange('30')}>30 Days</button>
          <button className={timeRange === '90' ? 'active' : ''} onClick={() => setTimeRange('90')}>90 Days</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass">
          <div className="stat-icon purple">
            <i className="fas fa-mouse-pointer"></i>
          </div>
          <div>
            <p className="stat-label">Total Clicks</p>
            <p className="stat-value">{analyticsData.totalClicks?.toLocaleString() || 0}</p>
            <span className="stat-change up">↑ 12.5% from last week</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon blue">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <p className="stat-label">Unique Visitors</p>
            <p className="stat-value">{analyticsData.uniqueVisitors?.toLocaleString() || 0}</p>
            <span className="stat-change up">↑ 8.3% from last week</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon green">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div>
            <p className="stat-label">Avg Clicks/Day</p>
            <p className="stat-value">{analyticsData.avgClicksPerDay || 0}</p>
            <span className="stat-change down">↓ 2.1% from last week</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon orange">
            <i className="fas fa-arrow-trend-down"></i>
          </div>
          <div>
            <p className="stat-label">Bounce Rate</p>
            <p className="stat-value">{analyticsData.bounceRate || 0}%</p>
            <span className="stat-change up">↑ 3.2% from last week</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section glass">
        <div className="chart-header">
          <h3>Click Activity ({timeRange} days)</h3>
          <span>Total clicks over the last {timeRange} days.</span>
        </div>
        <div className="chart-bars">
          {analyticsData.dailyClicks?.map((day, index) => (
            <div key={index} className="chart-bar-group">
              <div 
                className="chart-bar" 
                style={{ height: `${(day.clicks / maxClicks) * 100}%` }}
              >
                <span className="bar-tooltip">{day.clicks}</span>
              </div>
              <span className="bar-label">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="analytics-grid">
        {/* Top Links */}
        <div className="glass card">
          <h3>🏆 Top Performing Links</h3>
          <div className="top-links">
            {analyticsData.topLinks?.map((link, index) => (
              <div key={link.id} className="top-link-item">
                <div className="link-rank">{index + 1}</div>
                <div className="link-info">
                  <a href="#" className="link-url">{link.shortUrl}</a>
                  <div className="link-progress">
                    <div 
                      className="link-progress-fill" 
                      style={{ width: `${link.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="link-clicks">{link.clicks} clicks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referrers */}
        <div className="glass card">
          <h3>🌐 Top Referrers</h3>
          <div className="referrer-list">
            {analyticsData.referrers?.map((ref, index) => (
              <div key={index} className="referrer-item">
                <span className="referrer-name">{ref.source}</span>
                <div className="referrer-bar">
                  <div 
                    className="referrer-fill" 
                    style={{ width: `${(ref.count / maxReferrer) * 100}%` }}
                  />
                </div>
                <span className="referrer-count">{ref.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="analytics-grid-3">
        {/* Locations */}
        <div className="glass card">
          <h3>📍 Top Locations</h3>
          <div className="location-list">
            {analyticsData.locations?.map((loc, index) => (
              <div key={index} className="location-item">
                <span className="location-flag">🌍</span>
                <span className="location-name">{loc.country}</span>
                <span className="location-count">{loc.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="glass card">
          <h3>📱 Devices</h3>
          <div className="device-list">
            {analyticsData.devices?.map((device, index) => (
              <div key={index} className="device-item">
                <div className="device-icon">
                  <i className={`fas ${device.device === 'Mobile' ? 'fa-mobile-alt' : device.device === 'Desktop' ? 'fa-desktop' : 'fa-tablet-alt'}`}></i>
                </div>
                <div className="device-info">
                  <span className="device-name">{device.device}</span>
                  <div className="device-bar">
                    <div 
                      className="device-fill" 
                      style={{ width: `${device.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="device-percent">{device.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass card">
          <h3>⚡ Quick Stats</h3>
          {analyticsData.quickStats ? (
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-label">Best Day</span>
                <span className="quick-value">{analyticsData.quickStats.bestDay.day}</span>
                <span className="quick-sub">{analyticsData.quickStats.bestDay.clicks} clicks</span>
              </div>
              <div className="quick-stat">
                <span className="quick-label">Worst Day</span>
                <span className="quick-value">{analyticsData.quickStats.worstDay.day}</span>
                <span className="quick-sub">{analyticsData.quickStats.worstDay.clicks} clicks</span>
              </div>
              <div className="quick-stat">
                <span className="quick-label">Avg Clicks/Day</span>
                <span className="quick-value">{analyticsData.avgClicksPerDay}</span>
                <span className="quick-sub">over {timeRange} days</span>
              </div>
            </div>
          ) : (
            <p>No quick stats available.</p>
          )}
        </div>
      </div>
    </div>
  );
}