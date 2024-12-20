import React, { useState } from 'react'
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query'

const StopButton = ({ id }: { id: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(0);

  const handleClick = async (trainingId: string) => {
    try {

      setIsLoading(true);
      const response = await axios.get(`https://lora-training-backend.getstudioai.com/api/training/check-status-only/${id}`);
      if (response.data.status != 'started' || response.data.status == 'unknown') {
        toast({
          title: "Training is in queue or not started so can't stop",
          className: "bg-black",
        })
        setIsLoading(false);
        return;
      }
      const res = await axios(`https://lora-training-backend.getstudioai.com/api/training/initiate-termination/${trainingId}`)
      console.log("termination", res);
      polling(trainingId);

    } catch (err) {
      console.log("Error in stoping training", err);
      toast({
        title: "Error in stoping training",
        className: "bg-black",
      })
      setIsLoading(false);
    }
  }

  const polling = async (id) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`https://lora-training-backend.getstudioai.com/api/training/check-status-only/${id}`);
        console.log("Polling:", res.data.status);
        setCount((prev) => prev + 1);

        if (res.data.status === 'stopped' || count >= 10) {
          clearInterval(interval);
          const response = await axios.post(`/api/updateStatus`, {
            trainingId: id,
            status: "stopped"
          });
          queryClient.invalidateQueries({ queryKey: ['all-trainings'] });
        }
      } catch (err) {
        console.error("Error in checking status:", err);

        toast({
          title: "Error in checking status...",
          className: "bg-black",
        });
      }
      setIsLoading(false);
    }, 3000); // Adjust interval as needed
  };


  return (
      <Button className='border border-white border-opacity-40' onClick={() => handleClick(id)}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Stop'}</Button>
  )
}

export default StopButton