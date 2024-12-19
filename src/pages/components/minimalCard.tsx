'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TrainingProgressItem {
    progress: number
    currentStep: number
    totalSteps: number
    elapsedTime: string
    remainingTime: string
    learningRate: number
    loss: number
}

export default function MinimalTrainingProgress({ items }: { items: TrainingProgressItem[] }) {

    if (Array.isArray(items) && items.length > 0 && Object.keys(items[0]).length === 0) {
        return <div>
            <h1>No Logs Training is completed</h1>
        </div>
    }
    return (
        <div className="space-y-4 w-full max-w-md mx-auto">
            {items.map((item, index) => (
                <Card key={index} className="">
                    <CardContent className="py-1 px-2 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Progress</span>
                            <span>{item?.progress}%</span>
                        </div>
                        <Progress value={item?.progress} className="h-1" />
                        <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className='flex items-center gap-1'>
                                <p className="text-gray-500 dark:text-gray-400">Steps</p>
                                <p className="font-medium">{item?.currentStep}/{item?.totalSteps}</p>
                            </div>
                            <div className='flex items-center gap-1'>
                                <p className="text-gray-500 dark:text-gray-400">Time</p>
                                <p className="font-medium">{item?.elapsedTime} | {item?.remainingTime}</p>
                            </div>
                            <div className='flex items-center gap-1'>
                                <p className="text-gray-500 dark:text-gray-400">Learning Rate</p>
                                <p className="font-medium">{item?.learningRate?.toExponential(2)}</p>
                            </div>
                            <div className='flex items-center gap-1'>
                                <p className="text-gray-500 dark:text-gray-400">Loss</p>
                                <p className="font-medium">{item?.loss?.toFixed(5)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

