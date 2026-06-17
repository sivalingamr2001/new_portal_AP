import { useState, useEffect } from "react";

export function LiveSystemClock() {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const dateString = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });

      const timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });

      setCurrentDate(dateString);
      setCurrentTime(timeString);
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex items-center gap-2.5 font-mono text-xs whitespace-nowrap">
      <span className="font-bold text-foreground tracking-tight">
        {currentDate || "17 Jun 2026"}
      </span>
      <span className="text-border text-sm font-light select-none">|</span>
      <span className="text-sky-600 dark:text-sky-400 font-semibold tracking-wide">
        {currentTime || "00:00:00 AM"}
      </span>
    </div>
  );
}
