import { OpenAI } from "openai";
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize OpenAI and AWS SDK
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

export const config = {
  maxDuration: 60,
};


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
    const response = await generateCaptionForImages(imageUrls, product);
    console.log("response", response);
  
    res.status(200).json({ imageUrls,captions:response });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function generateCaptionForImages(imageUrls, product) {
  const captionsArray = [];

  for (const url of imageUrls) {
    const contextMessage = `You are a professional product copywriter and photographer. Analyze the product image provided and create a short, precise, and individual description. The product in question is a ${product}.`;

    const messages = [
      {
        role: "system",
        content:
          "You are an expert product copywriter who specializes in creating flowing, detailed image descriptions, ensuring each description is clear and concise.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: contextMessage },
          {
            type: "image_url",
            image_url: {
              url: url,
              detail: "high",
            },
          },
        ],
      },
    ];

    console.log("messages for image", url, messages);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 4000,
        temperature: 0.3,
      });

      const caption = "UNST"+" "+response.choices[0].message.content.trim();

      // Save the URL and caption in the array
      captionsArray.push({ imageUrl: url, caption });
    } catch (error) {
      console.error("Error generating caption for image:", url, error);
      captionsArray.push({
        imageUrl: url,
        caption: "Error generating caption",
      });
    }
  }

  return captionsArray;
}
