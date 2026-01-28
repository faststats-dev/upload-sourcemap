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
info(`[FastStats] Scanning directory: ${absoluteDistDir}`);

const BATCH_SIZE = 100;

const mapFiles: { relativePath: string; fullPath: string }[] = [];

for (const relativePath of allContents) {
	if (relativePath.endsWith(".map")) {
		const fullPath = path.join(absoluteDistDir, relativePath);
		if (fs.statSync(fullPath).isDirectory()) continue;
		mapFiles.push({ relativePath, fullPath });
	}
}

if (mapFiles.length === 0) {
	setFailed(`[FastStats] No sourcemaps (.map files) found in ${absoluteDistDir}`);
	process.exit(1);
}

info(`[FastStats] Found ${mapFiles.length} sourcemaps to upload`);

const batches: { relativePath: string; fullPath: string }[][] = [];
for (let i = 0; i < mapFiles.length; i += BATCH_SIZE) {
	batches.push(mapFiles.slice(i, i + BATCH_SIZE));
}

info(`[FastStats] Uploading in ${batches.length} batch(es) of max ${BATCH_SIZE} files`);

for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
	const batch = batches[batchIndex];
	const form = new FormData();

	for (const { relativePath, fullPath } of batch ?? []) {
		const fileName = path.basename(relativePath);
		const buffer = fs.readFileSync(fullPath);
		const blob = new Blob([buffer], { type: "application/json" });
		form.append("file", blob, fileName);
		info(`[FastStats] Preparing: ${fileName}`);
	}

	info(`[FastStats] Uploading batch ${batchIndex + 1}/${batches.length} (${batch?.length ?? 0} files) to ${apiUrl}`);

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

	info(`[FastStats] Batch ${batchIndex + 1} uploaded successfully: ${responseText}`);
}

info(`[FastStats] Successfully uploaded all ${mapFiles.length} sourcemaps`);