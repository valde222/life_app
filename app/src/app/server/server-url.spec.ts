import { checkServerUrl } from './server-url';

describe('checkServerUrl', () => {
  it('accepts HTTPS anywhere and plain HTTP only on this machine', () => {
    for (const url of [
      'https://life.tail1234.ts.net',
      'https://example.com:8443/',
      'http://localhost:8090',
      'http://127.0.0.1:8090',
      'http://10.0.2.2:8090',
    ]) {
      expect(checkServerUrl(url), url).toBeNull();
    }
  });

  it('refuses plain HTTP to other machines and anything that is not a web address', () => {
    for (const url of [
      'http://192.168.1.20:8090',
      'http://life.example.com',
      'http://localhost.evil.com',
      'javascript:alert(1)',
      'file:///etc/passwd',
      'ftp://example.com',
      'not a url',
    ]) {
      expect(checkServerUrl(url), url).not.toBeNull();
    }
  });
});
