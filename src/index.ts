import { getInput } from "@actions/core";
import fs from "fs";
import path from "path";

const distDir = getInput("dist-dir") || "dist";
const apiUrl = getInput("api-url") || "https://sourcemaps.faststats.dev";
const apiKey = getInput("api-key");

const form = new FormData();
let hasFiles = false;

const files = fs.readdirSync(distDir);

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
const uploadRes = await fetch(
	`${apiUrl}/v1/sourcemaps`,
	{
		method: "POST",
		headers: { Authorization: `Bearer ${apiKey}` },
		body: form,
	},
);

if (!uploadRes.ok) {
  throw new Error(`Failed to upload sourcemaps: ${uploadRes.statusText}`);
}

console.log(`[FastStats] Uploaded sourcemaps`);