import { useState } from 'react'
import QrCode from './QrCode'

export default function HistoryCard({ item }) {
  const [showQr, setShowQr] = useState(false)
  const short = `${window.location.origin}/${item.shortId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(short)
      alert('Copied short link')
    } catch (e) {
      const el = document.createElement('textarea')
      el.value = short
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
      alert('Copied short link')
    }
  }

  return (
    <div className="history-card">
      <p className="history-title">{item.originalUrl}</p>
      <p className="history-meta"><a href={short} target="_blank" rel="noreferrer">{short}</a> · {item.clicks || 0} clicks</p>
      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="copy-button small" onClick={handleCopy}>Copy</button>
        <a className="nav-button small" href={short} target="_blank" rel="noreferrer">Open</a>
        <button className="nav-button small" onClick={() => setShowQr(s => !s)}>{showQr ? 'Hide QR' : 'QR'}</button>
      </div>

      {showQr && (
        <div style={{ marginTop: 10 }}>
          <QrCode value={short} size={160} />
        </div>
      )}
    </div>
  )
}
