"use client"

import { useState } from "react"
import { Search, Users } from "lucide-react"
import employeeData from "../data/employees.json"

type Employee = {
  ECN: string
  Employee_Name: string
  Department: string
  Band_Level: string
  agent_brief?: string
  monthly_goals?: {
    Goal_ID: string
    Month: string
    Goal_name: string
    Goal_Type: string
    Strategic_Objective: string
    Strategic_Tag: string
    KPI_Contribution: string
    Goal_Category: string
    Goal_Weight: number
    Completion_Status: string
    Notes: string
  }[]
  Monthly_Review_Comments?: {
    Month: string
    Performance_Review: string
    Proposed_Key_Result: string
  }[]
}

type EmployeeListProps = {
  onSelectEmployee: (employee: Employee) => void
}

export function EmployeeList({ onSelectEmployee }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEmployees = employeeData.filter(
    (employee) =>
      employee.Employee_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.ECN.includes(searchTerm) ||
      employee.Department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="w-72 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Users className="h-5 w-5 mr-2 text-gray-500" />
          Employees
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredEmployees.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <li
                key={employee.ECN}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSelectEmployee(employee)}
              >
                <div className="p-4">
                  <div className="font-medium text-gray-900">{employee.Employee_Name}</div>
                  <div className="text-sm text-gray-500 mt-1">ECN: {employee.ECN}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {employee.Department}
                    </span>
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                      {employee.Band_Level}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">No employees found</div>
        )}
      </div>
    </div>
  )
}

