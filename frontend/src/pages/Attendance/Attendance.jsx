import React, { useState } from 'react'
import api from '../../api/axios'


export default function Attendance() {
const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
const [site, setSite] = useState('')


return (
<div>
<div className="flex items-center gap-3 mb-4">
<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 rounded border" />
<select value={site} onChange={(e) => setSite(e.target.value)} className="p-2 rounded border">
<option value="">Select site</option>
</select>
<button className="px-4 py-2 bg-primary text-white rounded">Load</button>
</div>


<div className="bg-white shadow rounded p-4">Attendance UI goes here (bulk actions, quick present/absent toggles)</div>
</div>
)
}