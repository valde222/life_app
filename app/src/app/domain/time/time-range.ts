export function timeRange(time: string, timeEnd: string): string {
  if (!time) {
    return '';
  }
  return timeEnd ? `${time}–${timeEnd}` : time;
}
