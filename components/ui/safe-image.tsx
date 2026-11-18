'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Speaker } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority,
  sizes,
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface-secondary to-surface-card text-ink-secondary',
          fill ? 'absolute inset-0' : 'w-full h-full',
          className
        )}
      >
        <Speaker className="h-8 w-8 text-accent-primary/60" />
        <span className="text-xs tracking-wide text-ink-secondary/80 px-4 text-center line-clamp-1">{alt}</span>
      </div>
    );
  }

  const isLocalUpload = src.startsWith('/uploads/');
  if (isLocalUpload) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
        className={cn(fill ? 'absolute inset-0 h-full w-full' : '', className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width || 800 : undefined}
      height={!fill ? height || 600 : undefined}
      sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      priority={priority}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
