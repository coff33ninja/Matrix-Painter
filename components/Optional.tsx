
import React, { useEffect } from 'react';

interface OptionalProps {
  onDisplayTime: (time: string) => void;
  isClockActive: boolean;
  setIsClockActive: (active: boolean) => void;
}

const Optional: React.FC<OptionalProps> = ({ onDisplayTime, isClockActive, setIsClockActive }) => {
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Effect to auto-update the matrix when clock is active
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isClockActive) {
      intervalId = setInterval(() => {
        onDisplayTime(formatTime(new Date()));
      }, 1000); // Update every second
    }
    return () => clearInterval(intervalId);
  }, [isClockActive, onDisplayTime]);

  const handleDisplayClick = () => {
    setIsClockActive(true);
    onDisplayTime(formatTime(new Date()));
  };

  return (
    <div className="bg-gray-700/50 p-4 rounded-lg text-white">
      
      <span className="text-cyan-400 text-sm font-semibold mb-2 block">Optional</span>
      <button
        onClick={handleDisplayClick}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
      >
        Display Time on Matrix
      </button>
    </div>
  );
};

export default Optional;
