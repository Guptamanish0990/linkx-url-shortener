export default function CustomAlias({ value, onChange }) {
  return (
    <div className="custom-alias-group">
      <label>Alias (optional)</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="my-short-link" />
    </div>
  )
}
