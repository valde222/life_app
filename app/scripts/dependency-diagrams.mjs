import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appFolder = join(dirname(fileURLToPath(import.meta.url)), '..');
const diagramsFolder = join(appFolder, '..', 'docs', 'diagrams');
const GENERATED_BY =
  "Generated from the real imports by `npm run diagrams` in `app/`; don't edit by hand.";

const nodeId = (name) => name.replace(/[^a-z0-9]/g, '_');
const nodeLine = (name, label = name) => `  ${nodeId(name)}["${label}"]`;
const shortName = (name) => name.split('/').at(-1);

function readImports() {
  const report = execFileSync(
    'npx',
    ['depcruise', 'src', '--config', '.dependency-cruiser.cjs', '--no-progress', '-T', 'json'],
    { cwd: appFolder, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(report).modules.flatMap((module) =>
    module.dependencies.map((dependency) => ({ from: module.source, to: dependency.resolved })),
  );
}

function moduleOf(path) {
  const match = /^src\/app\/(domain|shell|(?:core|shared|features)\/[^/.]+)/.exec(path);
  return match?.[1] ?? null;
}

function layerOf(path) {
  return moduleOf(path)?.split('/')[0] ?? null;
}

function countEdges(imports, group) {
  const counts = new Map();
  for (const { from, to } of imports) {
    const source = group(from);
    const target = group(to);
    if (source && target && source !== target) {
      const key = `${source} ${target}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([key, count]) => {
      const [source, target] = key.split(' ');
      return { source, target, count };
    })
    .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
}

function subgraph(title, names, label = shortName) {
  return [
    `  subgraph ${nodeId(title)}["${title}"]`,
    ...names.map((name) => `  ${nodeLine(name, label(name))}`),
    '  end',
  ];
}

function unique(names) {
  return [...new Set(names)].sort();
}

function write(file, { title, sentence, lines, notes }) {
  const text = [
    `# ${title}`,
    '',
    sentence,
    '',
    '```mermaid',
    ...lines,
    '```',
    '',
    ...notes.map((note) => `- ${note}`),
    '',
  ].join('\n');
  writeFileSync(join(diagramsFolder, file), text);
}

function layersDiagram(imports) {
  const order = ['shell', 'features', 'shared', 'core', 'domain'];
  const edges = countEdges(imports, layerOf);
  write('03a-code-layers.md', {
    title: 'Code layers',
    sentence: `Which layers of the Angular app import which, with the number of imports on each arrow. ${GENERATED_BY}`,
    lines: [
      'flowchart TD',
      ...order.map((layer) => nodeLine(layer)),
      ...edges.map(({ source, target, count }) => `  ${source} -- ${count} --> ${target}`),
    ],
    notes: [
      'The rules are in `app/.dependency-cruiser.cjs`, and `npm run lint` fails on a break: each layer imports only the layers below it, and a feature never imports another feature.',
      'Dexie and the PocketBase SDK may only be imported by `core/data`, `core/sync` and `core/server`.',
      'The diagrams after this one leave out `domain`, which every layer may import.',
    ],
  });
}

function usedByMost(edges, sources) {
  const users = (target) => edges.filter((edge) => edge.target === target).length;
  return unique(edges.map((edge) => edge.target)).filter(
    (target) => users(target) > sources.length / 2,
  );
}

function featuresToDiagram(imports, target) {
  const edges = countEdges(imports, moduleOf).filter(
    (edge) => edge.source.startsWith('features/') && edge.target.startsWith(`${target.layer}/`),
  );
  const features = unique(
    [...new Set(imports.map(({ from }) => moduleOf(from)))].filter((name) =>
      name?.startsWith('features/'),
    ),
  );
  const common = usedByMost(edges, features);
  const drawn = edges.filter((edge) => !common.includes(edge.target));
  const without = (name) =>
    features
      .filter((feature) => !edges.some((edge) => edge.source === feature && edge.target === name))
      .map((feature) => `\`${shortName(feature)}\``)
      .join(', ');
  const idle = features
    .filter((feature) => !drawn.some((edge) => edge.source === feature))
    .map((feature) => `\`${shortName(feature)}\``);
  write(target.file, {
    title: target.title,
    sentence: `${target.sentence} ${GENERATED_BY}`,
    lines: [
      'flowchart LR',
      ...subgraph('features', unique(drawn.map((edge) => edge.source))),
      ...subgraph(target.layer, unique(drawn.map((edge) => edge.target))),
      ...drawn.map((edge) => `  ${nodeId(edge.source)} --> ${nodeId(edge.target)}`),
    ],
    notes: [
      ...common.map(
        (name) =>
          `Not drawn, because most features use it: \`${name}\`, used by all but ${without(name) || 'none'}.`,
      ),
      ...(idle.length ? [`No other arrows, so not drawn: ${idle.join(', ')}.`] : []),
    ],
  });
}

function insideDiagram(imports, target) {
  const edges = countEdges(imports, moduleOf).filter(
    (edge) => edge.source.startsWith(`${target.from}/`) && /^(core|shared)\//.test(edge.target),
  );
  const names = unique(edges.flatMap((edge) => [edge.source, edge.target]));
  const layers = unique(names.map((name) => name.split('/')[0])).sort(
    (a, b) => Number(b === target.from) - Number(a === target.from),
  );
  write(target.file, {
    title: target.title,
    sentence: `${target.sentence} ${GENERATED_BY}`,
    lines: [
      target.direction,
      ...layers.flatMap((layer) =>
        subgraph(
          layer,
          names.filter((name) => name.startsWith(`${layer}/`)),
        ),
      ),
      ...edges.map((edge) => `  ${nodeId(edge.source)} --> ${nodeId(edge.target)}`),
    ],
    notes: target.notes,
  });
}

const imports = readImports();
layersDiagram(imports);
featuresToDiagram(imports, {
  layer: 'shared',
  file: '03b-features-to-shared.md',
  title: 'Features to shared',
  sentence: 'Which shared UI modules each feature uses.',
});
featuresToDiagram(imports, {
  layer: 'core',
  file: '03c-features-to-core.md',
  title: 'Features to core',
  sentence: 'Which core services each feature uses.',
});
insideDiagram(imports, {
  from: 'core',
  file: '03d-inside-core.md',
  title: 'Inside core',
  sentence: 'How the modules inside `core` import each other.',
  direction: 'flowchart TD',
  notes: [
    'The arrows both ways between `data`, `sync` and `server` are between folders. No file-level import cycle exists, and `npm run lint` fails if one appears.',
  ],
});
insideDiagram(imports, {
  from: 'shared',
  file: '03e-shared-to-core.md',
  title: 'Shared to core',
  sentence: 'What the modules in `shared` import from each other and from `core`.',
  direction: 'flowchart LR',
  notes: [],
});
