import React, { useState } from 'react'
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Button } from '@/components/ui/button'
import axios from 'axios';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query'


export const CheckStatusButton = ({ id }: { id: string }) => {
    const { toast } = useToast();
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [status, setStatus] = useState(null);
     const queryClient = useQueryClient()

    const checkStatus = async (trainingId: string) => {
        setIsCheckingStatus(true);
        try {
            const res = await axios(`https://lora-training-backend.getstudioai.com/api/training/check-status-only/${trainingId}`);
            console.log('res', res);
            let status = res.data.status;
            setStatus(status);

        if (status == 'completed' || status == 'failed') {
                const response = await axios.post(`/api/updateStatus`, {
                    trainingId:id,
                    status
                });
                console.log('response', response);
                queryClient.invalidateQueries({ queryKey: ['all-trainings'] });
            }

        } catch (err) {
            console.log("Error in checking status", err);
            toast({
                title: "Error in checking status...",
                className: "bg-black",
            })
        }
        setIsCheckingStatus(false);
    }
    return (
        <div className="max-h-[100px] overflow-y-auto pr-2">
            <Button className={cn('border border-white border-opacity-40',
                status == 'started' && 'bg-yellow-300 text-black border-transparent',
                status == 'completed' && 'bg-green-300 text-black border-transparent',
            )} disabled={isCheckingStatus} onClick={() => checkStatus(id)}>
                {isCheckingStatus && <Loader2 className="animate-spin" />}
                {status ? status : "Check Status"}
            </Button>
        </div>
    )
}