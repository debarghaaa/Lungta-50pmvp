import React from 'react';

export const MountainBackdrop: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#FFFFFF]">
      {/* Upper Khangchendzonga Atmospheric Photographic Backdrop */}
      <div
        className="relative w-full h-[460px] sm:h-[560px] lg:h-[640px] overflow-hidden"
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.98) 56%, rgba(0, 0, 0, 0.6) 80%, rgba(0, 0, 0, 0) 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.98) 56%, rgba(0, 0, 0, 0.6) 80%, rgba(0, 0, 0, 0) 100%)',
        }}
      >
        {/* Sharp upper layer showing Khangchendzonga clearly without distortion */}
        <img
          src="/assets/aistudio/WhatsApp_Image_2026-09-11_at_23.25.13_badbcd7a.jpeg"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-[50%_82%] opacity-100"
        />

        {/* Progressively blurred mid-to-lower atmospheric layer */}
        <img
          src="/assets/aistudio/WhatsApp_Image_2026-09-11_at_23.25.13_badbcd7a.jpeg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[50%_82%] blur-md scale-[1.02] opacity-85"
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0, 0, 0, 0) 46%, rgba(0, 0, 0, 0.72) 72%, rgba(0, 0, 0, 1) 90%)',
            maskImage:
              'linear-gradient(to bottom, rgba(0, 0, 0, 0) 46%, rgba(0, 0, 0, 0.72) 72%, rgba(0, 0, 0, 1) 90%)',
          }}
        />

        {/* Deepest soft-focus dissolve layer toward the lower transition */}
        <img
          src="/assets/aistudio/WhatsApp_Image_2026-09-11_at_23.25.13_badbcd7a.jpeg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[50%_82%] blur-2xl scale-[1.04] opacity-95"
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.88) 84%, rgba(0, 0, 0, 1) 100%)',
            maskImage:
              'linear-gradient(to bottom, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.88) 84%, rgba(0, 0, 0, 1) 100%)',
          }}
        />

        {/* Minimal tonal veil to preserve dark Yale Blue / Graphite text contrast while keeping the mountain clear, dissolving into #FFFFFF below */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.06) 35%, rgba(217, 217, 217, 0.14) 64%, rgba(255, 255, 255, 0.80) 86%, rgba(255, 255, 255, 1) 100%)',
          }}
        />
      </div>
    </div>
  );
};
