import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../utils/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

     const {
       training_name,
       images_url,
       steps,
       batch_size,
       specific_layers_trained,
       lora_rank,
       trigger_Word,
       caption_dropout_rate,
       resolution,
       learning_rate,
       training_id,
       status,
       prompt,
       product_image,
     } = req.body;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const trainings = await prisma.trainings.create({
      data: {
        training_name,
        image_url: images_url,
        steps,
        batch_size,
        specific_layers_trained: specific_layers_trained.toString(),
        lora_rank,
        trigger_word: trigger_Word,
        caption_dropout_rate,
        resolution,
        learning_rate,
        training_id,
        status,
        prompt,
        product_image,
      },
    });
res.status(200).json({
  trainings: {
    ...trainings,
    id: trainings.id.toString(), // Convert BigInt to string
  },
});

  } catch (error) {
    console.log("Error processing request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
