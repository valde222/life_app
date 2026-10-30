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

  it('only ever produces the allowed tags and attributes, whatever the note says', () => {
    const pieces = [
      '[[',
      ']]',
      '[',
      ']',
      '(',
      ')',
      '**',
      '*',
      '`',
      '"',
      "'",
      '<',
      '>',
      '=',
      ' ',
      'https://x.com/',
      'onmouseover=alert(1)//',
      'javascript:',
      'a',
      '#',
      '- ',
      '\n',
      '1. ',
      '```',
    ];
    let seed = 7;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const inputs = [
      '[[ https://x.com/onmouseover=alert(1)//]]',
      '[[a https://x.com/" onfocus=alert(1) autofocus x="]]',
      '[t](https://a.com/[[x]])',
      '[*a](https://x.com/*b) https://y.com/*c*',
      '`https://x.com/[[y]]` [[`z`]]',
    ];
    for (let n = 0; n < 500; n++) {
      inputs.push(
        Array.from(
          { length: 4 + Math.floor(random() * 10) },
          () => pieces[Math.floor(random() * pieces.length)],
        ).join(''),
      );
    }
    const tags = new Set([
      'P',
      'BR',
      'H3',
      'H4',
      'H5',
      'UL',
      'OL',
      'LI',
      'PRE',
      'CODE',
      'STRONG',
      'EM',
      'A',
    ]);
    const attributes = new Set(['href', 'target', 'rel', 'class', 'data-note']);
    for (const input of inputs) {
      const doc = new DOMParser().parseFromString(
        `<body>${renderMarkdown(input)}</body>`,
        'text/html',
      );
      for (const element of Array.from(doc.body.querySelectorAll('*'))) {
        expect(tags.has(element.tagName), `${element.tagName} from ${JSON.stringify(input)}`).toBe(
          true,
        );
        for (const attribute of Array.from(element.attributes)) {
          expect(
            attributes.has(attribute.name),
            `${attribute.name} from ${JSON.stringify(input)}`,
          ).toBe(true);
        }
        const href = element.getAttribute('href');
        if (href !== null) {
          expect(href, JSON.stringify(input)).toMatch(/^https?:\/\/[^\s"'<>]+$/);
        }
      }
    }
  });

  it('turns [[title]] into a note link', () => {
    expect(renderMarkdown('See also [[Session cookies]]')).toContain('data-note="Session cookies"');
  });

  it('gives a plain first line for previews', () => {
    expect(firstLine('\n## Heading\nbody')).toBe('Heading');
    expect(firstLine('Token is `refreshed`')).toBe('Token is refreshed');
  });
});
