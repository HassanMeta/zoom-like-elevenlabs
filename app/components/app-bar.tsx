"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Bell, Search } from "lucide-react"

export function AppBar() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")

  const handleLogout = () => {
    localStorage.removeItem("day0-auth")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 relative">
            <img src="/logo.png" alt="Day0 Recruit Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Day0 Recruit</h1>
        </div>

        <nav className="ml-8 hidden md:flex items-center space-x-4">
          <a
            href="#"
            onClick={() => setActiveTab("dashboard")}
            className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              activeTab === "dashboard"
                ? "bg-orange-50 text-orange-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Dashboard
          </a>
          <a
            href="#"
            onClick={() => setActiveTab("reports")}
            className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              activeTab === "reports"
                ? "bg-orange-50 text-orange-700"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Reports
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <Bell className="h-5 w-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <Search className="h-5 w-5" />
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Logout</span>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

