import { OpenAI } from "openai";
import { S3, PutObjectCommand } from "@aws-sdk/client-s3";
import { IncomingForm, Files, Fields } from 'formidable';
import fs from "fs";

// Add type definitions for Next.js API handler
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false, // Disable built-in body parser to handle multipart form data
  },
};

// Initialize OpenAI and AWS SDK
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },
  region: process.env.AWS_REGION,
});

// Function to upload file to S3 and return the URL
const uploadImageAndGetUrl = async (file) => {
  const fileName = `${Date.now()}-${file.originalFilename}`;
  const fileContent = fs.readFileSync(file.filepath);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};

// Add type for parsed form data
interface ParsedForm {
  fields: Fields;
  files: Files;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {


    const form = new IncomingForm();
    const { fields, files }: ParsedForm = await new Promise(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      }
    );

    // Type assertion for product field
    const product = fields.product[0] as string;
    if (!product || !files.files) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const fileArray = Array.isArray(files.files) ? files.files : [files.files];

    // Upload images to S3
    const imageUrls = await Promise.all(
      fileArray.map((file) => uploadImageAndGetUrl(file))
    );

    // Prepare OpenAI request
    const contextMessage = `You are a professional product copywriter and photographer. Analyze these product images in detail and create a short, precise description for EACH image. The product in question is a ${product}.`;
 const messages = [
   {
     role: "system",
     content:
       "You are an expert product copywriter who specializes in creating flowing, detailed image descriptions, for every image that is given to you",
   },
   {
     role: "user",
     content: [
       { type: "text", text: contextMessage },
       ...imageUrls.map((url) => ({
         type: "image_url",
         image_url: {
           url: url,
           detail: "high",
         },
       })),
     ],
   },
 ];

    console.log("messages", messages);
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages,
      max_tokens: 4000,
      temperature: 0.3,
    });

    const rawContent = response.choices[0].message.content;

    // Process captions
    const captionTexts = rawContent
      .split(/Image \d+:/)
      .filter((text) => text.trim());

    const captions = imageUrls.map((url, index) => ({
      filename: fileArray[index].originalFilename,
      caption: captionTexts[index]?.trim() || "No caption generated",
      order: index + 1,
    }));

    res.status(200).json({ captions,imageUrls });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
