import React, { useState, useEffect } from 'react';
import { Video, FileAudio, Play } from 'lucide-react';
import { storageService } from '../../database/storage.service';
import { dataRepository } from '../../database/data.repository';
import { generateVideoThumbnail } from '../../utils/mediaThumbnail';
import { cn } from '../../utils/cn';

/**
 * Coastal Navy Media Thumbnail Component.
 * Displays video snapshot thumbnails (captured at a random timestamp, YouTube-style)
 * or falls back to themed video/audio icons. Automatically retrieves and generates
 * missing thumbnails from local OPFS video storage if available.
 */
export default function MediaThumbnail({
  analysis,
  size = 'md',
  className = '',
  showPlayBadge = true,
}) {
  const isVideo = analysis?.mediaType === 'video';
  const [thumbSrc, setThumbSrc] = useState(analysis?.thumbnail || null);
  const [hasError, setHasError] = useState(false);

  // Sync if analysis prop updates
  useEffect(() => {
    if (analysis?.thumbnail) {
      setThumbSrc(analysis.thumbnail);
    }
  }, [analysis?.thumbnail]);

  // Lazy-generate thumbnail from OPFS if not yet cached
  useEffect(() => {
    let isCancelled = false;

    if (isVideo && !thumbSrc && !hasError && analysis?.mediaFileId && analysis?.workspaceId) {
      async function extractFromOPFS() {
        try {
          if (!storageService.isAvailable()) return;
          const blob = await storageService.getMedia(analysis.workspaceId, analysis.mediaFileId);
          if (!blob || isCancelled) return;

          const generated = await generateVideoThumbnail(blob);
          if (generated && !isCancelled) {
            setThumbSrc(generated);
            // Cache in Dexie record so next time it is instantaneous
            try {
              await dataRepository.updateAnalysis(analysis.id, analysis.workspaceId, {
                thumbnail: generated,
              });
            } catch (updateErr) {
              // Non-critical cache error
            }
          }
        } catch (err) {
          if (!isCancelled) setHasError(true);
        }
      }

      extractFromOPFS();
    }

    return () => {
      isCancelled = true;
    };
  }, [isVideo, thumbSrc, hasError, analysis?.id, analysis?.mediaFileId, analysis?.workspaceId]);

  const sizeClasses = {
    sm: 'w-14 h-10 sm:w-16 sm:h-11 rounded-lg text-xs',
    md: 'w-24 h-16 sm:w-28 sm:h-18 rounded-xl text-sm',
    lg: 'w-36 h-24 sm:w-40 sm:h-26 rounded-2xl text-base',
  }[size] || 'w-24 h-16 sm:w-28 sm:h-18 rounded-xl text-sm';

  const iconSizes = {
    sm: 'w-4.5 h-4.5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size] || 'w-6 h-6';

  if (isVideo && thumbSrc && !hasError) {
    return (
      <div
        className={cn(
          'relative overflow-hidden shrink-0 border border-slate-200/90 dark:border-navy-700 bg-navy-950 shadow-2xs group-hover:border-ocean-400 dark:group-hover:border-navy-600 transition-colors',
          sizeClasses,
          className
        )}
      >
        <img
          src={thumbSrc}
          alt={analysis?.title || 'Video preview'}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={() => setHasError(true)}
          loading="lazy"
        />
        {showPlayBadge && (
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-navy-950/75 backdrop-blur-xs text-white flex items-center justify-center shadow-sm">
              <Play className="w-3 h-3 fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Audio or Fallback Icon Badge
  return (
    <div
      className={cn(
        'rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/70 dark:border-navy-700 group-hover:border-ocean-300 dark:group-hover:border-navy-600 transition-colors shadow-2xs',
        sizeClasses,
        className
      )}
    >
      {isVideo ? (
        <Video className={cn(iconSizes, 'text-ocean-600 dark:text-ocean-400')} />
      ) : (
        <FileAudio className={cn(iconSizes, 'text-ocean-600 dark:text-ocean-400')} />
      )}
    </div>
  );
}

