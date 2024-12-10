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



export default function AITrainingForm({zipUrl}: {zipUrl: string}) {
    const { toast } = useToast()
    const [steps, setSteps] = useState<number[]>([4000])
    const [learningRate, setLearningRate] = useState<number[]>([0.0004])
    const [batchSize, setBatchSize] = useState<number>(1)
    const [specificLayersTrained, setSpecificLayersTrained] = useState<number[]>([])
    const [trainingName, setTrainingName] = useState<string>("")
    const [loraRank, setLoraRank] = useState<string>("8")
    const [triggerWord, setTriggerWord] = useState<string>("UNST")
    const [optimizer, setOptimizer] = useState<string>("adamw8bit")
    const [captionDropoutRate, setCaptionDropoutRate] = useState<number[]>([0])
    const [autoCaption, setAutoCaption] = useState<boolean>(false)
    const [resolution, setResolution] = useState<string>("512,768,1024");
    const [imageUrl, setImageUrl] = useState<string>(zipUrl)

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()

        // Check if any field is empty or invalid
        if (steps.length == 0 ||
            learningRate.length == 0 ||
            batchSize === 0 ||
            specificLayersTrained.length === 0 ||
            trainingName.trim() === "" ||
            loraRank === "" ||
            triggerWord.trim() === "" ||
            optimizer === "" ||
            captionDropoutRate.length == 0 ||
            resolution.trim() === "") {
            toast({
                title: "Please fill all details",
            })
            return
        }

        console.log("Form submitted with:", {
            zipUrl:zipUrl,
            steps: steps[0],
            learningRate: learningRate[0],
            batchSize,
            specificLayersTrained,
            trainingName,
            loraRank,
            triggerWord,
            optimizer,
            captionDropoutRate: captionDropoutRate[0],
            autoCaption,
            resolution
        })
        // Here you would typically send this data to your backend or perform some action
    }

    return (
        <Card className="w-full max-w-[80%] mx-auto">
            <CardHeader>
                <CardTitle>AI Training Parameters</CardTitle>
                <CardDescription>Adjust the training parameters for your AI model</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                        <Label htmlFor="steps">Steps: {steps[0]}</Label>
                        <Slider
                            id="steps"
                            min={0}
                            max={4000}
                            step={1}
                            value={steps}
                            onValueChange={setSteps}
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
    )
}

