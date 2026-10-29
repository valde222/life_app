import { firstLine, renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders headings, paragraphs and lists', () => {
    expect(renderMarkdown('## Why\nOne line\nand another\n\n- a\n- b\n\n1. first')).toBe(
      '<h4>Why</h4><p>One line<br>and another</p><ul><li>a</li><li>b</li></ul><ol><li>first</li></ol>',
    );
  });

  it('renders code, bold and links', () => {
    expect(renderMarkdown('The code is in `auth/refresh.ts`, **really**. See https://x.dev')).toBe(
      '<p>The code is in <code>auth/refresh.ts</code>, <strong>really</strong>. See <a href="https://x.dev" target="_blank" rel="noopener">https://x.dev</a></p>',
    );
    expect(renderMarkdown('```\nconst a = 1 < 2;\n```')).toBe(
      '<pre><code>const a = 1 &lt; 2;</code></pre>',
    );
  });

  it('never lets note text through as markup', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)> [x](javascript:alert(1))');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('href="javascript');
  });

  it('turns [[title]] into a note link', () => {
    expect(renderMarkdown('See also [[Session cookies]]')).toContain('data-note="Session cookies"');
  });

  it('gives a plain first line for previews', () => {
    expect(firstLine('\n## Heading\nbody')).toBe('Heading');
    expect(firstLine('Token is `refreshed`')).toBe('Token is refreshed');
  });
});
