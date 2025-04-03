"use client"

import { useState, useEffect } from "react"
import { EmployeeList } from "./employee-list"
import { EmployeeDetail } from "./employee-detail"
import { Conversation } from "./conversation"
import { AppBar } from "./app-bar"
import employeeData from "../data/employees.json"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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

export default function EmployeeLayout() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Select the first employee by default when the component mounts
  useEffect(() => {
    if (employeeData.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employeeData[0])
    }
  }, [selectedEmployee])

  return (
    <>
      <AppBar />
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        <EmployeeList
          onSelectEmployee={(employee) => {
            setSelectedEmployee(employee)
          }}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedEmployee ? (
            <>
              <div className="sticky top-0 z-10 p-6 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{selectedEmployee.Employee_Name}</h1>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        ECN: {selectedEmployee.ECN}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedEmployee.Department}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                        {selectedEmployee.Band_Level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden bg-gray-50">
                <div className="h-full px-6 py-6 overflow-y-auto">
                  <div className="mb-8">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Check-in</h3>

                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem
                          value="weekly-check-in"
                          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                            <span className="text-base font-medium text-gray-900">Complete Weekly Check-in</span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-4 border-t border-gray-200">
                              <Conversation selectedEmployee={selectedEmployee} />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    <EmployeeDetail employee={selectedEmployee} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-gray-500 bg-gray-50">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4">
                  <img src="/logo.png" alt="Day0 Recruit Logo" className="h-full w-full object-contain opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Employee Selected</h3>
                <p className="text-gray-500">Select an employee from the list to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

