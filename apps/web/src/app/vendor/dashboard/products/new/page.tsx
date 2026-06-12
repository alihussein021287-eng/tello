"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewProductPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/vendor/dashboard/products?new=1")
  }, [])
  return null
}
