const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const API_DIR = path.resolve(__dirname, "test-api-perf");
const ROUTES_DIR = path.join(API_DIR, "_routes");

// Helper to clean up
function cleanup() {
  if (fs.existsSync(API_DIR)) {
    fs.rmSync(API_DIR, { recursive: true, force: true });
  }
}

// Helper to setup
function setup(numFiles) {
  cleanup();
  fs.mkdirSync(API_DIR, { recursive: true });

  // Create numFiles
  for (let i = 0; i < numFiles; i++) {
    const filePath = path.join(API_DIR, `file${i}.js`);
    // Create some content with relative imports to trigger replacement
    let content = `// Dummy file ${i}\n`;
    for(let j = 0; j < 100; j++) {
      content += `import { thing${j} } from "./thing${j}";\n`;
      content += `import { other${j} } from "../other${j}";\n`;
    }
    fs.writeFileSync(filePath, content, "utf-8");
  }
}

// Original sync version
function updateImportsSync(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
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
    fs.writeFileSync(filePath, updated, "utf-8");
  }
}

// Async version (to be implemented)
const fsPromises = fs.promises;
async function updateImportsAsync(filePath) {
  const content = await fsPromises.readFile(filePath, "utf-8");
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
    await fsPromises.writeFile(filePath, updated, "utf-8");
  }
}

async function runBenchmark() {
  const numFiles = 1000;
  console.log(`Setting up ${numFiles} files for benchmark...`);
  setup(numFiles);

  let files = fs.readdirSync(API_DIR).map(f => path.join(API_DIR, f));

  console.log("Running Sync version...");
  const startSync = performance.now();
  for (const file of files) {
    updateImportsSync(file);
  }
  const endSync = performance.now();

  // Reset files
  setup(numFiles);
  files = fs.readdirSync(API_DIR).map(f => path.join(API_DIR, f));

  console.log("Running Async version...");
  const startAsync = performance.now();
  await Promise.all(files.map(file => updateImportsAsync(file)));
  const endAsync = performance.now();

  cleanup();

  console.log(`\nResults:`);
  console.log(`Sync time:  ${(endSync - startSync).toFixed(2)} ms`);
  console.log(`Async time: ${(endAsync - startAsync).toFixed(2)} ms`);
  console.log(`Improvement: ${(((endSync - startSync) - (endAsync - startAsync)) / (endSync - startSync) * 100).toFixed(2)}%`);
}

runBenchmark();
