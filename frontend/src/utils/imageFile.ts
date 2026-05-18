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
