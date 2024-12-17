import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../utils/prisma";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { training_id, status } = req.body;

        const trainings = await prisma.trainings.update({
            where: {
                id: training_id,
            },
            data: {
                status: status,
            },
        });

        return res.status(200).json(trainings);
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" });
    }
}