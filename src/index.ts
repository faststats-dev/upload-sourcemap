import { getInput } from "@actions/core";
import fs from "fs";
import path from "path";

const distDir = getInput("dist-dir") || "dist";
const apiUrl = getInput("api-url") || "https://sourcemaps.faststats.dev";
const apiKey = process.env.FASTSTATS_API_KEY;

if(!apiKey) {
  throw new Error("FASTSTATS_API_KEY is not set");
}

const form = new FormData();

for (const file of fs.readdirSync(distDir)) {
  if (file.endsWith(".map")) {
    const sourcemapContent = fs.readFileSync(path.join(distDir, file), "utf8");
    form.append("file", new Blob([sourcemapContent]), file);
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