"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

export default function TimeCard() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="glass-panel p-4 animate-pulse h-[80px]" />;

  return (
    <div className="glass-panel p-4 flex items-center justify-between border border-white/20">
      <div className="flex items-center gap-3">
        <div className="p-2 border border-white/30 rounded-none bg-white/5">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] text-white/50 uppercase tracking-[0.2em]">CURRENT UTC TIME</p>
          <p className="font-heading text-lg font-bold text-white tracking-widest mt-1">
            {format(time, "yyyy-MM-dd HH:mm:ss")} UTC
          </p>
        </div>
      </div>
    </div>
  );
}
