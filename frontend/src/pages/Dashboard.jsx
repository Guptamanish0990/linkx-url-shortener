import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUrlHistory, shortenUrl, getDashboardAnalytics, shortUrlBase, deleteUrl } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalClicks: 0 });
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');

  // ============================================================
  // GET GUEST URLS FROM localStorage
  // ============================================================
  const getGuestUrls = () => {
    try {
      const data = localStorage.getItem('guestUrlHistory');
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  // ============================================================
  // SAVE GUEST URLS TO localStorage
  // ============================================================
  const saveGuestUrls = (urls) => {
    try {
      localStorage.setItem('guestUrlHistory', JSON.stringify(urls));
    } catch (error) {
      console.error('Error saving guest URLs:', error);
    }
  };

  // ============================================================
  // LOAD DATA ON MOUNT
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        // ✅ Step 1: Always load guest URLs from localStorage first
        const guestUrls = getGuestUrls();
        console.log('📦 Guest URLs from localStorage:', guestUrls.length);

        if (!token) {
          // ✅ Guest Mode - Only show guest URLs
          setUrls(guestUrls);
          const totalClicks = guestUrls.reduce((sum, url) => sum + (url.clicks || 0), 0);
          setStats({ totalClicks });
          setError(null);
          return;
        }

        // ✅ Step 2: Logged In - Get data from database
        const [hRes, aRes] = await Promise.all([
          getUrlHistory(),
          getDashboardAnalytics(7)
        ]);

        const dbUrls = hRes.data.urls || [];
        console.log('📊 Database URLs:', dbUrls.length);

        // ✅ Step 3: MERGE Guest URLs + Database URLs
        const allUrls = [...guestUrls, ...dbUrls];

        // ✅ Step 4: Remove duplicates by shortId
        const uniqueUrls = allUrls.filter((url, index, self) =>
          index === self.findIndex(u => u.shortId === url.shortId)
        );

        console.log('🔄 Merged URLs:', uniqueUrls.length);

        // ✅ Step 5: Set URLs and stats
        setUrls(uniqueUrls);
        setStats(aRes.data || { totalClicks: aRes.data?.totalClicks || 0 });

        // ✅ Step 6: Clear guest URLs after merging (so they don't duplicate)
        if (guestUrls.length > 0) {
          localStorage.removeItem('guestUrlHistory');
          console.log('🗑️ Guest URLs cleared from localStorage');
        }

      } catch (err) {
        console.error('❌ Load error:', err);
        setError(err.response?.data?.error || 'Unable to load dashboard data');
      }
    };

    loadData();
  }, [token]);

  // ============================================================
  // HANDLE URL SHORTENING
  // ============================================================
  const handleShorten = async (e) => {
    e.preventDefault();

    if (!originalUrl) {
      setError('Please enter a URL');
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      setError('Please enter a valid URL (include https://)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = { url: originalUrl };
      if (customAlias.trim()) {
        payload.customAlias = customAlias.trim();
      }

      const res = await shortenUrl(payload);
      console.log('📥 Shorten response:', res.data);

      const short = res.data?.shortUrl ||
                   (res.data?.shortId ? `${window.location.origin}/${res.data.shortId}` : null);
      setCreated(short);

      // ✅ Create new URL object
      const newUrl = {
        originalUrl: originalUrl,
        shortId: res.data?.shortId || short?.split('/').pop(),
        shortUrl: short,
        clicks: 0,
        createdAt: new Date().toISOString(),
        _id: Date.now().toString(),
      };

      // ✅ GUEST MODE - Save to localStorage
      if (!token) {
        const currentGuestUrls = getGuestUrls();
        const updatedGuestUrls = [newUrl, ...currentGuestUrls];
        saveGuestUrls(updatedGuestUrls);
        setUrls(updatedGuestUrls);
        const totalClicks = updatedGuestUrls.reduce((sum, url) => sum + (url.clicks || 0), 0);
        setStats({ totalClicks });
      } else {
        // ✅ LOGGED IN - Prepend new URL to state and update sessionStorage
        const updatedUrls = [newUrl, ...urls];
        setUrls(updatedUrls);

        // Optimistically update stats. A full refresh might happen later for complete accuracy.
        const updatedTotalClicks = stats.totalClicks + (newUrl.clicks || 0);
        setStats(prevStats => ({ ...prevStats, totalClicks: updatedTotalClicks }));

        sessionStorage.setItem('dashboardUrls', JSON.stringify(updatedUrls));
        sessionStorage.setItem('dashboardStats', JSON.stringify({ ...stats, totalClicks: updatedTotalClicks }));

        // Clear guest URLs if any were pending, as they are now merged or will be handled by DB
        if (getGuestUrls().length > 0) {
          localStorage.removeItem('guestUrlHistory');
        }

        // Optional: Trigger a background fetch to ensure full consistency with the backend
        // This can be done with a separate useEffect or a delayed fetch if needed for other data points
      }

      setOriginalUrl('');
      setCustomAlias('');

    } catch (err) {
      console.error('❌ Shorten error:', err);
      if (err.response?.status === 409) {
        setError('This custom alias is already taken. Choose another alias or leave it blank for an automatic short link.');
      } else {
        setError(err.response?.data?.error || 'Unable to shorten URL');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // HANDLE URL DELETION
  // ============================================================
  const handleDelete = async (shortIdToDelete) => {
    // Optimistically remove from UI
    const updatedUrls = urls.filter(url => url.shortId !== shortIdToDelete);
    setUrls(updatedUrls);

    try {
      if (token) {
        // Logged-in user: Call API
        await deleteUrl(shortIdToDelete);
        // The list is already updated optimistically.
        // A full re-fetch could be an alternative here.
      } else {
        // Guest user: Remove from localStorage
        const guestUrls = getGuestUrls();
        const newGuestUrls = guestUrls.filter(url => url.shortId !== shortIdToDelete);
        saveGuestUrls(newGuestUrls);
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete the link.');
      // If API call fails, revert the optimistic update
      // This requires fetching the original list again or saving it before the update.
      // For simplicity, we'll just show an error for now.
      // To revert: setUrls(urls); // (This would need the pre-delete state)
    }
  };

  // ============================================================
  // COPY TO CLIPBOARD
  // ============================================================
  const handleCopy = async (id, shortUrl) => {
    await navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // ============================================================
  // EXPORT CSV
  // ============================================================
  const handleExportCsv = () => {
    const rows = [['Original URL', 'Short URL', 'Clicks', 'Created At']];
    urls.forEach(u => rows.push([
      u.originalUrl,
      `${shortUrlBase}/${u.shortId}`,
      u.clicks || 0,
      u.createdAt || ''
    ]));
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'links.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================
  const formatDate = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ============================================================
  // CALCULATE STATS
  // ============================================================
  const totalLinks = urls.length;
  const totalClicks = stats.totalClicks || urls.reduce((sum, u) => sum + (u.clicks || 0), 0);
  const userName = user?.fullName || user?.name || 'Guest';

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="corp-dashboard">
      <div className="container">
        {/* ===== TOP BAR ===== */}
        <div className="top-bar">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {userName}! Here's your daily overview</p>
          </div>
          <div className="top-actions">
            <button className="btn-primary" onClick={() => document.getElementById('urlInput')?.focus()}>
              <i className="fas fa-plus"></i> New Link
            </button>

          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <div>
                <p className="stat-label">Total Links</p>
                <p className="stat-number">{totalLinks}</p>
              </div>
              <div className="stat-icon purple-bg">
                <i className="fas fa-link"></i>
              </div>
            </div>
            <p className="stat-change up"><i className="fas fa-arrow-up"></i> 12.5%</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div>
                <p className="stat-label">Total Clicks</p>
                <p className="stat-number">{totalClicks.toLocaleString()}</p>
              </div>
              <div className="stat-icon green-bg">
                <i className="fas fa-mouse-pointer"></i>
              </div>
            </div>
            <p className="stat-change up"><i className="fas fa-arrow-up"></i> 23.8%</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div>
                <p className="stat-label">CTR</p>
                <p className="stat-number">4.2%</p>
              </div>
              <div className="stat-icon yellow-bg">
                <i className="fas fa-chart-line"></i>
              </div>
            </div>
            <p className="stat-change down"><i className="fas fa-arrow-down"></i> 1.2%</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <div>
                <p className="stat-label">Active</p>
                <p className="stat-number">{urls.filter(u => (u.clicks || 0) > 0).length}</p>
              </div>
              <div className="stat-icon pink-bg">
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
            <p className="stat-change up"><i className="fas fa-arrow-up"></i> 5.3%</p>
          </div>
        </div>

        {/* ===== URL FORM ===== */}
        <div className="form-card">
          <form onSubmit={handleShorten} className="url-form">
            <div className="form-row">
              <div className="input-group full">
                <i className="fas fa-link input-icon"></i>
                <input
                  id="urlInput"
                  type="url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="Paste your long URL here..."
                  className="input-field"
                  disabled={loading}
                  required
                />
              </div>
              <div className="input-group small">
                <i className="fas fa-pen input-icon"></i>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="Alias"
                  className="input-field"
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Shortening...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt"></i>
                    Shorten
                  </>
                )}
              </button>
            </div>
          </form>

          {created && (
            <div className="result-box">
              <div className="result-row">
                <div className="result-info">
                  <span className="result-badge"><i className="fas fa-check"></i> Ready</span>
                  <a href={created} target="_blank" rel="noreferrer" className="result-link">
                    {created}
                  </a>
                </div>
                <div className="result-actions">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(created);
                      setCopiedId('created');
                      setTimeout(() => setCopiedId(null), 1200);
                    }}
                    className="btn-copy"
                  >
                    <i className={`fas ${copiedId === 'created' ? 'fa-check' : 'fa-copy'}`}></i>
                    {copiedId === 'created' ? 'Copied' : 'Copy'}
                  </button>
                  <a href={created} target="_blank" rel="noreferrer" className="btn-open">
                    <i className="fas fa-external-link-alt"></i> Open
                  </a>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-box">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="main-grid">
          {/* Recent Links */}
          <div className="card links-card">
            <div className="card-header">
              <h2 className="card-title">Recent Links</h2>
              {urls.length > 4 && (
                <button className="view-all" onClick={() => setShowAllLinks(!showAllLinks)}>
                  {showAllLinks ? 'Show Less' : `View All (${urls.length})`}
                </button>
              )}
            </div>
            <div className="links-list">
              {urls.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <p>No links yet — create one above to get started.</p>
                </div>
              ) : (
                (showAllLinks ? urls : urls.slice(0, 5)).map((item) => {
                  const id = item._id || item.shortId;
                  const shortUrl = `${shortUrlBase}/${item.shortId}`;
                  const clicks = item.clicks || 0;
                  return (
                    <div key={id} className="link-item">
                      <div className="link-info">
                        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="link-short">
                          {shortUrl.replace(/^https?:\/\//, '')}
                        </a>
                        <p className="link-original">{item.originalUrl}</p>
                      </div>
                      <div className="link-actions">
                        <span className="link-clicks">{clicks} clicks</span>
                        <button
                          className="link-copy"
                          onClick={() => handleCopy(id, shortUrl)}
                          title="Copy short URL"
                        >
                          {copiedId === id ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
                        </button>
                        <button className="link-delete" onClick={() => handleDelete(item.shortId)} title="Delete link">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="card activity-card">
            <h2 className="card-title">Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon green"><i className="fas fa-link"></i></div>
                <div>
                  <p className="activity-title">New link created</p>
                  <p className="activity-time">2 minutes ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon purple"><i className="fas fa-mouse-pointer"></i></div>
                <div>
                  <p className="activity-title">Link clicked 150 times</p>
                  <p className="activity-time">1 hour ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon blue"><i className="fas fa-user"></i></div>
                <div>
                  <p className="activity-title">New user registered</p>
                  <p className="activity-time">3 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon orange"><i className="fas fa-chart-line"></i></div>
                <div>
                  <p className="activity-title">CTR improved to 4.2%</p>
                  <p className="activity-time">5 hours ago</p>
                </div>
              </div>
            </div>
            <button className="btn-export" onClick={handleExportCsv}>
              <i className="fas fa-download"></i> Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}