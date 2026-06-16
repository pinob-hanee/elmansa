import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'w-6 h-6',
  md: 'w-9 h-9',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function Logo({ className, size = 'md' }: LogoProps) {
  return (
    <div className={cn('relative flex items-center justify-center shrink-0', sizes[size], className)}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        {/* Base geometric shape (Dark Grey) */}
        <path d="M50 15 L85 35 L85 75 L50 95 L15 75 L15 35 Z" fill="#18181b" stroke="#27272a" strokeWidth="2" strokeLinejoin="round" />
        
        {/* Glowing Platform Plane (Emerald) */}
        <path d="M50 45 L85 65 L50 85 L15 65 Z" fill="#064e3b" />
        <path d="M50 45 L85 65 L50 85 L15 65 Z" fill="url(#emerald-glow)" opacity="0.9" />
        
        {/* Highlight edges */}
        <path d="M15 65 L50 85 L85 65" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
        <path d="M50 85 L50 95" stroke="#10b981" strokeWidth="2" opacity="0.5" strokeLinejoin="round" />
        
        {/* Code Symbol (Vibrant Green) */}
        <path 
          d="M38 45 L28 55 L38 65 M62 45 L72 55 L62 65 M48 70 L52 40" 
          stroke="#34d399" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
        />
        
        <defs>
          <radialGradient id="emerald-glow" cx="50" cy="65" r="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10b981" />
            <stop offset="1" stopColor="#064e3b" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
