import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// Save a single uploaded file buffer to local uploads/<folder>/ and return public URL path
export const saveBufferToLocal = async (file, folder) => {
	if (!file || !file.buffer || !file.originalname) {
		throw new Error("Invalid file input");
	}
	// Use consistent path - same as what the server uses to serve files
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const backendRoot = path.dirname(__dirname); // Go up from utils/ to backend/
	const uploadsRoot = path.join(backendRoot, "uploads", folder);
	
	console.log('File storage - uploadsRoot:', uploadsRoot);
	console.log('File storage - backendRoot:', backendRoot);
	console.log('File storage - process.cwd():', process.cwd());
	
	if (!fs.existsSync(uploadsRoot)) {
		console.log('Creating directory:', uploadsRoot);
		fs.mkdirSync(uploadsRoot, { recursive: true });
	}
	const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
	const fileName = `${Date.now()}-${safeBase}`;
	const destination = path.join(uploadsRoot, fileName);
	
	console.log('Saving file to:', destination);
	await fs.promises.writeFile(destination, file.buffer);
	
	const returnPath = `/uploads/${folder}/${fileName}`;
	console.log('Returning path:', returnPath);
	return returnPath;
};

// Save multiple files
export const saveMultipleToLocal = async (files, folder) => {
	if (!Array.isArray(files)) return [];
	const results = [];
	for (const f of files) {
		// eslint-disable-next-line no-await-in-loop
		const url = await saveBufferToLocal(f, folder);
		results.push(url);
	}
	return results;
};

// Delete file previously saved via URL like /uploads/<folder>/<file>
export const deleteLocalByUrl = async (fileUrl) => {
	try {
		console.log("deleteLocalByUrl called with:", fileUrl);
		if (!fileUrl || typeof fileUrl !== "string") {
			console.log("Invalid fileUrl, returning");
			return;
		}
		const prefix = "/uploads/";
		const idx = fileUrl.indexOf(prefix);
		if (idx === -1) {
			console.log("Prefix not found in fileUrl, returning");
			return;
		}
		const relative = fileUrl.slice(idx + 1); // strip leading '/' for path.join
		console.log("Relative path:", relative);
		// Use same consistent path as file saving
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const backendRoot = path.dirname(__dirname);
		const absolute = path.join(backendRoot, relative);
		console.log("Absolute path:", absolute);
		console.log("File exists:", fs.existsSync(absolute));
		if (fs.existsSync(absolute)) {
			await fs.promises.unlink(absolute);
			console.log("File deleted successfully");
		} else {
			console.log("File does not exist, cannot delete");
		}
	} catch (err) {
		// Log and continue; missing files shouldn't break flows
		console.warn("deleteLocalByUrl warning:", err?.message || err);
	}
};

export const ensureUploadsServed = () => {
	// no-op here; express static is configured in index.js
	return true;
};



