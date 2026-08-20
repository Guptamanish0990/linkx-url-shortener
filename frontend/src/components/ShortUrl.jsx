import { useState } from 'react'
import QrCode from './QrCode'

export default function ShortUrl({ link }) {
  const [showQr, setShowQr] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      alert('Copied short link to clipboard')
    } catch (e) {
      // fallback
      const el = document.createElement('textarea')
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
      alert('Copied short link to clipboard')
    }
  }

  return (
    <div className="short-url-card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="label">Short link created</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="copy-button" onClick={handleCopy}>Copy</button>
          <button className="nav-button small" onClick={() => setShowQr(s => !s)}>{showQr ? 'Hide QR' : 'QR'}</button>
        </div>
      </div>
      <a href={link} target="_blank" rel="noreferrer">{link}</a>
      {showQr && (
        <div style={{ marginTop: 12 }}>
          <QrCode value={link} />
        </div>
      )}
    </div>
  )
}
