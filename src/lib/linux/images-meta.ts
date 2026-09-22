const IMAGE_EXT = /\.(svg|png|jpe?g|gif|webp|bmp|ico)$/i;

export function isImagePath(path: string): boolean {
  return IMAGE_EXT.test(path);
}
