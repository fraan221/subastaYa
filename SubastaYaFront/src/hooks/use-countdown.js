import { useState, useEffect } from 'react'

/**
 * Calcula la diferencia temporal respecto a una fecha límite.
 * @param {string | Date} targetDate - Fecha límite UTC
 */
function calculateTimeRemaining(targetDate) {
  if (!targetDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true }
  }

  const target = new Date(targetDate).getTime()
  const now = Date.now()
  const diff = target - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true }
  }

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: false,
  }
}

/**
 * Hook reactivo para cuenta regresiva.
 * Se actualiza cada segundo y limpia su intervalo en el desmontaje.
 * @param {string | Date} targetDate
 */
export function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(targetDate))

  useEffect(() => {
    const intervalId = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate)
      setTimeLeft(remaining)

      if (remaining.isExpired) {
        clearInterval(intervalId)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [targetDate])

  return timeLeft
}
