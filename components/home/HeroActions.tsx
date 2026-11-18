'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroActionsProps {
  primaryText: string;
  primaryUrl: string;
  secondaryText: string;
  secondaryUrl: string;
  reducedMotion: boolean;
}

export function HeroActions({
  primaryText,
  primaryUrl,
  secondaryText,
  secondaryUrl,
  reducedMotion,
}: HeroActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-2 w-full sm:w-auto">
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      >
        <Button
          size="lg"
          asChild
          className="group relative w-full sm:w-auto min-h-12 px-7 shadow-[0_0_28px_-4px_color-mix(in_srgb,var(--accent-primary)_55%,transparent)] hover:shadow-[0_0_36px_-2px_color-mix(in_srgb,var(--accent-primary)_75%,transparent)] transition-shadow duration-200"
        >
          <Link href={primaryUrl} aria-label={primaryText}>
            <span>{primaryText}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.49 }}
        whileHover={reducedMotion ? undefined : { y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      >
        <Button
          size="lg"
          variant="secondary"
          asChild
          className="group w-full sm:w-auto min-h-12 px-7"
        >
          <Link href={secondaryUrl} aria-label={secondaryText}>
            <Waves className="h-4 w-4 text-accent-primary transition-transform duration-200 group-hover:scale-110" />
            <span>{secondaryText}</span>
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
