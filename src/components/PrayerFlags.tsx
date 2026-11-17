import React from 'react';

interface FlagData {
  color: string;
  borderColor: string;
  textColor: string;
  pattern: 'wheel' | 'knot' | 'sun' | 'lotus' | 'windhorse' | 'stupa' | 'star' | 'circle';
  tag: string;
}

const FLAGS: FlagData[] = [
  { color: 'bg-[#B49A69]', borderColor: 'border-[#967E50]', textColor: 'text-[#21352F]', pattern: 'sun', tag: 'Earth' },
  { color: 'bg-[#7899A8]', borderColor: 'border-[#5D7C8B]', textColor: 'text-[#F5F4EF]', pattern: 'circle', tag: 'Water' },
  { color: 'bg-[#F5F4EF]', borderColor: 'border-[#A5A49A]', textColor: 'text-[#21352F]', pattern: 'lotus', tag: 'Air' },
  { color: 'bg-[#945A52]', borderColor: 'border-[#77443D]', textColor: 'text-[#F5F4EF]', pattern: 'wheel', tag: 'Fire' },
  { color: 'bg-[#21352F]', borderColor: 'border-[#162521]', textColor: 'text-[#DCE5E5]', pattern: 'stupa', tag: 'Space' },
  { color: 'bg-[#B49A69]', borderColor: 'border-[#967E50]', textColor: 'text-[#21352F]', pattern: 'knot', tag: 'Earth' },
  { color: 'bg-[#7899A8]', borderColor: 'border-[#5D7C8B]', textColor: 'text-[#F5F4EF]', pattern: 'windhorse', tag: 'Water' },
  { color: 'bg-[#F5F4EF]', borderColor: 'border-[#A5A49A]', textColor: 'text-[#21352F]', pattern: 'star', tag: 'Air' },
  { color: 'bg-[#945A52]', borderColor: 'border-[#77443D]', textColor: 'text-[#F5F4EF]', pattern: 'star', tag: 'Fire' },
  { color: 'bg-[#21352F]', borderColor: 'border-[#162521]', textColor: 'text-[#DCE5E5]', pattern: 'circle', tag: 'Space' },
  { color: 'bg-[#B49A69]', borderColor: 'border-[#967E50]', textColor: 'text-[#21352F]', pattern: 'knot', tag: 'Earth' },
  { color: 'bg-[#7899A8]', borderColor: 'border-[#5D7C8B]', textColor: 'text-[#F5F4EF]', pattern: 'wheel', tag: 'Water' },
  { color: 'bg-[#F5F4EF]', borderColor: 'border-[#A5A49A]', textColor: 'text-[#21352F]', pattern: 'sun', tag: 'Air' },
  { color: 'bg-[#945A52]', borderColor: 'border-[#77443D]', textColor: 'text-[#F5F4EF]', pattern: 'circle', tag: 'Fire' },
  { color: 'bg-[#21352F]', borderColor: 'border-[#162521]', textColor: 'text-[#DCE5E5]', pattern: 'stupa', tag: 'Space' },
];

export const PrayerFlags: React.FC = () => {
  return (
    <div className="w-full relative overflow-hidden select-none py-1 pointer-events-none opacity-95">
      {/* Hanging rope cord */}
      <div className="absolute top-[8px] left-0 right-0 h-[2px] bg-[#A5A49A]/70 shadow-sm z-0">
        <svg className="w-full h-3 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1200 12">
          <path
            d="M0,4 Q300,10 600,6 Q900,11 1200,4"
            fill="none"
            stroke="#A5A49A"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>
      </div>

      {/* Flag garlands */}
      <div className="relative flex justify-between max-w-7xl mx-auto px-4 md:px-8 z-10">
        {FLAGS.map((flag, idx) => (
          <div
            key={idx}
            className={`relative flex flex-col items-center group transition-transform duration-700 ease-in-out hover:rotate-2 ${
              idx % 2 === 0 ? 'animate-flutter' : ''
            }`}
            style={{
              animationDelay: `${idx * 0.35}s`,
              transformOrigin: 'top center',
            }}
          >
            {/* Flag cloth */}
            <div
              className={`w-6 sm:w-8 md:w-11 lg:w-12 h-10 sm:h-12 md:h-14 lg:h-16 ${flag.color} border-t-2 border-x ${flag.borderColor} shadow-sm rounded-b-xs flex flex-col items-center justify-center p-0.5 sm:p-1 relative`}
              style={{
                boxShadow: '0 3px 6px -1px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Inner dashed sacred boundary */}
              <div className="w-full h-full border border-dashed border-black/20 flex flex-col items-center justify-center">
                {flag.pattern === 'sun' && (
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="2" />
                    <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                    <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
                {flag.pattern === 'circle' && (
                  <div className="w-3 h-3 rounded-full border border-current opacity-70 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-current" />
                  </div>
                )}
                {flag.pattern === 'lotus' && (
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 4c-3 5-3 10 0 15 3-5 3-10 0-15z" />
                    <path d="M12 19c-5-3-8-8-7-12 3 2 6 7 7 12z" />
                    <path d="M12 19c5-3 8-8 7-12-3 2-6 7-7 12z" />
                  </svg>
                )}
                {flag.pattern === 'wheel' && (
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="3" x2="12" y2="21" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                  </svg>
                )}
                {flag.pattern === 'stupa' && (
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12,2 4,14 20,14" />
                    <rect x="6" y="14" width="12" height="6" />
                  </svg>
                )}
                {flag.pattern === 'knot' && (
                  <div className="w-3 h-3 border border-current rotate-45 opacity-70 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 border border-current" />
                  </div>
                )}
                {flag.pattern === 'star' && (
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                  </svg>
                )}
                {flag.pattern === 'windhorse' && (
                  <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 18l4-8 5 2 3-6 4 2-3 8-6-1-3 5z" />
                  </svg>
                )}
              </div>

              {/* Little bottom fringe */}
              <div className="absolute -bottom-1 left-0 right-0 flex justify-around opacity-40">
                <span className="w-0.5 h-1 bg-current" />
                <span className="w-0.5 h-1.5 bg-current" />
                <span className="w-0.5 h-1 bg-current" />
                <span className="w-0.5 h-1.5 bg-current" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
