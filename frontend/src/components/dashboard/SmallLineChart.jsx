import React from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts'


export default function SmallLineChart({ data = [] }) {
// expected data: [{ date: '2025-08-25', value: 1200 }, ...]


const formatted = data.map((d) => ({ ...d, value: Number(d.value) }))


return (
<div style={{ width: '100%', height: 200 }}>
<ResponsiveContainer>
<AreaChart data={formatted} margin={{ top: 6, right: 12, left: 0, bottom: 6 }}>
<XAxis dataKey="date" tick={{ fontSize: 12 }} />
<Tooltip formatter={(v) => `₹${v}`} />
<Area type="monotone" dataKey="value" stroke="#06b6d4" fillOpacity={0.12} fill="#06b6d4" />
</AreaChart>
</ResponsiveContainer>
</div>
)
}