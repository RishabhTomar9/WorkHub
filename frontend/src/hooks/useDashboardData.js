import { useEffect, useState, useCallback } from 'react'
import axiosInstance from '../api/axios'


export default function useDashboardData() {
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)


const fetchData = useCallback(async () => {
setLoading(true)
setError(null)
try {
const res = await axiosInstance.get('/reports/dashboard')
// expected res.data shape: { workersToday, absentToday, payoutToday, sitesActive, payoutsLast7, recentPayouts }
setData(res.data)
} catch (err) {
setError(err?.message || err)
} finally {
setLoading(false)
}
}, [])


useEffect(() => {
fetchData()
}, [fetchData])


return { data, loading, error, refresh: fetchData }
}