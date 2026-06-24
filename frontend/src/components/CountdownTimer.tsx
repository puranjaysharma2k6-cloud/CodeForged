import { useState, useEffect } from 'react'

interface CountdownTimerProps {
  targetDate: string    // ISO string of when contest starts
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now()

  if (diff <= 0) return null   // contest has started

  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    calculateTimeLeft(targetDate)
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(timer)   // cleanup on unmount
  }, [targetDate])

  if (!timeLeft) {
    return <span className="countdown-started">Starting now</span>
  }

  return (
    <div className="countdown">
      {timeLeft.days > 0 && (
        <span className="countdown-unit">
          <span className="countdown-value">{timeLeft.days}</span>
          <span className="countdown-label">d</span>
        </span>
      )}
      <span className="countdown-unit">
        <span className="countdown-value">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="countdown-label">h</span>
      </span>
      <span className="countdown-unit">
        <span className="countdown-value">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="countdown-label">m</span>
      </span>
      <span className="countdown-unit">
        <span className="countdown-value">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="countdown-label">s</span>
      </span>
    </div>
  )
}