import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export interface SavedFile {
  url: string;
  key: string;
}

interface StorageDriver {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<SavedFile>;
  delete(key: string): Promise<void>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.join(__dirname, "../../uploads/exercise-media");

function extensionFor(originalName: string): string {
  const ext = path.extname(originalName);
  return ext || "";
}

class LocalStorageDriver implements StorageDriver {
  async save(buffer: Buffer, originalName: string, _mimeType: string): Promise<SavedFile> {
    await mkdir(UPLOAD_ROOT, { recursive: true });
    const filename = `${randomUUID()}${extensionFor(originalName)}`;
    await writeFile(path.join(UPLOAD_ROOT, filename), buffer);
    return {
      key: filename,
      url: `${env.publicBaseUrl}/uploads/exercise-media/${filename}`,
    };
  }

  async delete(key: string): Promise<void> {
    await unlink(path.join(UPLOAD_ROOT, key)).catch(() => {});
  }
}

class S3StorageDriver implements StorageDriver {
  private client = new S3Client({
    region: env.storage.s3Region,
    endpoint: env.storage.s3Endpoint,
    forcePathStyle: Boolean(env.storage.s3Endpoint),
    credentials: {
      accessKeyId: env.storage.s3AccessKeyId,
      secretAccessKey: env.storage.s3SecretAccessKey,
    },
  });

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<SavedFile> {
    const key = `exercise-media/${randomUUID()}${extensionFor(originalName)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.storage.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    const base =
      env.storage.s3PublicUrlBase ??
      `https://${env.storage.s3Bucket}.s3.${env.storage.s3Region}.amazonaws.com`;
    return { key, url: `${base.replace(/\/$/, "")}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.storage.s3Bucket, Key: key }));
  }
}

export const storage: StorageDriver =
  env.storage.driver === "s3" ? new S3StorageDriver() : new LocalStorageDriver();

export const localUploadRoot = UPLOAD_ROOT;
