import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readTokens } from './tokens.mjs';

const tokens = readTokens();
const pixels = (group) =>
  new Set(group.tokens.map(({ value }) => value).filter((value) => value.endsWith('px')));
const SPACING = pixels(tokens.spacing);
const RADII = pixels(tokens.radius);

const COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i;
const PIXEL = /(?<![-\w.])(\d+(?:\.\d+)?px)/g;
const DECLARATION = /^\s*([a-z-]+)\s*:\s*([^;{]+);/;
const DURATION = /(?<![\w.-])(?!0m?s\b)\d*\.?\d+m?s\b/;
const EASING =
  /(?<![\w-])(?:ease|ease-in|ease-out|ease-in-out|linear)(?![\w-])|cubic-bezier\(|steps\(/;
const RULES = [
  { test: (property) => property === 'font-size', bad: () => true, hint: 'var(--text-…)' },
  {
    test: (property) => property.startsWith('border-') && property.includes('radius'),
    bad: (px) => RADII.has(px),
    hint: 'var(--radius-…)',
  },
  {
    test: (property) => /^(padding|margin)(-|$)|^(row-|column-)?gap$/.test(property),
    bad: (px) => SPACING.has(px),
    hint: 'var(--space-…)',
  },
];

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* files(path);
    } else if (
      /\.(scss|ts)$/.test(entry.name) &&
      !entry.name.endsWith('.spec.ts') &&
      entry.name !== '_tokens.scss'
    ) {
      yield path;
    }
  }
}

function joinContinuations(lines) {
  return lines.map((line, index) => {
    if (!/^\s*[a-z-]+:\s*$/.test(line)) {
      return line;
    }
    const end = lines.findIndex((next, at) => at > index && next.includes(';'));
    return end === -1
      ? line
      : [line.trimEnd(), ...lines.slice(index + 1, end + 1).map((part) => part.trim())].join(' ');
  });
}

function problems(property, value) {
  if (COLOUR.test(value)) {
    return ['colour literal: use a colour token'];
  }
  if (/^(transition|animation)(-|$)/.test(property)) {
    return [
      ...(DURATION.test(value) ? ['duration literal: use var(--motion-…)'] : []),
      ...(EASING.test(value) ? ['easing literal: use var(--ease-…)'] : []),
    ];
  }
  const rule = RULES.find(({ test }) => test(property));
  const literals = rule ? [...value.matchAll(PIXEL)].map((match) => match[1]).filter(rule.bad) : [];
  return literals.map((px) => `${px}: use ${rule.hint}`);
}

const found = [];
for (const path of files('src')) {
  const isScript = path.endsWith('.ts');
  joinContinuations(readFileSync(path, 'utf8').split('\n')).forEach((line, index) => {
    const declaration = DECLARATION.exec(line);
    if (!declaration || (isScript && !/^\s{4,}[a-z-]+\s*:/.test(line))) {
      return;
    }
    for (const problem of problems(declaration[1], declaration[2])) {
      found.push(`${relative('.', path)}:${index + 1}  ${declaration[1]}  ${problem}`);
    }
  });
}

if (found.length) {
  console.error(found.join('\n'));
  console.error(`\n${found.length} style values should use design tokens.`);
  process.exit(1);
}
