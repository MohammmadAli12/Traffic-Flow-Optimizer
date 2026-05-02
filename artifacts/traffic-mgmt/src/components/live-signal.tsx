import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SignalPhase = "green" | "yellow" | "red";

interface LiveSignalProps {
  greenDuration: number;
  redDuration: number;
  initialState: "green" | "red" | "yellow";
  roadName: string;
  direction: string;
  carCount: number;
}

export function LiveSignal({
  greenDuration,
  redDuration,
  initialState,
  roadName,
  direction,
  carCount,
}: LiveSignalProps) {
  const YELLOW_DURATION = 3;

  // Derive initial phase timing
  function getInitialPhase(): { phase: SignalPhase; remaining: number } {
    if (initialState === "green") return { phase: "green", remaining: greenDuration };
    if (initialState === "yellow") return { phase: "yellow", remaining: YELLOW_DURATION };
    return { phase: "red", remaining: Math.max(1, redDuration - YELLOW_DURATION) };
  }

  const [phase, setPhase] = useState<SignalPhase>(getInitialPhase().phase);
  const [remaining, setRemaining] = useState(getInitialPhase().remaining);
  const phaseRef = useRef(phase);
  const remainingRef = useRef(remaining);

  // Sync refs
  phaseRef.current = phase;
  remainingRef.current = remaining;

  // Reset when durations change (e.g. after car count update)
  useEffect(() => {
    const init = getInitialPhase();
    setPhase(init.phase);
    setRemaining(init.remaining);
  }, [greenDuration, redDuration, initialState]);

  // Countdown tick
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // Advance phase
          setPhase((currentPhase) => {
            if (currentPhase === "green") {
              setTimeout(() => setRemaining(YELLOW_DURATION), 0);
              return "yellow";
            }
            if (currentPhase === "yellow") {
              setTimeout(() => setRemaining(Math.max(1, redDuration - YELLOW_DURATION)), 0);
              return "red";
            }
            // red → green
            setTimeout(() => setRemaining(greenDuration), 0);
            return "green";
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [greenDuration, redDuration]);

  const totalDuration =
    phase === "green" ? greenDuration : phase === "yellow" ? YELLOW_DURATION : Math.max(1, redDuration - YELLOW_DURATION);

  const progress = remaining / totalDuration;

  const phaseColor = {
    green: "bg-emerald-500",
    yellow: "bg-yellow-400",
    red: "bg-red-500",
  }[phase];

  const glowColor = {
    green: "shadow-[0_0_18px_rgba(16,185,129,0.85)]",
    yellow: "shadow-[0_0_18px_rgba(234,179,8,0.85)]",
    red: "shadow-[0_0_18px_rgba(239,68,68,0.85)]",
  }[phase];

  const phaseLabel = {
    green: "GO",
    yellow: "CAUTION",
    red: "STOP",
  }[phase];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/20 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5">
            {direction}
          </span>
          <span className="text-sm font-bold truncate">{roadName}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{carCount} cars</span>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Traffic light housing */}
          <div className="flex flex-col items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-3 shrink-0">
            <div
              className={`w-7 h-7 rounded-full transition-all duration-300 ${
                phase === "red" ? `bg-red-500 ${glowColor}` : "bg-red-950"
              }`}
            />
            <div
              className={`w-7 h-7 rounded-full transition-all duration-300 ${
                phase === "yellow" ? `bg-yellow-400 ${glowColor}` : "bg-yellow-950"
              }`}
            />
            <div
              className={`w-7 h-7 rounded-full transition-all duration-300 ${
                phase === "green" ? `bg-emerald-500 ${glowColor}` : "bg-emerald-950"
              }`}
            />
          </div>

          {/* Right side: phase label + countdown + progress */}
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex items-baseline justify-between">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className={`text-xs font-black uppercase tracking-widest ${
                    phase === "green"
                      ? "text-emerald-400"
                      : phase === "yellow"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {phaseLabel}
                </motion.span>
              </AnimatePresence>
              <span className="font-mono text-2xl font-black tabular-nums">
                {remaining}
                <span className="text-xs text-muted-foreground ml-0.5">s</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${phaseColor}`}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.9, ease: "linear" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="text-[10px] font-mono">
                <span className="text-muted-foreground">G </span>
                <span className="text-emerald-400 font-bold">{greenDuration}s</span>
              </div>
              <div className="text-[10px] font-mono text-right">
                <span className="text-muted-foreground">R </span>
                <span className="text-red-400 font-bold">{redDuration}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
