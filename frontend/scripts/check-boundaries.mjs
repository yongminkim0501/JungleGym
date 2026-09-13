import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve("src");
const ranks = { shared: 0, entities: 1, features: 2, screens: 3, app: 4 };
const problems = [];
const graph = new Map();

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? walk(file)
      : /\.tsx?$/.test(entry.name)
        ? [file]
        : [];
  });
}

function group(file) {
  const segments = path.relative(root, file).split(path.sep);
  return { layer: segments[0], module: segments.slice(0, 2).join("/") };
}

function resolve(from, specifier) {
  const base = specifier.startsWith("@/")
    ? path.join(root, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(from), specifier)
      : null;
  if (!base) return null;
  return (
    [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ].find(
      (candidate) =>
        fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    ) ?? null
  );
}

const files = walk(root);
const exactSourcePaths = new Set(files);
for (const file of files) {
  const code = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const from = group(file);
  const edges = [];
  function inspect(node) {
    const specifier =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0]
          : null;
    if (specifier && ts.isStringLiteral(specifier)) {
      const target = resolve(file, specifier.text);
      if (target) {
        if (/\.tsx?$/.test(target) && !exactSourcePaths.has(target)) {
          problems.push(`Import path casing does not match the file: ${path.relative(root, file)} → ${specifier.text}`);
        }
        edges.push(target);
        const to = group(target);
        const label = `${path.relative(root, file)} → ${specifier.text}`;
        if (ranks[to.layer] > ranks[from.layer])
          problems.push(`Upward dependency: ${label}`);
        if (
          from.layer === "features" &&
          to.layer === "features" &&
          from.module !== to.module
        )
          problems.push(`Feature-to-feature dependency: ${label}`);
        if (
          from.module !== to.module &&
          to.layer !== "app" &&
          !/^index\.tsx?$/.test(path.basename(target))
        )
          problems.push(`Import through the module index.ts: ${label}`);
        if (
          to.module === "shared/api" &&
          target.includes(`${path.sep}server${path.sep}`) &&
          from.layer !== "app" &&
          from.module !== "shared/api"
        )
          problems.push(`Server transport imported by client module: ${label}`);
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(code);
  graph.set(file, edges);
}

const visited = new Set();
const active = new Set();
function visit(file, chain = []) {
  if (active.has(file)) {
    problems.push(
      `Circular dependency: ${[...chain, file].map((item) => path.relative(root, item)).join(" → ")}`,
    );
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const target of graph.get(file) ?? []) visit(target, [...chain, file]);
  active.delete(file);
  visited.add(file);
}
for (const file of files) visit(file);

for (const directory of new Set(
  files.filter((file) => group(file).layer !== "app").map(path.dirname),
)) {
  if (
    !fs.existsSync(path.join(directory, "index.ts")) &&
    !fs.existsSync(path.join(directory, "index.tsx"))
  )
    problems.push(`Missing public index.ts: ${path.relative(root, directory)}`);
}

if (problems.length) {
  console.error([...new Set(problems)].join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Module boundaries checked: ${files.length} source files, no cycles or private cross-module imports.`,
  );
}
