// Tiny static server for the findings page. No dependencies.
//   node serve.mjs            -> http://localhost:4173
//   PORT=8080 node serve.mjs  -> http://localhost:8080
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/") rel = "/index.html";
    const file = normalize(join(root, rel));
    // only serve index.html and files under documents/
    const ok = file === join(root, "index.html") || file.startsWith(join(root, "documents") + sep);
    if (!ok) { res.writeHead(404).end("Not found"); return; }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Job findings: http://localhost:${port}`));
