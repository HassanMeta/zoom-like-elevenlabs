"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import EmployeeLayout from "../components/employee-layout"

export default function DashboardPage() {
  const router = useRouter()

  // Check if authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("day0-auth")
    if (isAuthenticated !== "true") {
      router.push("/")
    }
  }, [router])

  return (
    <main className="flex flex-col min-h-screen">
      <EmployeeLayout />
    </main>
  )
}

