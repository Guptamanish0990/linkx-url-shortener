export default function AnalyticsCard({ stats }) {
  return (
    <div className="analytics-card">
      <p className="analytics-label">Total clicks</p>
      <p className="analytics-value">{stats.totalClicks}</p>
    </div>
  )
}
