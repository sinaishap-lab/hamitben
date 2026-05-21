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

/** Create a short-lived signature for a client-side upload. */
export function signUpload(folder: string): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary not configured");
  }
  configure();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    API_SECRET!
  );
  return {
    signature,
    timestamp,
    apiKey: API_KEY!,
    cloudName: CLOUD_NAME!,
    folder,
  };
}
