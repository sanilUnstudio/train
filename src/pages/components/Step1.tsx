'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";


export default function Step1({ setStep, setZipUrl, setPrompt  }) {
    const [isLoading, setIsLoading] = useState(false);
    const [productName, setProductName] = useState("");
    const [allImages, setAllImages] = useState([]);
    const [captionsData, setCaptionsData] = useState([]);
    const [zipStatus, setZipStatus] = useState(false)
    const router = useRouter();

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files); // Convert FileList to Array
        setAllImages((prevImages) => [...prevImages, ...selectedFiles]); // Append new files to existing state
        e.target.value = ""; // Clear the input value to allow re-upload of the same file
    };

    const sendRequest = async (product, files) => {
        try {
            setIsLoading(true);
            // Create a FormData object
            const formData = new FormData();
            formData.append("product", product);

            // Append each file to the FormData
            files.forEach((file) => {
                formData.append("files", file);
            });

            console.log("FormData:", files, product);

            // Send the POST request
            const response = await axios.post("/api/getCaptions", formData);

            console.log("Response from API:", response.data);
            let imagesUrls = response.data.imageUrls;
            let captions = response.data.captions
            const mergedData = captions.map((item, index) => ({
                ...item,
                imageUrl: imagesUrls[index],
            }));
            console.log("mergedData:", mergedData);
            setCaptionsData(mergedData);// Store the response data to display captions
            setPrompt(mergedData[0].caption)
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Axios error:", error.response?.data || error.message);
            } else {
                console.error("Unexpected error:", error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCaptionChange = (index, newCaption) => {
        setCaptionsData((prevData) =>
            prevData.map((item, i) =>
                i === index ? { ...item, caption: newCaption } : item
            )
        );
    };

    const generateZip = async (data) => {
        setZipStatus(true)
        const zip = new JSZip();

        for (const item of data) {
            // Fetch the image as a blob
            const imageResponse = await axios.get(item.imageUrl, { responseType: "blob" });
            const imageBlob = imageResponse.data;

            // Add the image to the zip
            zip.file(`${item.order}.jpg`, imageBlob);

            // Add the caption as a text file
            zip.file(`${item.order}.txt`, item.caption);
        }

        // Generate the zip file
        const content = await zip.generateAsync({ type: "blob" });
        console.log(`ZIP file size: ${content.size} bytes`);

        // Convert Blob to Base64
        const fileContent = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(",")[1]); // Extract base64 content
            reader.readAsDataURL(content);
        });

        try {
            const response = await axios.post("/api/uploadZipFile", {
                fileContent,
                fileName: "images_and_captions.zip",
                fileSize: content.size,
            });
            console.log("Zip file uploaded successfully:", response.data);

            // Optional: Set the URL to display or for further actions
            setZipUrl(response.data.fileUrl);
            setStep(2);

        } catch (error) {
            console.error("Error uploading zip file:", error);
        }
        // Save the zip file locally (if needed)
        saveAs(content, "images_and_captions.zip");
        setZipStatus(false);
    };





    return (
        <div className="container mx-auto p-4 w-[80%]">
            <h1 className="text-2xl font-bold mb-4">Add Images</h1>
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
                        {isLoading  ? 'Generating...' : 'Generate Captions'}
                    </Button>
                
                </div>
            </div>

            <div className='h-[75vh] mt-4'>
                {captionsData.length > 0 && (
                    <div className="h-full">
                        <div className='flex items-center justify-between mb-4 h-8'>
                            <h2 className="text-xl font-bold">Uploaded Images and Captions</h2>
                            <Button disabled={zipStatus} onClick={() => generateZip(captionsData)}>
                                {zipStatus ? 'Generating...' : 'Generate Zip'}
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 h-[calc(100%-5rem)] overflow-auto">
                            {captionsData.map((item, index) => (
                                <div key={index} className="border border-white border-opacity-40 p-1 h-[23.5rem] rounded shadow-sm">
                                    <img
                                        src={item.imageUrl}
                                        alt={item.fileName}
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
                )}
            </div>

        </div>
    );
}


