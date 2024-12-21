import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../utils/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const trainings = await prisma.trainings.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({ trainings });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
