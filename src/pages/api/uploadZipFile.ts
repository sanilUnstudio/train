import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
// /pages/api/upload.js

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '200mb' // Set desired value here
        }
    }
}

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },
  region: process.env.AWS_REGION,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileContent, fileName, fileSize } = req.body;

    if (!fileContent || !fileName || !fileSize) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bucketName = process.env.AWS_BUCKET_NAME;
    const fileKey = `uploads/${fileName}`; // Set S3 key path

    if (fileSize <= 30 * 1024 * 1024) {
      // Use PutObjectCommand for small files
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: Buffer.from(fileContent, "base64"), // Assuming fileContent is Base64
        ContentType: "application/zip",
      });

      await s3.send(command);

      const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
      return res.status(200).json({ fileUrl });
    } else {
      // Use multipart upload for large files
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: fileKey,
      });

      const { UploadId } = await s3.send(createCommand);

      const chunks = [];
      const buffer = Buffer.from(fileContent, "base64");

      for (let start = 0; start < buffer.length; start += CHUNK_SIZE) {
        chunks.push(buffer.slice(start, start + CHUNK_SIZE));
      }

      const uploadPromises = [];
      const parts = [];

      chunks.forEach((chunk, index) => {
        const uploadPartCommand = new UploadPartCommand({
          Bucket: bucketName,
          Key: fileKey,
          PartNumber: index + 1,
          UploadId: UploadId,
          Body: chunk,
        });

        uploadPromises.push(
          s3.send(uploadPartCommand).then((data) => {
            // Push the part details including the correct part number
            parts.push({ PartNumber: index + 1, ETag: data.ETag });
          })
        );
      });

      await Promise.all(uploadPromises);

      // Sort the parts by PartNumber before sending the complete command
      parts.sort((a, b) => a.PartNumber - b.PartNumber);

      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: fileKey,
        UploadId: UploadId,
        MultipartUpload: { Parts: parts },
      });

      await s3.send(completeCommand);
 

      const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
      return res.status(200).json({ fileUrl });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({ error: "File upload failed" });
  }
}
