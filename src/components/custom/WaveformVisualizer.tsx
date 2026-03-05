import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  isActive?: boolean;
  barCount?: number;
}

const WaveformVisualizer = ({ isActive = true, barCount = 40 }: WaveformVisualizerProps) => {
  const barsRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || !barsRef.current) return;
    const bars = barsRef.current.children;

    const animate = () => {
      phaseRef.current += 0.06;
      for (let i = 0; i < bars.length; i++) {
        const h = Math.sin(i * 0.4 + phaseRef.current) * 20 + 24;
        (bars[i] as HTMLElement).style.height = `${h}px`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, barCount]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={barsRef} className="flex items-end gap-[3px] h-16 w-60 will-change-transform">
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-primary opacity-70"
            style={{ height: 24 }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider">
          Agente in ascolto...
        </span>
      </div>
    </div>
  );
};

export default WaveformVisualizer;
