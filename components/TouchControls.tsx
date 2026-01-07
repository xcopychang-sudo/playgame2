import React from 'react';
import { ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

interface TouchControlsProps {
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onShootStart: () => void;
  onShootEnd: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onLeftStart,
  onLeftEnd,
  onRightStart,
  onRightEnd,
  onShootStart,
  onShootEnd,
}) => {
  return (
    <div className="absolute bottom-4 left-0 right-0 px-6 pb-2 flex justify-between items-end z-20 pointer-events-none select-none">
      {/* Directional Pad */}
      <div className="flex gap-4 pointer-events-auto">
        <button
          className="w-20 h-20 rounded-full bg-cyan-900/50 border-2 border-cyan-500/50 backdrop-blur-sm flex items-center justify-center active:bg-cyan-500/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]"
          onTouchStart={(e) => { e.preventDefault(); onLeftStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onLeftEnd(); }}
          onMouseDown={onLeftStart}
          onMouseUp={onLeftEnd}
          onMouseLeave={onLeftEnd}
          aria-label="Move Left"
        >
          <ChevronLeft className="w-10 h-10 text-cyan-300" />
        </button>
        <button
          className="w-20 h-20 rounded-full bg-cyan-900/50 border-2 border-cyan-500/50 backdrop-blur-sm flex items-center justify-center active:bg-cyan-500/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]"
          onTouchStart={(e) => { e.preventDefault(); onRightStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onRightEnd(); }}
          onMouseDown={onRightStart}
          onMouseUp={onRightEnd}
          onMouseLeave={onRightEnd}
          aria-label="Move Right"
        >
          <ChevronRight className="w-10 h-10 text-cyan-300" />
        </button>
      </div>

      {/* Action Button */}
      <div className="pointer-events-auto">
        <button
          className="w-24 h-24 rounded-full bg-pink-900/50 border-2 border-pink-500/50 backdrop-blur-sm flex items-center justify-center active:bg-pink-500/40 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,0,255,0.3)]"
          onTouchStart={(e) => { e.preventDefault(); onShootStart(); }}
          onTouchEnd={(e) => { e.preventDefault(); onShootEnd(); }}
          onMouseDown={onShootStart}
          onMouseUp={onShootEnd}
          onMouseLeave={onShootEnd}
          aria-label="Fire"
        >
          <Crosshair className="w-12 h-12 text-pink-300" />
        </button>
      </div>
    </div>
  );
};
