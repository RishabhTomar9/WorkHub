export function computePayout({ wageType, wageRate, hoursWorked = 0, status = 'present' }) {
    if (status !== 'present') return 0
    if (wageType === 'daily') return wageRate
    return wageRate * hoursWorked
    }