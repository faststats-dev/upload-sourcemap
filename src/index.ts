import { getInput, setFailed, info } from "@actions/core";
import fs from "fs";
import path from "path";

const distDir = getInput("dist-dir") || "dist";
const apiUrl = getInput("api-url") || "https://sourcemaps.faststats.dev";
const apiKey = getInput("api-key");

const form = new FormData();
let hasFiles = false;


const absoluteDistDir = path.resolve(process.cwd(), distDir);

if (!fs.existsSync(absoluteDistDir)) {
    setFailed(`Directory not found: ${absoluteDistDir}`);
  }

  const files = fs.readdirSync(absoluteDistDir);

for (const file of files) {
	if (file.endsWith(".map")) {
	  const filePath = path.join(distDir, file);
	  const buffer = fs.readFileSync(filePath);
	  
	  const blob = new Blob([buffer]);
	  form.append("file", blob, file);
	  
	  console.log(`[FastStats] Preparing: ${file}`);
	  hasFiles = true;
	}
  }

  if (!hasFiles) {
	info("[FastStats] No sourcemaps found to upload.");
  }

  info(`[FastStats] Uploading ${hasFiles} sourcemaps to ${apiUrl}`);

const uploadRes = await fetch(
	`${apiUrl}/v1/sourcemaps`,
	{
		method: "POST",
		headers: { Authorization: `Bearer ${apiKey}` },
		body: form,
	},
);

if (!uploadRes.ok) {
  setFailed(`[FastStats] Failed to upload sourcemaps to ${apiUrl}: ${uploadRes.statusText}`);
}

info(`[FastStats] Successfully uploaded sourcemaps`);