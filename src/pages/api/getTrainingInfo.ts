import { prisma } from "../../../utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { trainingId } = req.body;
    try {
        const training = await prisma.trainings.findMany({
            where: {
                training_id: trainingId
            }
        });
        res.status(200).json({ training });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}