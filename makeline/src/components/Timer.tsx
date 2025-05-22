import React, { useState, useEffect } from 'react';
import './Timer.css';

interface TimerProps {
  lastCompletionTime: number | null; // Timestamp of last order completion
  targetTime?: number; // Target time in seconds (default: 180 = 3 minutes)
}

const Timer: React.FC<TimerProps> = ({ lastCompletionTime, targetTime = 180 }) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  useEffect(() => {
    // Reset timer when lastCompletionTime changes
    if (lastCompletionTime === null) {
      setElapsedTime(0);
      return;
    }
    
    const calculateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastCompletionTime) / 1000); // Convert to seconds
      setElapsedTime(elapsed);
    };
    
    // Calculate immediately
    calculateElapsed();
    
    // Then update every second
    const intervalId = setInterval(calculateElapsed, 1000);
    
    // Clean up interval on unmount or when lastCompletionTime changes
    return () => clearInterval(intervalId);
  }, [lastCompletionTime]);
  
  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Determine timer status based on elapsed time vs target
  const getTimerStatus = (): string => {
    if (elapsedTime < targetTime * 0.5) return 'good';
    if (elapsedTime < targetTime * 0.8) return 'warning';
    return 'critical';
  };
  
  // If no completion time exists yet, show standby message
  if (!lastCompletionTime) {
    return (
      <div className="timer timer-standby">
        <div className="timer-label">Ready</div>
        <div className="timer-display">00:00</div>
      </div>
    );
  }
  
  return (
    <div className={`timer timer-${getTimerStatus()}`}>
      <div className="timer-label">Since Last Order</div>
      <div className="timer-display">{formatTime(elapsedTime)}</div>
      {getTimerStatus() === 'critical' && 
        <div className="timer-alert">Order taking too long!</div>
      }
    </div>
  );
};

export default Timer; 