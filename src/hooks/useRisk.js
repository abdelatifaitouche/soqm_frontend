import { getRisk } from "@/api/endpoints/riskApi";
import { useEffect, useState } from "react";



export function useRisk (id){
    const [risk , setRisk] = useState(null)
    const [error , setError] = useState(null)
    const [loading , setLoading] = useState(true)
    useEffect(()=>{
    if (!id) return
    setLoading(true)
        getRisk(id)
        .then((res)=>setRisk(res.data))
        .catch((err)=>setError(err.data))
        .finally(()=>{
            setLoading(false)
        })
    } , [id])

    return {risk , setRisk, error , loading}
}