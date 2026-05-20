const HIGH_EFFICIENCY_IMAGE_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  ...HIGH_EFFICIENCY_IMAGE_TYPES,
]);

const NORMALIZED_IMAGE_MAX_DIMENSION = 1600;
const NORMALIZED_IMAGE_QUALITY = 0.9;
const NORMALIZED_IMAGE_SIZE_THRESHOLD_BYTES = 2 * 1024 * 1024;

export function isHighEfficiencyImageFile(file: File) {
  return HIGH_EFFICIENCY_IMAGE_TYPES.has(file.type) || /\.(heic|heif)$/i.test(file.name);
}

export function isSupportedImageFile(file: File) {
  if (SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return true;
  }

  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

export async function convertHighEfficiencyImageToJpeg(file: File) {
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });

  const convertedBlob = Array.isArray(converted) ? converted[0] : converted;

  if (!(convertedBlob instanceof Blob)) {
    throw new Error('이미지 변환 결과를 처리하지 못했어요.');
  }

  const nextName = /\.(heic|heif)$/i.test(file.name)
    ? file.name.replace(/\.(heic|heif)$/i, '.jpg')
    : `${file.name}.jpg`;

  return new File([convertedBlob], nextName, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}

function getNormalizedJpegFileName(fileName: string) {
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(fileName)
    ? fileName.replace(/\.(jpe?g|png|webp|heic|heif)$/i, '.jpg')
    : `${fileName}.jpg`;
}

function getNormalizedImageDimensions(width: number, height: number) {
  const longestSide = Math.max(width, height);

  if (longestSide <= NORMALIZED_IMAGE_MAX_DIMENSION) {
    return { width, height };
  }

  const scale = NORMALIZED_IMAGE_MAX_DIMENSION / longestSide;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('이미지 압축 결과를 생성하지 못했어요.'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      NORMALIZED_IMAGE_QUALITY,
    );
  });
}

async function createCanvasImageSource(blob: Blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, {
        imageOrientation: 'from-image',
      });

      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (context: CanvasRenderingContext2D, width: number, height: number) => {
          context.drawImage(bitmap, 0, 0, width, height);
        },
        cleanup: () => {
          bitmap.close();
        },
      };
    } catch {
      // Fall back to HTMLImageElement when createImageBitmap is unavailable or rejects the file.
    }
  }

  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('이미지를 읽지 못했어요.'));
      nextImage.src = objectUrl;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (context: CanvasRenderingContext2D, width: number, height: number) => {
        context.drawImage(image, 0, 0, width, height);
      },
      cleanup: () => {
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function reencodeImageAsNormalizedJpeg(file: File) {
  const imageSource = await createCanvasImageSource(file);

  try {
    const { width, height } = getNormalizedImageDimensions(imageSource.width, imageSource.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('이미지 캔버스를 준비하지 못했어요.');
    }

    imageSource.draw(context, width, height);

    return canvasToJpegBlob(canvas);
  } finally {
    imageSource.cleanup();
  }
}

export async function normalizeVisionImageFile(file: File) {
  const sourceFile = isHighEfficiencyImageFile(file)
    ? await convertHighEfficiencyImageToJpeg(file)
    : file;

  const imageSource = await createCanvasImageSource(sourceFile);

  try {
    const normalizedDimensions = getNormalizedImageDimensions(imageSource.width, imageSource.height);
    const requiresResize =
      normalizedDimensions.width !== imageSource.width ||
      normalizedDimensions.height !== imageSource.height;
    const requiresReencode =
      sourceFile !== file ||
      sourceFile.type !== 'image/jpeg' ||
      sourceFile.size > NORMALIZED_IMAGE_SIZE_THRESHOLD_BYTES;

    if (!requiresResize && !requiresReencode) {
      return sourceFile;
    }
  } finally {
    imageSource.cleanup();
  }

  const normalizedBlob = await reencodeImageAsNormalizedJpeg(sourceFile);

  return new File([normalizedBlob], getNormalizedJpegFileName(file.name), {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}
