"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { useRouter } from "next/navigation";


export default function AITrainingForm({ zipUrl, prompt }: { zipUrl: string, prompt: string }) {
    const { toast } = useToast()
    const [steps, setSteps] = useState<number>(1000)
    const [learningRate, setLearningRate] = useState<number[]>([0.0004])
    const [batchSize, setBatchSize] = useState<number>(1)
    const [specificLayersTrained, setSpecificLayersTrained] = useState<number[]>([])
    const [trainingName, setTrainingName] = useState<string>("")
    const [loraRank, setLoraRank] = useState<string>("8")
    const [triggerWord, setTriggerWord] = useState<string>("UNST")
    const [optimizer, setOptimizer] = useState<string>("adamw8bit")
    const [captionDropoutRate, setCaptionDropoutRate] = useState<number[]>([0.05])
    const [autoCaption, setAutoCaption] = useState<boolean>(false)
    const [resolution, setResolution] = useState<string>("512,768,1024");
    const [isTrainingStarted, setIsTrainingStarted] = useState<boolean>(false);
    const [trainingId, setTrainingId] = useState('');
    const router = useRouter();


    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        // Check if any field is empty or invalid
        if (steps == 0 ||
            learningRate.length == 0 ||
            batchSize === 0 ||
            trainingName.trim() === "" ||
            loraRank === "" ||
            triggerWord.trim() === "" ||
            optimizer === "" ||
            captionDropoutRate.length == 0 ||
            resolution.trim() === "") {
            toast({ title: "Please fill all details" })
            return
        }

        const dataToSend = {
            images_url: zipUrl,
            steps: steps,
            learning_rate: learningRate[0],
            batch_size: batchSize,
            specific_layers_trained: specificLayersTrained,
            training_name: trainingName,
            lora_rank: loraRank,
            trigger_Word: triggerWord,
            optimizer,
            caption_dropout_rate: captionDropoutRate[0],
            autocaption: autoCaption,
            resolution,
            huggingface_repo_id: `bb1070/${trainingName}`,
        }

        console.log("data to send", dataToSend)
        try {
            toast({
                title: "Training started...",
            })
            setIsTrainingStarted(true)
            const response = await axios.post("http://localhost:4000/api/training/queue-training", dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

            setTrainingId(response.data.data.trainingId)
            poll(response.data.data.trainingId);
            dataToSend.training_id = response.data.data.trainingId;
            dataToSend.status = "queued";
            dataToSend.prompt = prompt;

            const res = await axios.post('/api/addTrainings', dataToSend)
            console.log("Response from API:", response.data)

        } catch (err) {
            console.log(err)
        }
    }

    const getLogs = async () => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`http://localhost:4000/api/training/get-logs/${trainingId}`); // Call your API
                const logs = response.data; // Adjust based on your API's response structure
                console.log(logs);
                // Stop polling if the status is one of the terminal states
            } catch (error) {
                console.error('Error during polling:', error.message || error);
                clearInterval(interval); // Clear the interval to stop polling
            }
        }, 5000);
    }

    const poll = async (id: string) => {
        const logInterval: { current: NodeJS.Timeout | null } = { current: null }; // To track the logging interval

        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`http://localhost:4000/api/training/check-status/${id}`); // Call your API
                const status = response.data.status; // Adjust based on your API's response structure
                console.log(`Status: ${status}`);

                // If the status is "started", ensure getLogs is running
                if (status === 'started') {
                    if (!logInterval.current) {
                        logInterval.current = setInterval(getLogs, 5000); // Start logging
                    }
                } else {
                    // If not "started", stop the logging interval if it exists
                    if (logInterval.current) {
                        clearInterval(logInterval.current);
                        logInterval.current = null;
                    }

                    // Stop polling if the status is one of the terminal states
                    if (['stopped', 'failed', 'completed'].includes(status)) {
                        console.log(`Polling stopped. Final status: ${status}`);
                        clearInterval(interval); // Clear the polling interval
                    }
                }
            } catch (error) {
                console.error('Error during polling:', error.message || error);
                clearInterval(interval); // Clear the polling interval to stop polling
                if (logInterval.current) {
                    clearInterval(logInterval.current); // Clear the logging interval as well
                    logInterval.current = null;
                }
            }
        }, 5000);
    };

    const terminateTraining = async (id) => {
        try {
            const response = await axios.get(`http://localhost:4000/api/training/initiate-termination/${id}`); // Call your API
            const status = response.data.status; // Adjust based on your API's response structure
            console.log(`Status: ${status}`);
        } catch (error) {
            console.error('Error during polling:', error.message || error);
        }
    }


    return (
        <div className="w-full h-screen">

            {!isTrainingStarted &&
                <div className="w-full h-screen flex justify-center items-center">
                    <Card className="w-full max-w-[80%] mx-auto border">
                        <CardHeader>
                            <CardTitle>AI Training Parameters</CardTitle>
                            <CardDescription>Adjust the training parameters for your AI model</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="steps">Steps: {steps}</Label>
                                    <Input
                                        id="batch-size"
                                        type="number"
                                        min={0}
                                        max={4000}
                                        value={steps}
                                        onChange={(e) => setSteps(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="learning-rate">Learning Rate: {learningRate[0].toFixed(6)}</Label>
                                    <Slider
                                        id="learning-rate"
                                        min={0}
                                        max={0.0004}
                                        step={0.000001}
                                        value={learningRate}
                                        onValueChange={setLearningRate}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="batch-size">Batch Size</Label>
                                    <Input
                                        id="batch-size"
                                        type="number"
                                        min={1}
                                        max={8}
                                        value={batchSize}
                                        onChange={(e) => setBatchSize(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Specific Layers Trained</Label>
                                    <div className="flex space-x-4">
                                        {[7, 12, 16, 20].map((layer) => (
                                            <div key={layer} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`layer-${layer}`}
                                                    checked={specificLayersTrained.includes(layer)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSpecificLayersTrained([...specificLayersTrained, layer])
                                                        } else {
                                                            setSpecificLayersTrained(specificLayersTrained.filter((l) => l !== layer))
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`layer-${layer}`}>{layer}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="training-name">Training Name</Label>
                                    <Input
                                        id="training-name"
                                        value={trainingName}
                                        onChange={(e) => setTrainingName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>LoRA Rank</Label>
                                    <RadioGroup value={loraRank} className="flex" onValueChange={setLoraRank}>
                                        {[8, 16, 32, 64].map((rank) => (
                                            <div key={rank} className="flex items-center space-x-2">
                                                <RadioGroupItem value={rank.toString()} id={`rank-${rank}`} />
                                                <Label htmlFor={`rank-${rank}`}>{rank}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="trigger-word">Trigger Word</Label>
                                    <Input
                                        id="trigger-word"
                                        value={triggerWord}
                                        onChange={(e) => setTriggerWord(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="optimizer">Optimizer</Label>
                                    <Select value={optimizer} onValueChange={setOptimizer}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select optimizer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="adamw8bit">AdamW8bit</SelectItem>
                                            <SelectItem value="prodigy">Prodigy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="caption-dropout-rate">Caption Dropout Rate: {captionDropoutRate[0].toFixed(2)}</Label>
                                    <Slider
                                        id="caption-dropout-rate"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={captionDropoutRate}
                                        onValueChange={setCaptionDropoutRate}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="auto-caption"
                                        checked={autoCaption}
                                        onCheckedChange={setAutoCaption}
                                    />
                                    <Label htmlFor="auto-caption">Auto Caption</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="resolution">Resolution</Label>
                                    <Input
                                        id="resolution"
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full">Submit</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                }

            {
                isTrainingStarted &&
                <>
                    <h1 className="text-2xl font-bold text-center mt-4">Training started</h1>
                    <div className="flex justify-end items-center gap-4">
                        <Button className="border-white border-opacity-40 border" onClick={() => terminateTraining(trainingId)}>stop</Button>
                        <Button className="border-white border-opacity-40 border" onClick={() => router.refresh()}>Add new Training</Button>
                    </div>
                </>
            }
        </div>

    )
}

