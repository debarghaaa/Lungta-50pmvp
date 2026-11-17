import React, { useEffect, useRef, useState } from 'react';

type MotionCssModule = Record<string, string>;

let cachedMotionStyles: MotionCssModule | null = null;

// Preload the isolated CSS Module in browser environments only so Node/SSR test runners without a CSS loader remain compatible.
const motionStylesPromise: Promise<MotionCssModule | null> | null =
  typeof document !== 'undefined'
    ? import('./ActivityCardsMotion.module.css')
        .then((mod) => {
          cachedMotionStyles = mod.default;
          return cachedMotionStyles;
        })
        .catch(() => null)
    : null;

interface ActivityCardsMotionProps {
  primaryCard: React.ReactNode;
  companionCards: Array<{
    id: string;
    ariaLabel: string;
    node: React.ReactNode;
  }>;
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const ActivityCardsMotion: React.FC<ActivityCardsMotionProps> = ({
  primaryCard,
  companionCards,
}) => {
  const [styles, setStyles] = useState<MotionCssModule>(() => cachedMotionStyles ?? {});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    getPrefersReducedMotion()
  );
  const [hasEntered, setHasEntered] = useState<boolean>(() => getPrefersReducedMotion());
  const [activeCompanionIndex, setActiveCompanionIndex] = useState<number | null>(null);
  const [focusedCompanionIndex, setFocusedCompanionIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dialogRafRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    if (!cachedMotionStyles && motionStylesPromise) {
      motionStylesPromise.then((loaded) => {
        if (active && loaded) {
          setStyles(loaded);
        }
      });
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setHasEntered(true);
      return () => {
        active = false;
      };
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
      if (event.matches) {
        setHasEntered(true);
        setActiveCompanionIndex(null);
        setFocusedCompanionIndex(null);
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Ensure settled state is reached even if animation events are skipped
    const settleTimer = window.setTimeout(() => {
      setHasEntered(true);
    }, 950);

    return () => {
      active = false;
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.clearTimeout(settleTimer);
      if (dialogRafRef.current !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(dialogRafRef.current);
      }
    };
  }, []);

  const hasOpenDialog = (): boolean => {
    if (!gridRef.current) return false;
    return Boolean(gridRef.current.querySelector('[role="dialog"]'));
  };

  const handleInteractionCheck = () => {
    if (typeof requestAnimationFrame !== 'function') return;
    if (dialogRafRef.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(dialogRafRef.current);
    }
    dialogRafRef.current = requestAnimationFrame(() => {
      dialogRafRef.current = null;
      if (hasOpenDialog()) {
        setActiveCompanionIndex(null);
        setFocusedCompanionIndex(null);
      }
    });
  };

  const emphasizedIndex =
    prefersReducedMotion ? null : (focusedCompanionIndex ?? activeCompanionIndex);

  const companionEnterClasses = [
    styles.companionEnter0 ?? '',
    styles.companionEnter1 ?? '',
    styles.companionEnter2 ?? '',
  ];

  const primaryAnimClass =
    !prefersReducedMotion && !hasEntered && styles.primarySlotEnter
      ? styles.primarySlotEnter
      : '';

  return (
    <div className={styles.motionSection || 'space-y-8 sm:space-y-10'}>
      {/* 1. BREATHING — Large Primary Card */}
      <section
        id="section-breathing"
        aria-label="Breathing Practice"
        className={`${styles.primarySlot ?? ''} ${primaryAnimClass}`.trim()}
      >
        {primaryCard}
      </section>

      {/* 2, 3, 4: The 3 Companion Cards in preserved 3-column grid */}
      <div
        ref={gridRef}
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch ${
          styles.companionGridTrack ?? ''
        }`.trim()}
      >
        {companionCards.map((card, index) => {
          const isEmphasized = emphasizedIndex === index;
          const isReceded = emphasizedIndex !== null && emphasizedIndex !== index;
          const enterClass =
            !prefersReducedMotion && !hasEntered
              ? companionEnterClasses[index] ?? styles.companionEnter2 ?? ''
              : styles.companionSlotSettled ?? '';

          const stateClass = isEmphasized
            ? styles.companionActive ?? ''
            : isReceded
              ? styles.companionReceded ?? ''
              : '';

          return (
            <section
              key={card.id}
              id={card.id}
              aria-label={card.ariaLabel}
              className={`flex ${styles.companionSlot ?? ''} ${enterClass} ${stateClass}`.trim()}
              onPointerEnter={(event) => {
                if (prefersReducedMotion || event.pointerType === 'touch' || hasOpenDialog()) {
                  return;
                }
                setActiveCompanionIndex(index);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'touch') return;
                setActiveCompanionIndex((prev) => (prev === index ? null : prev));
              }}
              onFocusCapture={() => {
                if (prefersReducedMotion || hasOpenDialog()) return;
                setFocusedCompanionIndex(index);
              }}
              onBlurCapture={(event) => {
                const nextFocused = event.relatedTarget as Node | null;
                if (!nextFocused || !event.currentTarget.contains(nextFocused)) {
                  setFocusedCompanionIndex((prev) => (prev === index ? null : prev));
                }
              }}
              onClickCapture={handleInteractionCheck}
              onAnimationEnd={() => {
                if (index === companionCards.length - 1) {
                  setHasEntered(true);
                }
              }}
            >
              {card.node}
            </section>
          );
        })}
      </div>
    </div>
  );
};
