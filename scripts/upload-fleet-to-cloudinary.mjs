import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const sourceRoot = path.resolve(
  cwd,
  process.env.CLOUDINARY_FLEET_SOURCE_DIR ?? "public/fleet/cmn",
);
const manifestPath = path.resolve(sourceRoot, "manifest.json");
const outputPath = path.resolve(
  cwd,
  process.env.CLOUDINARY_FLEET_OUTPUT ??
    "vehicle-assets-ready/cmn/cloudinary-manifest.json",
);
const folderPrefix = (
  process.env.CLOUDINARY_FLEET_FOLDER ?? "nexus-mobility/fleet/cmn"
).replace(/^\/+|\/+$/g, "");
const isDryRun = process.argv.includes("--dry-run");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
  );
  process.exit(1);
}

async function readFleetManifest() {
  const raw = await readFile(manifestPath, "utf8");
  return JSON.parse(raw);
}

async function collectUploads(manifest) {
  const uploads = [];

  for (const [slug, assets] of Object.entries(manifest.vehicles ?? {})) {
    for (const asset of assets) {
      const localPath = path.join(sourceRoot, slug, asset.file);
      const publicId = `${folderPrefix}/${slug}/${path.parse(asset.file).name}`;
      uploads.push({
        slug,
        role: asset.role ?? "gallery",
        fileName: asset.file,
        localPath,
        publicId,
      });
    }
  }

  return uploads;
}

function signUpload(params, secret) {
  const canonical = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${canonical}${secret}`)
    .digest("hex");
}

async function uploadAsset(entry) {
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    invalidate: "true",
    overwrite: "true",
    public_id: entry.publicId,
    timestamp: String(timestamp),
    unique_filename: "false",
    use_filename: "false",
  };

  const signature = signUpload(uploadParams, apiSecret);
  const body = new FormData();
  const bytes = await readFile(entry.localPath);

  body.set(
    "file",
    new Blob([bytes], { type: "image/webp" }),
    path.basename(entry.localPath),
  );
  body.set("api_key", apiKey);
  body.set("invalidate", uploadParams.invalidate);
  body.set("overwrite", uploadParams.overwrite);
  body.set("public_id", uploadParams.public_id);
  body.set("signature", signature);
  body.set("timestamp", uploadParams.timestamp);
  body.set("unique_filename", uploadParams.unique_filename);
  body.set("use_filename", uploadParams.use_filename);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Upload failed for ${entry.publicId}: ${response.status} ${errorText}`,
    );
  }

  return response.json();
}

function buildSummary(uploadResults) {
  const vehicles = {};

  for (const result of uploadResults) {
    vehicles[result.slug] ??= [];
    vehicles[result.slug].push({
      file: result.fileName,
      role: result.role,
      publicId: result.publicId,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
      version: result.version,
    });
  }

  return {
    cloudName,
    folderPrefix,
    generatedAt: new Date().toISOString(),
    sourceRoot,
    vehicleCount: Object.keys(vehicles).length,
    assetCount: uploadResults.length,
    vehicles,
  };
}

async function main() {
  const manifest = await readFleetManifest();
  const uploads = await collectUploads(manifest);

  console.log(
    `${isDryRun ? "Dry run:" : "Uploading:"} ${uploads.length} assets from ${sourceRoot}`,
  );
  console.log(`Cloudinary folder prefix: ${folderPrefix}`);

  if (isDryRun) {
    for (const entry of uploads) {
      console.log(`${entry.publicId} <= ${entry.localPath}`);
    }
    return;
  }

  const results = [];

  for (const entry of uploads) {
    console.log(`Uploading ${entry.publicId}...`);
    const uploaded = await uploadAsset(entry);
    results.push({
      slug: entry.slug,
      role: entry.role,
      fileName: entry.fileName,
      publicId: entry.publicId,
      secure_url: uploaded.secure_url,
      width: uploaded.width,
      height: uploaded.height,
      bytes: uploaded.bytes,
      format: uploaded.format,
      version: uploaded.version,
    });
  }

  const summary = buildSummary(results);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`Uploaded ${summary.assetCount} assets across ${summary.vehicleCount} vehicles.`);
  console.log(`Saved manifest to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
