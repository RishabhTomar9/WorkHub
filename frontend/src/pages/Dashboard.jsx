import React, { Suspense } from 'react'
import { motion } from 'framer-motion'
import KPICard from '../components/dashboard/KPICard'
import SmallLineChart from '../components/dashboard/SmallLineChart'
import RecentPayouts from '../components/dashboard/RecentPayouts'
import useDashboardData from '../hooks/useDashboardData'


export default function Dashboard() {
const { data, loading, error, refresh } = useDashboardData()


return (
<div className="space-y-6">
<div className="flex items-center justify-between">
<h1 className="text-2xl sm:text-3xl font-semibold">Dashboard</h1>
<div className="flex items-center gap-3">
<button
className="px-3 py-1 rounded border hover:bg-gray-50"
onClick={refresh}
aria-label="Refresh dashboard"
>
Refresh
</button>
</div>
</div>


<Suspense fallback={<div className="p-6 bg-white rounded shadow">Loading dashboard...</div>}>
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<KPICard title="Workers Today" value={loading ? '—' : data?.workersToday ?? 0} />
<KPICard title="Absent Today" value={loading ? '—' : data?.absentToday ?? 0} />
<KPICard title="Total Payout (Today)" value={loading ? '—' : `₹${data?.payoutToday ?? 0}`} />
<KPICard title="Active Sites" value={loading ? '—' : data?.sitesActive ?? 0} />
</section>


<section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
<div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow">
<h2 className="text-lg font-medium mb-3">Payouts — Last 7 days</h2>
<SmallLineChart data={data?.payoutsLast7 ?? []} />
</div>


<div className="bg-white rounded-2xl p-4 shadow">
<h2 className="text-lg font-medium mb-3">Recent Payouts</h2>
<RecentPayouts items={data?.recentPayouts ?? []} />
</div>
</section>
</Suspense>


{error && <div className="text-red-600">Failed to load dashboard: {String(error)}</div>}
</div>
)
}