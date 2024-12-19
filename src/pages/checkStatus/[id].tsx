import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios';
import { useRouter } from 'next/router';
import MinimalTrainingProgress from '../components/minimalCard';
import { useQueryClient } from '@tanstack/react-query'

const fetchTraining = async (trainingId: string | undefined | string[]) => {
    const res = await axios.post('/api/getTrainingInfo', {
        trainingId
    });
    return res.data;
}

const fetchTrainingStatus = async (trainingId: string | undefined | string[]) => {
    const res = await axios(`https://lora-training-backend.getstudioai.com/api/training/check-status/${trainingId}`);

    return res;
}

const CheckStatus = () => {
    const queryClient = useQueryClient()
    const router = useRouter();
    const [status, setStatus] = useState('idle');
    const trainingId = router.query.id;
    const [logs, setLogs] = useState([]);

    const { data:trainingStatus } = useQuery({
        queryKey: ['training-status'],
        queryFn: async () => {
            const response = await fetchTrainingStatus(trainingId);
            const status = response.data.status;
            console.log("status:", status, response.data);
            let message = parseMessage(response?.data?.log?.message);
            setLogs((prev) => [...prev, message])
            setStatus(status);
            return response.data;
        },
        enabled: !!trainingId,
        refetchInterval: (status != 'completed') ? 5000 : false
    });

    const { data, isLoading } = useQuery({
        queryKey: ['training'],
        queryFn: async () => {
            const res = await fetchTraining(trainingId);
            return res.training;
        },
        enabled: !!trainingId,
    });

    useEffect(() => {
        console.log("sanil", status);
        queryClient.invalidateQueries({ queryKey: ['training-status'] });
    }, [status]);

    return (
        <div className=''>
            <h1 onClick={()=> router.push('/')} className="cursor-pointer text-2xl font-bold text-center mt-4">Training Info and Status</h1>

            <div className='grid grid-cols-2 mt-4 h-[80vh] relative'>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-black">
                    {!isLoading && data && <code className='text-sm'>{JSON.stringify(data, null, 2)}</code>}
                </pre>

                <div className='text-white px-4 h-full overflow-auto '>

                    <h1 className='absolute top-1 left-[43%] text-red-400 px-2 py-1 border border-black border-opacity-40 rounded-lg inline-block'>
                        {status}
                    </h1>

                        <MinimalTrainingProgress items={logs} />
                </div>
            </div>

        </div>
    )
}

export default CheckStatus;


function parseMessage(message) {
    console.log("message:", message);
    if (!message) return {};
    const progressMatch = message.match(/(\d+)%/);
    const stepMatch = message.match(/(\d+)\/(\d+)/);
    const timeMatch = message.match(/\[(\d{2}:\d{2})<(\d{2}:\d{2})/);
    const lrMatch = message.match(/lr:\s([\d.e+-]+)/);
    const lossMatch = message.match(/loss:\s([\d.e+-]+)/);

    return {
        progress: progressMatch ? parseInt(progressMatch[1], 10) : 0,
        currentStep: stepMatch ? parseInt(stepMatch[1], 10) : 0,
        totalSteps: stepMatch ? parseInt(stepMatch[2], 10) : 0,
        elapsedTime: timeMatch ? timeMatch[1] : "00:00",
        remainingTime: timeMatch ? timeMatch[2] : "00:00",
        learningRate: lrMatch ? parseFloat(lrMatch[1]) : 0.0,
        loss: lossMatch ? parseFloat(lossMatch[1]) : 0.0
    };
}