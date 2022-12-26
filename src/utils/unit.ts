export function bitText(size: number): string {
  if (size < 900) return `${size}B`;
  size /= 1024;
  if (size < 900) return `${size.toFixed(2)}KB`;
  return `${(size / 1024).toFixed(2)}MB`;
}
