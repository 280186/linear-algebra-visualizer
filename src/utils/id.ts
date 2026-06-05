let counter = 0;

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  counter += 1;
  return `${Date.now()}-${counter}`;
}
