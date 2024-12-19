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
import { useToast } from "@/hooks/use-toast"

interface DataItem {
    id: number
    prompt: string
    image_url: string
    product_image: string | null
}


const fetchAllTrainings = async () => {
    const res = await axios('/api/getAllTrainings');
    return res.data;
}
const AllTrainings = () => {
    const router = useRouter();
    const { toast } = useToast()
    const { data: allImages, isLoading } = useQuery({
        queryKey: ['all-trainings'],
        queryFn: async () => {
            const res = await fetchAllTrainings();
            return res;
        },
    });

  return (
      <div className='w-screen h-screen '>
          <h1 onClick={() => router.push('/')} className='text-center text-2xl py-2 cursor-pointer'>All Trainings</h1>

          {isLoading && <p className='text-center'>Loading...</p>}
          {!isLoading && allImages?.trainings.length > 0 && 
          
              <div className='w-[90%] mx-auto border border-white border-opacity-40 rounded-lg overflow-auto h-[90vh]'>
                  <Table className='  '>
                      <TableHeader className=''>
                          <TableRow className=" text-black">
                              <TableHead className="w-1/6 min-w-[150px] text-white font-bold">Product Image</TableHead>
                              <TableHead className="w-1/2 min-w-[200px] text-white font-bold">Prompt</TableHead>
                              <TableHead className="w-1/6 min-w-[150px] text-white font-bold">Zip URL</TableHead>
                              <TableHead className="w-1/6 min-w-[150px] text-white font-bold">Training Name</TableHead>
                              <TableHead className="w-1/6 min-w-[150px] text-white font-bold">Training ID</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {allImages?.trainings.map((item) => (
                              <TableRow key={item.id} className="min-h-[70px] cursor-pointer hover:bg-[#18181c] border-t border-white border-opacity-40">
                                  <TableCell className="align-top">
                                      {item.product_image ?
                                      
                                          <div onClick={() =>
                                          {
                                              navigator.clipboard.writeText(item.product_image); 
                                              toast({ title: "Copied product image url" })
                                          }} className='w-full h-full'>
                                              <img src={item.product_image} className='object-contain'/>
                                      </div>
                                      : 'N/A'}
                                  </TableCell>
                                  <TableCell className="font-medium align-top">
                                      <div className="max-h-[100px] overflow-y-auto pr-2">
                                          {item.prompt}
                                      </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                      <div className="max-h-[100px] overflow-y-auto pr-2">
                                          {item.image_url}
                                      </div>
                                  </TableCell>
                                  <TableCell className="align-top">
                                      <div className="max-h-[100px] overflow-y-auto pr-2">
                                          {item.training_name}
                                      </div>
                                  </TableCell>
                                  <TableCell onClick={() => {
                                      router.push('/checkStatus/' + item.training_id)
                                  }} className="align-top">
                                      <div className="max-h-[100px] overflow-y-auto pr-2">
                                          {item.training_id}
                                      </div>
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