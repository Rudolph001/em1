import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
}

export function CountdownTimer({ targetDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onComplete) {
          onComplete();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className="flex items-center space-x-2">
      <div className="text-center">
        <div className="text-2xl font-bold text-secondary font-roboto-mono">
          {timeLeft.days}
        </div>
        <div className="text-xs text-gray-500">Days</div>
      </div>
      <div className="text-secondary">:</div>
      <div className="text-center">
        <div className="text-2xl font-bold text-secondary font-roboto-mono">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-500">Hours</div>
      </div>
      <div className="text-secondary">:</div>
      <div className="text-center">
        <div className="text-2xl font-bold text-secondary font-roboto-mono">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-500">Minutes</div>
      </div>
      <div className="text-secondary">:</div>
      <div className="text-center">
        <div className="text-2xl font-bold text-secondary font-roboto-mono">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-500">Seconds</div>
      </div>
    </div>
  );
}
