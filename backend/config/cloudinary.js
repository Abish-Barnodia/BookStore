import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";

const FOLDER = process.env.CLOUDINARY_FOLDER || "ecommerce/products";

function isConfigured() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

function applyConfig() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

async function safeUnlink(filePath) {
    if (!filePath) return;
    try {
        await fs.unlink(filePath);
    } catch {
        /* ignore missing file */
    }
}

/**
 * Upload a local file (e.g. from multer diskStorage) to Cloudinary, then
 * delete the temp file. Returns the secure HTTPS URL or null on failure.
 *
 * @param {string} filePath Absolute or relative path to the file on disk
 * @returns {Promise<string|null>}
 */
export async function uploadOnCloudinary(filePath) {
    if (!filePath || typeof filePath !== "string") {
        console.warn("[cloudinary] uploadOnCloudinary: invalid filePath");
        return null;
    }

    if (!isConfigured()) {
        console.warn(
            "[cloudinary] Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env"
        );
        await safeUnlink(filePath);
        return null;
    }

    applyConfig();

    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: FOLDER,
            resource_type: "image",
        });
        await safeUnlink(filePath);
        return result.secure_url ?? result.url ?? null;
    } catch (err) {
        console.error("[cloudinary] Upload failed:", err?.message || err);
        await safeUnlink(filePath);
        return null;
    }
}

export default uploadOnCloudinary;
