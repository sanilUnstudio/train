import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS || "",
    secretAccessKey: process.env.AWS_ACCESS_SECRET || "",
  },

  region: process.env.AWS_REGION,
});
 
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, fileType } = req.body;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "Missing fileName or fileType" });
  }

  const folder = "training-products";
            const key = `${folder}/${uuidv4()}.webp`;

  try {
    console.log("key",key);
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600, // URL expiration time in seconds
    });

    res.status(200).json({ uploadUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: "Error generating presigned URL" });
  }
}
