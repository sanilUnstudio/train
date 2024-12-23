'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios";
import JSZip from "jszip";
import  { saveAs } from "file-saver";
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast"


type Step1Props = {
    setStep: React.Dispatch<React.SetStateAction<number>>;
    setZipUrl: React.Dispatch<React.SetStateAction<string>>;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    setProductImage: React.Dispatch<React.SetStateAction<string>>;  
}

type CaptionsData = {
    imageUrl: string;
    caption: string;
}

export default function Step1({ setStep, setZipUrl, setPrompt, setProductImage }:Step1Props) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [productName, setProductName] = useState("");
    const [allImages, setAllImages] = useState<File[]>([]);
    const [captionsData, setCaptionsData] = useState<CaptionsData[]>([]);
    const [zipStatus, setZipStatus] = useState(false);
    const router = useRouter();

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files) as File[]; // Convert FileList to Array
        setAllImages(selectedFiles); // Append new files to existing state
        console.log("allImages:", selectedFiles)
        e.target.value = ""; // Clear the input value to allow re-upload of the same file
    };

    const sendRequest = async (product:string, files:File[]) => {
        try {
            setIsLoading(true);
            // Create a FormData object
            const dataUrls = await Promise.all(
                files.map(async (file) => {

                    const response = await fetch('/api/getPresignedUrl', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileName: file.name,
                            fileType: file.type,
                        }),
                    });

                    const { uploadUrl } = await response.json();

                    if (!uploadUrl) {
                        throw new Error('Failed to get upload URL.');
                    }

                    // Upload file to S3 using the pre-signed URL
                    const s3Response = await fetch(uploadUrl, {
                        method: 'PUT',
                        body: file,
                        headers: {
                            'Content-Type': file.type,
                        },
                    });
                      console.log("sanil",s3Response, uploadUrl)
                    if (!s3Response.ok) {
                        throw new Error('Failed to upload file to S3.');
                    }
                    return s3Response.url.split('?X')[0]
                })
            )
          
            // Send the POST request
            const response = await axios.post("/api/getCaptions", {
                product,
                imageUrls: dataUrls
            });

            console.log("Response from API:", response.data);
            let imagesUrls = response.data.imageUrls;
            let captions = response.data.captions
            const mergedData = captions.map((item, index) => ({
                ...item,
                imageUrl: imagesUrls[index],
            }));

            setCaptionsData(mergedData);// Store the response data to display captions
            setPrompt(mergedData[0].caption)
            setProductImage(mergedData[0].imageUrl)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Axios error:", error.response?.data || error.message);
            } else {
                console.error("Unexpected error:", error);
            }
            toast({ title: "Error in generating captions", className: "bg-black", })
        } finally {
            setIsLoading(false);
        }
    };

    const handleCaptionChange = (index: number, newCaption: string) => {
        setCaptionsData((prevData:CaptionsData[]) =>
            prevData.map((item:CaptionsData, i) =>
                i === index ? { ...item, caption: newCaption } : item
            )
        );
    };

    const generateZip = async (data:CaptionsData[]) => {
        setZipStatus(true)
        const zip = new JSZip();

        for (let i = 1; i <= data.length; i++) {
            let item = data[i-1];
            // Fetch the image as a blob
            const imageResponse = await axios.get(item.imageUrl, { responseType: "blob" });
            const imageBlob = imageResponse.data;

            // Add the image to the zip
            zip.file(`${i}.jpg`, imageBlob);

            // Add the caption as a text file
            zip.file(`${i}.txt`, item.caption);
        }

        // Generate the zip file
        const content = await zip.generateAsync({ type: "blob" });
        console.log(`ZIP file size: ${content.size} bytes`);

        // Convert Blob to Base64
        const fileContent = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(new Uint8Array(reader.result)); // Binary data
            reader.readAsArrayBuffer(content); // Read as ArrayBuffer, not DataURL
        });


        let key = `${productName}-${uuidv4()}.zip`;
        try {
            const response = await fetch('/api/getPresignedUrl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: key,
                    fileType: 'application/zip',
                }),
            });

            const { uploadUrl } = await response.json();

            if (!uploadUrl) {
                throw new Error('Failed to get upload URL.');
            }

            // Upload file to S3 using the pre-signed URL
            const s3Response = await fetch(uploadUrl, {
                method: 'PUT',
                body: fileContent, // Binary data
                headers: {
                    'Content-Type': 'application/zip',
                },
            });

            if (!s3Response.ok) {
                throw new Error('Failed to upload file to S3.');
            }
            let url = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`
            console.log("zipUrl",url);
            setZipUrl(url);
            setStep(2);

        } catch (error) {
            console.error("Error uploading zip file:", error);
        }
        // Save the zip file locally (if needed)
        saveAs(content, `${productName}-${uuidv4()}.zip`);
        setZipStatus(false);
    };



    const handleRemoveImage = (name) => {
        const data = allImages.filter((f, i) => f.name !== name);
        setAllImages(data);
    };

    return (
        <div className="container mx-auto p-4 w-[80%]">
            <div className='flex items-center justify-between my-4'>
                <h1 className="text-2xl font-bold">Add Images</h1>

                <div className='flex items-center gap-2'>
                    <Button onClick={() => router.push("/zipUrl")} className='border border-white border-opacity-40'>Train with zipUrl</Button>
                    <Button onClick={() => router.push("/allTrainings")} className='border border-white border-opacity-40'>All Trainings</Button>
                </div>
            </div>
            <div className='flex flex-col gap-2'>
                <Input
                    type="text"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                />
                <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                />
                <div className='flex justify-end'>
                    <Button className='border border-white border-opacity-40' type="submit" onClick={() => sendRequest(productName, allImages)} disabled={(isLoading || zipStatus)}>
                        {isLoading ? 'Generating...' : 'Generate Captions'}
                    </Button>

                </div>
            </div>

            <div className='h-[75vh] mt-4'>
                {captionsData.length > 0 ? (
                    <div className="h-full">
                        <div className='flex items-center justify-between mb-4 h-8'>
                            <h2 className="text-xl font-bold ">Uploaded Images and Captions</h2>
                            <Button className='border border-white border-opacity-40' disabled={zipStatus} onClick={() => generateZip(captionsData)}>
                                {zipStatus ? 'Generating...' : 'Generate Zip'}
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 h-[calc(100%-5rem)] overflow-auto">
                            {captionsData.map((item, index) => (
                                <div key={index} className="border border-white border-opacity-40 p-1 h-[23.5rem] rounded shadow-sm">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.caption}
                                        className="w-full h-64 object-contain rounded"
                                    />
                                    <textarea
                                        className="w-full h-28 border border-white border-opacity-40 rounded p-2 bg-black"
                                        value={item.caption}
                                        onChange={(e) => handleCaptionChange(index, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) :

                    <div style={{ display: "flex", flexWrap: "wrap", marginTop: "20px" }}>
                        {allImages.map((file, index) => (
                            <div
                                key={index}
                                className='m-[10px] p-[5px] rounded-lg'
                                style={{
                                    border: "1px solid #ccc",
                                    padding: "5px",
                                    position: "relative",
                                    width: "180px",
                                    height: "180px"
                                }}
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`uploaded-${index}`}
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                                <X onClick={() => handleRemoveImage(file.name)} size={18} className='absolute top-0.5 right-0.5 z-10 text-red-600 cursor-pointer' />
                            </div>
                        ))}
                    </div>
                }
            </div>

        </div>
    );
}


