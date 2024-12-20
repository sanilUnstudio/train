import { prisma } from "../../../utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { trainingId, status } = req.body;

  if (!trainingId || !status) {
    return res
      .status(400)
      .json({ error: "Missing required fields: trainingId or status" });
  }

  try {
    const training = await prisma.trainings.updateMany({
      where: {
        training_id: trainingId,
      },
      data: {
        status: status,
      },
    });

    if (training.count === 0) {
      return res.status(404).json({ error: "Training not found" });
    }

    res
      .status(200)
      .json({ message: "Training updated successfully", training });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
