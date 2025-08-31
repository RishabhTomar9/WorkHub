import React from 'react'


export default function RecentPayouts({ items = [] }) {
if (items.length === 0) return <div className="text-sm text-gray-500">No payouts yet</div>


return (
<ul className="space-y-3">
{items.map((it) => (
<li key={it._id} className="flex items-center justify-between">
<div>
<div className="text-sm font-medium">{it.workerName}</div>
<div className="text-xs text-gray-400">{it.siteName} • {new Date(it.date).toLocaleDateString()}</div>
</div>
<div className="text-sm font-semibold">₹{it.amount}</div>
</li>
))}
</ul>
)
}