import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { dirname, extname, join, normalize } from "path";
import { tmpdir } from "os";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DocumentType } from "../documents/reservation-document.entity";

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly uploadExpiry: number;
  private readonly readExpiry = 300; // 5 minutes for download URLs
  private readonly devStorageRoot: string;
  private readonly endpoint?: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly config: ConfigService) {
    this.endpoint = this.config.get<string>("AWS_S3_ENDPOINT")?.trim() || undefined;
    this.s3 = new S3Client({
      region: this.config.get<string>("AWS_REGION", "eu-west-3"),
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      credentials: {
        accessKeyId: this.config.get<string>("AWS_ACCESS_KEY_ID")!,
        secretAccessKey: this.config.get<string>("AWS_SECRET_ACCESS_KEY")!,
      },
    });
    this.bucket = this.config.get<string>("AWS_S3_BUCKET", "nexus-documents");
    this.uploadExpiry = Number(
      this.config.get<string>("AWS_S3_PRESIGN_EXPIRES_SECONDS", "900"),
    );
    // In Docker the app directory is mounted read-only, so dev bypass storage
    // must live in a writable temp location.
    this.devStorageRoot = join(tmpdir(), "nexus-dev-document-storage");
  }

  /**
   * Generates a presigned PUT URL so the frontend can upload directly to S3.
   * The fileKey encodes userId/reservationId/type to prevent path traversal.
   *
   * When BYPASS_S3=true (dev mode), returns uploadUrl='bypass' to signal the
   * frontend to skip the actual S3 PUT and use the authenticated local dev
   * storage fallback instead.
   */
  async generatePresignedUpload(
    userId: string,
    reservationId: string,
    type: DocumentType,
    mimeType = "image/jpeg",
  ): Promise<{ uploadUrl: string; fileKey: string; expiresIn: number }> {
    const ext = S3Service.mimeToExtension(mimeType);
    const fileKey = `docs/${userId}/${reservationId}/${type}-${Date.now()}.${ext}`;

    // Dev bypass: skip real S3 presigning only when document storage bypass is enabled.
    if (this.isBypassStorageEnabled()) {
      return { uploadUrl: "bypass", fileKey, expiresIn: 900 };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: mimeType,
      Metadata: { userId, reservationId, type },
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: this.uploadExpiry,
    });

    return { uploadUrl, fileKey, expiresIn: this.uploadExpiry };
  }

  /** Maps a MIME type to a file extension for the S3 key. */
  private static mimeToExtension(mimeType: string): string {
    const map: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "application/pdf": "pdf",
    };
    return map[mimeType] ?? "bin";
  }

  /**
   * Generates a short-lived presigned GET URL for operator or customer to view a document.
   * Never returns the raw file key.
   */
  async generatePresignedRead(fileKey: string): Promise<string> {
    // Dev bypass: customer/operator document reads go through the authenticated local endpoint.
    if (this.isBypassStorageEnabled()) {
      return "https://via.placeholder.com/400x300?text=Dev+Doc";
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });
    return getSignedUrl(this.s3, command, { expiresIn: this.readExpiry });
  }

  /**
   * Deletes an S3 object — used by document-cleanup BullMQ job.
   */
  async deleteObject(fileKey: string): Promise<void> {
    if (this.isBypassStorageEnabled()) {
      const filePath = this.resolveDevStoragePath(fileKey);
      await rm(filePath, { force: true });
      return;
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }),
      );
    } catch (err) {
      this.logger.error(`Failed to delete S3 object ${fileKey}`, err);
      throw err;
    }
  }

  isBypassStorageEnabled(): boolean {
    return process.env.BYPASS_S3 === "true";
  }

  async saveBypassObject(
    fileKey: string,
    bytes: Buffer,
  ): Promise<{ size: number; contentType: string }> {
    if (!this.isBypassStorageEnabled()) {
      throw new Error("Bypass document storage is not enabled.");
    }

    const filePath = this.resolveDevStoragePath(fileKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, bytes);

    return {
      size: bytes.byteLength,
      contentType: this.getContentTypeForFileKey(fileKey),
    };
  }

  async readBypassObject(
    fileKey: string,
  ): Promise<{ bytes: Buffer; contentType: string }> {
    if (!this.isBypassStorageEnabled()) {
      throw new Error("Bypass document storage is not enabled.");
    }

    const filePath = this.resolveDevStoragePath(fileKey);
    const bytes = await readFile(filePath);

    return {
      bytes,
      contentType: this.getContentTypeForFileKey(fileKey),
    };
  }

  private resolveDevStoragePath(fileKey: string): string {
    const normalizedKey = normalize(fileKey).replace(/^(\.\.(\/|\\|$))+/, "");
    return join(this.devStorageRoot, normalizedKey);
  }

  private getContentTypeForFileKey(fileKey: string): string {
    const extension = extname(fileKey).toLowerCase();
    if (extension === ".jpg" || extension === ".jpeg") {
      return "image/jpeg";
    }
    if (extension === ".png") {
      return "image/png";
    }
    if (extension === ".pdf") {
      return "application/pdf";
    }
    return "application/octet-stream";
  }
}
