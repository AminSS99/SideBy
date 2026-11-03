import { readFile, writeFile } from "node:fs/promises";

const template = await readFile("dist/index.html", "utf8");
const intro = await readFile(new URL("./homepage-intro.html", import.meta.url), "utf8");
const root = '<div id="root"></div>';
if (!template.includes(root)) throw new Error("The SideBy app mount is missing");

const homepage = template
  .replace("</head>", '  <link rel="canonical" href="https://sideby.ink/" />\n  </head>')
  .replace(root, `<div id="root">
${intro}</div>`);
await writeFile("dist/home-entry.html", homepage);
