import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL is picked up automatically by the SDK, but we call
// `config()` explicitly so a missing/malformed value fails fast here
// instead of surfacing as an opaque upload error later.
if (!process.env.CLOUDINARY_URL) {
  throw new Error("CLOUDINARY_URL environment variable is missing");
}

cloudinary.config({ secure: true });

export interface UploadImageResult {
  url: string;
  publicId: string;
}

export async function uploadImage(file: File, folder = "dev-event"): Promise<UploadImageResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<UploadImageResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }

        resolve({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
      },
    );

    stream.end(buffer);
  });

  return result;
}

export default cloudinary;
