import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { shortenUrl as apiShortenUrl, getUrlHistory, deleteUrl as apiDeleteUrl, shortUrlBase } from './services/api';

const Analytics = lazy(() => import('./pages/Analytics.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));

function HomePage() {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [short, setShort] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<any[]>([]);

  async function shorten(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: Record<string, string> = { url }
      if (customAlias.trim()) {
        payload.customAlias = customAlias.trim()
      }

      const res = await apiShortenUrl(payload);
      setShort(res.data.shortUrl)
      fetchLinks(); // Refresh links after shortening
    } catch (err: any) {
      const msg = err?.response
        ? `Status ${err.response.status}: ${err.response.data?.error || JSON.stringify(err.response.data)}`
        : err.message
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function fetchLinks() {
    try {
      const res = await getUrlHistory();
      setLinks(res.data.urls || []);
    } catch (err) {
      // Non-critical, so we can fail silently or show a small indicator
      console.error("Failed to fetch links on homepage");
    }
  }

  async function deleteLink(shortId: string) {
    try {
      await apiDeleteUrl(shortId);
      fetchLinks(); // Refresh the list after deletion
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to delete link.';
      setError(msg);
    }
  }

  useEffect(() => {
    fetchLinks();
  }, [token]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand-group">
          <span className="brand-mark">LX</span>
          <div>
            <p className="brand-name">LinkX</p>
            <p className="brand-tag">Smart URL Shortener</p>
          </div>
        </div>

        <nav className="site-nav">
          <a href="#shorten">Shorten</a>
          <Link to="/analytics">Analytics</Link>
          <a href="#how-it-works">How it works</a>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Make every link count</span>
            <h1>Beautiful short links for modern brands.</h1>
            <p>Transform long URLs into polished short links that look great, load fast, and are easy to share anywhere.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#shorten">Start now</a>
              <a className="secondary-action" href="#features">See features</a>
            </div>
          </div>

          <div className="hero-card" id="shorten">
            <div className="card-topper">
              <div>
                <p className="card-title">Shorten your URL</p>
                <p className="card-subtitle">Paste a link and create a shareable short URL instantly.</p>
              </div>
              <span className="card-badge">Fast &amp; responsive</span>
            </div>

            <form className="shortener-form" onSubmit={shorten}>
              <label htmlFor="url-input">Long URL</label>
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/your/long/link"
                required
              />

              <label htmlFor="alias-input">Custom alias (optional)</label>
              <input
                id="alias-input"
                type="text"
                value={customAlias}
                onChange={e => setCustomAlias(e.target.value)}
                placeholder="brand-link"
              />

              <button type="submit" disabled={loading}>
                {loading ? 'Creating link...' : 'Generate short link'}
              </button>
            </form>

            {short && (
              <div className="result-block">
                <div className="result-header">
                  <p>Your short link</p>
                  <button className="copy-button" onClick={() => handleCopy('new-link', short)} type="button">
                    {copiedId === 'new-link' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <a href={short} target="_blank" rel="noreferrer">{short}</a>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}
          </div>
        </section>

        <section className="feature-section" id="features">
          <h2>Recent Links</h2>
          <div className="links-list">
            {links.length > 0 ? (
              links.map((link) => (
                <div key={link.shortId} className="link-item">
                  <div className="link-info">
                    <a href={`${shortUrlBase}/${link.shortId}`} target="_blank" rel="noopener noreferrer" className="link-short">
                      {`${shortUrlBase.replace(/^https?:\/\//, '')}/${link.shortId}`}
                    </a>
                    <p className="link-original">{link.originalUrl}</p>
                  </div>
                  <div className="link-actions">
                    <button className="link-copy" onClick={() => handleCopy(link.shortId, `${shortUrlBase}/${link.shortId}`)} title="Copy short URL">
                      {copiedId === link.shortId ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
                    </button>
                    <span className="link-clicks">{link.clicks || 0} clicks</span>
                    <button className="link-delete" onClick={() => deleteLink(link.shortId)}>
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No links created yet. Use the form above to create one!</p>
            )}
          </div>
        </section>

        <section className="feature-section" id="features">
          <h2>Why choose LinkX?</h2>
          <div className="feature-grid">
            <article>
              <h3>Modern design</h3>
              <p>A sleek interface with professional styles that look great on every screen.</p>
            </article>
            <article>
              <h3>Custom aliases</h3>
              <p>Create short, memorable links for campaigns, social, and branding.</p>
            </article>
            <article>
              <h3>Fast redirects</h3>
              <p>Backend optimized for quick URL resolution and low latency.</p>
            </article>
            <article>
              <h3>Link Management</h3>
              <p>Easily manage your created links, including deleting them when no longer needed.</p>
            </article>
            <article>
              <h3>Responsive layout</h3>
              <p>Looks perfect on desktop, tablet, and mobile devices.</p>
            </article>
          </div>
        </section>

        <section className="how-it-works" id="how-it-works">
          <h2>How it works</h2>
          <div className="steps-grid">
            <div>
              <span>1</span>
              <p>Paste your original URL and choose a custom alias.</p>
            </div>
            <div>
              <span>2</span>
              <p>Generate the short link and copy it with one click.</p>
            </div>
            <div>
              <span>3</span>
              <p>Share the link and enjoy fast redirects for every visitor.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
