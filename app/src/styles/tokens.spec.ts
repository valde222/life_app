import { readFileSync } from 'node:fs';
// @ts-expect-error plain ES module shared with the build script
import { outputPath, readTokens, renderTokens } from '../../scripts/tokens.mjs';

describe('design tokens', () => {
  it('generated SCSS matches tokens.json (run `npm run tokens`)', () => {
    const generated = readFileSync(outputPath, 'utf8');
    expect(generated).toBe(renderTokens(readTokens()));
  });
});
