import { useState } from 'react'
import CustomAlias from './CustomAlias'

export default function UrlForm({ onSubmit }) {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { url }
    if (alias.trim()) {
      payload.customAlias = alias.trim()
    }
    onSubmit(payload)
  }

  return (
    <form className="url-form" onSubmit={handleSubmit}>
      <label>Long URL</label>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" required />
      <CustomAlias value={alias} onChange={setAlias} />
      <button type="submit">Shorten URL</button>
    </form>
  )
}
