import { OpenAI } from "openai";
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize OpenAI and AWS SDK
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { imageUrls, product } = req.body;
  console.log("payload", imageUrls, product);
  try {



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
      filename: index,
      caption: `UNST ${captionTexts[index]?.trim()}` || "No caption generated",
      order: index + 1,
    }));

    res.status(200).json({ imageUrls,captions });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
