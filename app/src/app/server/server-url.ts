const THIS_MACHINE = new Set(['localhost', '127.0.0.1', '10.0.2.2', '[::1]']);

export function checkServerUrl(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return 'Enter a web address, like https://life.example.ts.net';
  }
  if (url.protocol === 'https:') {
    return null;
  }
  if (url.protocol === 'http:' && THIS_MACHINE.has(url.hostname)) {
    return null;
  }
  return 'Use an https:// address';
}
