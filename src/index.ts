import { getInput, setFailed, info } from "@actions/core";
import fs from "fs";
import path from "path";

const distDir = getInput("dist-dir") || "dist";
const apiUrl = getInput("api-url") || "https://sourcemaps.faststats.dev";
const apiKey = getInput("api-key");
const absoluteDistDir = path.resolve(process.cwd(), distDir);

if (!fs.existsSync(absoluteDistDir)) {
  setFailed(`[FastStats] Directory not found: ${absoluteDistDir}`);
  process.exit(1);
}

const allContents = fs.readdirSync(absoluteDistDir, { recursive: true }) as string[];
const BATCH_SIZE = 100;

const mapFiles = allContents
  .filter((p) => p.endsWith(".js.map"))
  .filter((p) => {
    const fullPath = path.join(absoluteDistDir, p);
    if (fs.statSync(fullPath).isDirectory()) return false;

    const content = fs.readFileSync(fullPath, "utf8");

    const sources = JSON.parse(content).sources || [];
    return sources.some((s: string) => 
      s.includes("/src/") || s.includes("/app/") || s.includes("..")
    );
  })
  .map((p) => ({
    relativePath: p,
    fullPath: path.join(absoluteDistDir, p),
  }));

if (mapFiles.length === 0) {
  info("[FastStats] No relevant sourcemaps found after filtering.");
  process.exit(0);
}

info(`[FastStats] Found ${mapFiles.length} relevant sourcemaps`);

for (let i = 0; i < mapFiles.length; i += BATCH_SIZE) {
  const batch = mapFiles.slice(i, i + BATCH_SIZE);
  const form = new FormData();

  for (const { relativePath, fullPath } of batch) {
    const uniqueName = relativePath.replace(/[\/\\]/g, "--");
    const buffer = fs.readFileSync(fullPath);
    form.append("file", new Blob([buffer]), uniqueName);
  }

  const batchIdx = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(mapFiles.length / BATCH_SIZE);

  await fetch(`${apiUrl}/v1/sourcemaps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
    .then(async (res) => {
      const text = await res.text();
      if (!res.ok) throw new Error(`${res.status}: ${text}`);
      info(`[FastStats] Batch ${batchIdx}/${totalBatches} uploaded`);
    })
    .catch((err) => {
      setFailed(`[FastStats] Upload failed: ${err.message}`);
      process.exit(1);
    });
}

info(`[FastStats] Successfully uploaded ${mapFiles.length} maps`);