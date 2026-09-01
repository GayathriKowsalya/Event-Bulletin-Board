import { Storage } from "@google-cloud/storage";
import { env } from "./env.js";

let storageClient = null;
let bucket = null;

function getBucket() {
  if (!env.googleProjectId || !env.googleBucket) {
    throw new Error(
      "Google Cloud Storage is not configured. Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_STORAGE_BUCKET."
    );
  }

  if (!storageClient) {
    const options = { projectId: env.googleProjectId };
    if (env.googleKeyFile) options.keyFilename = env.googleKeyFile;
    storageClient = new Storage(options);
  }

  bucket = bucket || storageClient.bucket(env.googleBucket);
  return bucket;
}

export async function uploadBuffer({ buffer, contentType, objectName }) {
  const targetBucket = getBucket();
  const file = targetBucket.file(objectName);

  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      cacheControl: "public,max-age=3600"
    }
  });

  return `https://storage.googleapis.com/${targetBucket.name}/${encodeURIComponent(objectName).replaceAll("%2F", "/")}`;
}

export async function deleteObject(objectName) {
  if (!env.googleBucket) return;
  const targetBucket = getBucket();
  await targetBucket.file(objectName).delete({ ignoreNotFound: true });
}
