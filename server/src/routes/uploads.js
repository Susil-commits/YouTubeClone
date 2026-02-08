import { Router } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = Router();

router.post("/upload/sign", async (req, res) => {
  try {
    const { filename, contentType } = req.body || {};
    if (!filename) return res.status(400).json({ error: "missing_filename" });

    const { AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
    if (!AWS_S3_BUCKET || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      return res.status(501).json({ error: "s3_not_configured" });
    }

    const s3 = new S3Client({
      region: AWS_REGION,
      credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY }
    });

    const Key = `${Date.now()}_${filename.replace(/\s+/g, "_").slice(0, 100)}`;
    const command = new PutObjectCommand({ Bucket: AWS_S3_BUCKET, Key, ContentType: contentType || "application/octet-stream" });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const publicUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${Key}`;
    res.json({ url, key: Key, publicUrl });
  } catch (e) {
    console.error("Error creating signed URL", e);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
