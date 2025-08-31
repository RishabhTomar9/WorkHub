import React from 'react'
import { motion } from 'framer-motion'


export default function KPICard({ title, value, hint }) {
return (
<motion.div
initial={{ opacity: 0, y: 6 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.35 }}
className="bg-white p-4 rounded-2xl shadow flex flex-col"
>
<div className="text-sm text-gray-500">{title}</div>
<div className="mt-2 text-2xl font-semibold">{value}</div>
{hint && <div className="text-xs text-gray-400 mt-2">{hint}</div>}
</motion.div>
)
}