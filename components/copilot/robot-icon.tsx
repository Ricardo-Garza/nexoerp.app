import { cn } from "@/lib/utils"

/**
 * Robot de Nexo Intelligence. SVG propio (cabeza, visor, antena) con un parpadeo muy sutil
 * que solo se activa al pasar el cursor y se apaga con prefers-reduced-motion.
 */
export function RobotIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("h-7 w-7", className)}>
      <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="3" r="1.8" fill="currentColor" />
      <rect x="5" y="7" width="22" height="17" rx="6" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9" y="12" width="14" height="7" rx="3.5" fill="currentColor" fillOpacity="0.22" />
      <g className="origin-center motion-safe:group-hover/robot:animate-[robot-blink_1.1s_ease-in-out_1]">
        <circle cx="13" cy="15.5" r="1.7" fill="currentColor" />
        <circle cx="19" cy="15.5" r="1.7" fill="currentColor" />
      </g>
      <path d="M3 14v4M29 14v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 27h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
