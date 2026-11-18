'use client';

interface SoundWaveAnimationProps {
  reducedMotion?: boolean;
}

const WAVE_RINGS = [
  { delay: '0s', inset: 'inset-6 sm:inset-4', borderOpacity: 'opacity-45' },
  { delay: '1.6s', inset: 'inset-6 sm:inset-4', borderOpacity: 'opacity-40' },
  { delay: '3.2s', inset: 'inset-6 sm:inset-4', borderOpacity: 'opacity-35', desktopOnly: true },
];

export function SoundWaveAnimation({ reducedMotion = false }: SoundWaveAnimationProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
    >
      {/* Static calibrated acoustic reference rings */}
      <div
        className="absolute h-[280px] w-[280px] sm:h-[380px] sm:w-[380px] lg:h-[440px] lg:w-[440px] rounded-full border border-accent-primary/20 dark:border-accent-primary/25"
      />
      <div
        className="hidden sm:block absolute h-[450px] w-[450px] lg:h-[530px] lg:w-[530px] rounded-full border border-accent-secondary/15 dark:border-accent-secondary/20"
      />

      {/* Expanding acoustic pulse rings */}
      {!reducedMotion && (
        <div className="relative h-[280px] w-[280px] sm:h-[360px] sm:w-[360px] lg:h-[420px] lg:w-[420px]">
          {WAVE_RINGS.map((ring, idx) => (
            <span
              key={idx}
              style={{ animationDelay: ring.delay }}
              className={`hero-wave-ring absolute ${ring.inset} rounded-full border border-accent-primary/35 dark:border-accent-primary/45 ${ring.borderOpacity} ${
                ring.desktopOnly ? 'hidden sm:block' : ''
              }`}
            />
          ))}
        </div>
      )}

      {/* Subtle symmetric harmonic arc lines behind the tweeter/waveguide */}
      <svg
        viewBox="0 0 400 400"
        className="hidden md:block absolute h-[420px] w-[420px] lg:h-[490px] lg:w-[490px] text-accent-primary/20 dark:text-accent-primary/25"
        fill="none"
      >
        <path
          d="M 65 130 A 160 160 0 0 0 65 270"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
        <path
          d="M 335 130 A 160 160 0 0 1 335 270"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="4 6"
        />
      </svg>
    </div>
  );
}
