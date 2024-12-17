'use client'
import { useState } from "react";
import Step1 from "./components/Step1";
import AITrainingForm from "./components/AITrainingForm";
export default function Home() {
  const [step, setStep] = useState(1);
  const [zipUrl, setZipUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [productImage, setProductImage] = useState('');
  return (
    <div className="p-4 w-full h-screen flex items-center justify-center">
      {step == 1 && <Step1 setStep={setStep} setZipUrl={setZipUrl} setPrompt={setPrompt} setProductImage={setProductImage} />}
      {step == 2 && <AITrainingForm zipUrl={zipUrl} prompt={prompt} productImage={productImage} />}
    </div>
  );
}
