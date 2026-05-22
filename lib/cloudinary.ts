import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

let configured = false;
function configure() {
  if (configured) return;
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return;
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  configured = true;
}

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

export function getCloudName() {
  return CLOUD_NAME;
}

/**
 * Upload an image to Cloudinary from the server.
 *
 * `source` may be a data-URI (`data:image/...;base64,...`) or a remote URL.
 * The SDK handles signing internally — no manual signature dance.
 */
export async function uploadImage(
  source: string,
  folder: string
): Promise<{ url: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary not configured");
  }
  configure();
  const result = await cloudinary.uploader.upload(source, {
    folder,
    resource_type: "image",
  });
  return { url: result.secure_url };
}
