const fs = require("fs");
const path = require("path");

const API_DIR = path.resolve(__dirname, "..", "frontend/api");
const ROUTES_DIR = path.join(API_DIR, "_routes");

function getAllFiles(dir, base = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_lib" || entry.name === "_routes") continue;
      files.push(...getAllFiles(fullPath, relPath));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
      files.push({ relPath, fullPath });
    }
  }
  return files;
}

function moveFile(oldPath, newPath) {
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.renameSync(oldPath, newPath);
}

async function updateImports(filePath) {
  const content = await fs.promises.readFile(filePath, "utf-8");
  // Replace relative imports: add one more ../ to each relative path segment
  const updated = content.replace(
    /"(\.{1,2}\/[^"]+)"/g,
    (match, p1) => {
      if (p1.startsWith("../")) {
        return `"../${p1}"`;
      } else if (p1.startsWith("./")) {
        return `"../${p1.slice(2)}"`;
      }
      return match;
    }
  );
  if (updated !== content) {
    await fs.promises.writeFile(filePath, updated, "utf-8");
  }
}

// Main
async function main() {
  if (!fs.existsSync(ROUTES_DIR)) {
    fs.mkdirSync(ROUTES_DIR, { recursive: true });
  }

  const files = getAllFiles(API_DIR);

  for (const file of files) {
    const oldPath = file.fullPath;
    const newPath = path.join(ROUTES_DIR, file.relPath);
    moveFile(oldPath, newPath);
  }

  // Also move root-level files
  const rootFiles = fs.readdirSync(API_DIR, { withFileTypes: true })
    .filter(e => e.isFile() && (e.name.endsWith(".ts") || e.name.endsWith(".js")))
    .map(e => e.name);

  for (const file of rootFiles) {
    const oldPath = path.join(API_DIR, file);
    const newPath = path.join(ROUTES_DIR, file);
    fs.renameSync(oldPath, newPath);
  }

  // Update imports in all moved files
  const movedFiles = getAllFiles(ROUTES_DIR);
  await Promise.all(movedFiles.map(file => updateImports(file.fullPath)));

  console.log(`Moved ${files.length + rootFiles.length} API route files to api/_routes/`);
}

main().catch(console.error);
