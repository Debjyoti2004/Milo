import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const storageDriver = (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3";
if (storageDriver !== "local" && storageDriver !== "s3") {
  throw new Error(`Invalid STORAGE_DRIVER "${storageDriver}" — must be "local" or "s3"`);
}

if (storageDriver === "s3") {
  for (const name of ["S3_BUCKET", "S3_REGION", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) {
    required(name);
  }
}

export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessTtlMin: Number(process.env.JWT_ACCESS_TTL_MIN ?? 15),
  jwtRefreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30),
  isProduction: process.env.NODE_ENV === "production",
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 25),
  storage: {
    driver: storageDriver,
    s3Bucket: process.env.S3_BUCKET ?? "",
    s3Region: process.env.S3_REGION ?? "",
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    s3Endpoint: process.env.S3_ENDPOINT,
    s3PublicUrlBase: process.env.S3_PUBLIC_URL_BASE,
  },
};
