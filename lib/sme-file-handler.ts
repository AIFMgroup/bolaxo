import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl as generateSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || "eu-west-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "afterfounder-sme-documents";

// File validation
export function validateFileType(mimeType: string, category: "financial" | "documents"): boolean {
  const validTypes = {
    financial: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/pdf",
    ],
    documents: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  };
  return validTypes[category]?.includes(mimeType) || false;
}

// Sanitize filename
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 255);
}

// Calculate checksum
export async function calculateChecksum(buffer: Buffer): Promise<string> {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Upload to AWS S3
export async function uploadToStorage(
  buffer: Buffer,
  fileName: string,
  listingId: string
): Promise<{ url: string; path: string; checksum: string }> {
  const sanitized = sanitizeFileName(fileName);
  const checksum = await calculateChecksum(buffer);
  const path = `${listingId}/${Date.now()}-${sanitized}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: buffer,
      ContentType: "application/octet-stream",
      Metadata: {
        checksum,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION || "eu-west-1"}.amazonaws.com/${path}`;

    return { url, path, checksum };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${String(error)}`);
  }
}

// Generate signed URL (temporary access - 24 hours)
export async function getSignedUrl(
  key: string,
  expirationSeconds: number = 86400 // 24 hours
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await generateSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${String(error)}`);
  }
}

// Generate public file URL
export function generateFileUrl(fileName: string, listingId: string): string {
  const sanitized = sanitizeFileName(fileName);
  
  // Med CloudFront (CDN) om konfigurerat
  if (process.env.CLOUDFRONT_DOMAIN_NAME) {
    return `https://${process.env.CLOUDFRONT_DOMAIN_NAME}/${listingId}/${sanitized}`;
  }
  
  // Direkt S3 (utan CDN)
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_S3_REGION || "eu-west-1"}.amazonaws.com/${listingId}/${sanitized}`;
}

// Check if file exists
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch (error) {
    return false;
  }
}
