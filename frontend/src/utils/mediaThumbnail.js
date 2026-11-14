/**
 * Video Thumbnail Generator (YouTube-style Random Frame Capture).
 *
 * Extracts a high-quality frame snapshot from a local video Blob or File
 * by seeking to a random percentage (between 15% and 75% of duration)
 * and drawing the video frame onto a canvas.
 */
export async function generateVideoThumbnail(videoBlobOrFile) {
  if (!videoBlobOrFile || typeof window === 'undefined') return null;

  // Verify file has a video MIME type or video extension
  const type = videoBlobOrFile.type || '';
  const name = videoBlobOrFile.name || '';
  const isVideo =
    type.startsWith('video') ||
    /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(name);

  if (!isVideo && type && !type.startsWith('application/octet-stream')) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url = URL.createObjectURL(videoBlobOrFile);
      video.src = url;

      let isResolved = false;
      const cleanup = () => {
        if (!isResolved) {
          isResolved = true;
          URL.revokeObjectURL(url);
          video.src = '';
          video.remove();
        }
      };

      // 6-second timeout safeguard
      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 6000);

      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
        // YouTube-style random timestamp: pick between 15% and 75% of duration
        const randomFraction = 0.15 + Math.random() * 0.6;
        const targetTime = Math.min(
          Math.max(duration * randomFraction, 0.5),
          Math.max(duration - 0.5, 0.5)
        );
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        try {
          clearTimeout(timeout);
          const canvas = document.createElement('canvas');
          const width = 320;
          const videoWidth = video.videoWidth || 320;
          const videoHeight = video.videoHeight || 180;
          const height = Math.round((videoHeight / videoWidth) * width) || 180;

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            cleanup();
            resolve(dataUrl);
            return;
          }
        } catch (canvasErr) {
          console.warn('Canvas thumbnail extraction notice:', canvasErr);
        }
        cleanup();
        resolve(null);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        cleanup();
        resolve(null);
      };
    } catch (err) {
      resolve(null);
    }
  });
}

