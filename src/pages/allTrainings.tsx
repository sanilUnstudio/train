'use client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation";
import CheckStatusButton from './components/CheckStatusButton'
import { useToast } from "@/hooks/use-toast"
import StopButton from './components/StopButton';
import { cn } from '@/lib/utils';
const fetchAllTrainings = async () => {
    const res = await axios('/api/getAllTrainings');
    return res.data;
}
const AllTrainings = () => {
    const router = useRouter();
    const { toast } = useToast();

    const { data: allImages, isLoading } = useQuery({
        queryKey: ['all-trainings'],
        queryFn: async () => {
            const res = await fetchAllTrainings();
            return res;
        },
    });

    function capitalizeFirstLetter(val:string) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
    return (
        <div className='w-screen h-screen '>
            <h1 onClick={() => router.push('/')} className='text-center text-2xl py-2 cursor-pointer'>All Trainings</h1>

            {isLoading && <p className='text-center'>Loading...</p>}
            {!isLoading && allImages?.trainings.length > 0 &&

                <div className='w-[95%] mx-auto border border-white border-opacity-40 rounded-lg overflow-auto h-[90vh]'>
                    <Table className='  '>
                        <TableHeader className=''>
                            <TableRow className=" text-black">
                                <TableHead className="w-1/6 min-w-[150px] text-white font-bold">Product Image</TableHead>
                                <TableHead className="w-1/2 min-w-[200px] text-white font-bold">Prompt</TableHead>
                                <TableHead className="w-1/6 min-w-[120px] text-white font-bold">Zip URL</TableHead>
                                <TableHead className="w-1/6 min-w-[120px] text-white font-bold">Training Name</TableHead>
                                <TableHead className="w-1/6 min-w-[120px] text-white font-bold">Training ID</TableHead>
                                <TableHead className="w-1/6 min-w-[160px] text-white font-bold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allImages?.trainings.map((item: any) => (
                                <TableRow key={item.training_id} className=" cursor-pointer hover:bg-[#18181c] border-t border-white border-opacity-40">
                                    <TableCell className="align-top cursor-pointer">
                                        {item.product_image ?

                                            <div onClick={() => {
                                                navigator.clipboard.writeText(item.product_image);
                                                toast({ title: "Copied product image url", className: "bg-black", })
                                            }} className='w-full'>
                                                <img src={item.product_image} className='object-contain  h-[70px]' />
                                            </div>
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell className="font-medium align-top cursor-pointer">
                                        <div onClick={() => {
                                            navigator.clipboard.writeText(item.prompt);
                                            toast({ title: "Copied prompt", className: "bg-black", })
                                        }} className="max-h-[70px] overflow-y-auto pr-2">
                                            {item.prompt}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top cursor-pointer">
                                        <div
                                            onClick={() => {
                                                navigator.clipboard.writeText(item.image_url);
                                                toast({
                                                    title: "Copied Zip Url",
                                                    className: "bg-black",
                                                })
                                            }}
                                            className="max-h-[70px] overflow-y-auto pr-2">
                                            {item.image_url}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top cursor-pointer">
                                        <div
                                            className="max-h-[70px] overflow-y-auto pr-2">
                                            {item.training_name}
                                        </div>
                                    </TableCell>
                                    <TableCell onClick={() => {
                                        router.push('/checkStatus/' + item.training_id)
                                    }} className="align-top cursor-pointer">
                                        <div className="max-h-[70px] overflow-y-auto pr-2">
                                            {item.training_id}
                                        </div>
                                    </TableCell>

                                    <TableCell className="align-top cursor-pointer">
                                        {item.status != 'queued' ?

                                            <div className={cn('bg-red-300 inline-block px-1 py-1 rounded-lg text-xs text-black', item.status == 'completed' && 'bg-green-300')}>
                                                <h1>{capitalizeFirstLetter(item.status)}</h1>
                                            </div>

                                            : <div className='flex items-center'>
                                                <CheckStatusButton key={item.training_id} id={item.training_id} />
                                                <StopButton key={item.training_id} id={item.training_id} />
                                            </div>}
                                    </TableCell>

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

            }
        </div>
    )
}

export default AllTrainings