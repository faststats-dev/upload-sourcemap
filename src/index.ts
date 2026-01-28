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

// Debug: List every file found in the directory
const allContents = fs.readdirSync(absoluteDistDir, { recursive: true }) as string[];
info(`[FastStats] Scanning directory: ${absoluteDistDir}`);
info(`[FastStats] All files found: ${JSON.stringify(allContents)}`);

const form = new FormData();
let count = 0;

for (const relativePath of allContents) {
	if (relativePath.endsWith(".map")) {
		const fullPath = path.join(absoluteDistDir, relativePath);
		
		// Skip directories if recursive returned them
		if (fs.statSync(fullPath).isDirectory()) continue;

		const fileName = path.basename(relativePath);
		const buffer = fs.readFileSync(fullPath);
		const blob = new Blob([buffer], { type: "application/json" });
		
		form.append("file", blob, fileName);
		info(`[FastStats] Preparing: ${fileName}`);
		count++;
	}
}

if (count === 0) {
	setFailed(`[FastStats] No sourcemaps (.map files) found in ${absoluteDistDir}`);
	process.exit(1);
}

info(`[FastStats] Uploading ${count} sourcemaps to ${apiUrl}`);

const uploadRes = await fetch(`${apiUrl}/v1/sourcemaps`, {
	method: "POST",
	headers: { Authorization: `Bearer ${apiKey}` },
	body: form,
});

const responseText = await uploadRes.text();

if (!uploadRes.ok) {
	setFailed(`[FastStats] Upload failed (${uploadRes.status}): ${responseText}`);
	process.exit(1);
}

info(`[FastStats] Successfully uploaded sourcemaps: ${responseText}`);