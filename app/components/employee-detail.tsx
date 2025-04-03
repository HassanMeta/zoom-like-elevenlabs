"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
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

type EmployeeDetailProps = {
  employee: Employee | null
}

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  if (!employee) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
        Select an employee to view details
      </div>
    )
  }

  // Find the full employee data from the JSON file
  const fullEmployeeData = employeeData.find((emp) => emp.ECN === employee.ECN) as Employee

  // Get January and February goals
  const januaryGoals = fullEmployeeData?.monthly_goals?.filter((goal) => goal.Month === "Jan") || []
  const februaryGoals = fullEmployeeData?.monthly_goals?.filter((goal) => goal.Month === "Feb") || []

  // Get January and February reviews
  const januaryReview = fullEmployeeData?.Monthly_Review_Comments?.find((review) => review.Month === "Jan")
  const februaryReview = fullEmployeeData?.Monthly_Review_Comments?.find((review) => review.Month === "Feb")

  return (
    <div className="space-y-8">
      {/* Monthly Goals Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Goals</h3>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {/* January Goals */}
          <AccordionItem value="january" className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center">
                <span className="text-base font-medium text-gray-900">January Goals</span>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {januaryGoals.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 border-t border-gray-200">
                {januaryGoals.length > 0 ? (
                  <div className="space-y-4">
                    {januaryGoals.map((goal) => (
                      <div key={goal.Goal_ID} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{goal.Goal_name}</h5>
                              <p className="text-sm text-gray-600 mt-1">
                                Goal ID: {goal.Goal_ID} | Weight: {goal.Goal_Weight}
                                {goal.Goal_Type === "Critical" || goal.Goal_Type === "Critical Goal" ? (
                                  <span className="ml-2 text-red-600 font-medium">CRITICAL</span>
                                ) : null}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                goal.Completion_Status === "Completed"
                                  ? "bg-green-100 text-green-800 flex items-center"
                                  : "bg-red-100 text-red-800 flex items-center"
                              }`}
                            >
                              {goal.Completion_Status === "Completed" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {goal.Completion_Status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium text-gray-700">Strategic Objective:</span>{" "}
                              <span className="text-gray-900">{goal.Strategic_Objective}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Strategic Tag:</span>{" "}
                              <span className="text-gray-900">{goal.Strategic_Tag}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">KPI Contribution:</span>{" "}
                              <span className="text-gray-900">{goal.KPI_Contribution}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Goal Category:</span>{" "}
                              <span className="text-gray-900">{goal.Goal_Category}</span>
                            </div>
                          </div>
                          <div
                            className={`mt-3 p-3 rounded-md text-sm ${
                              goal.Completion_Status === "Completed"
                                ? "bg-green-50 border border-green-100"
                                : goal.Goal_Type === "Critical" || goal.Goal_Type === "Critical Goal"
                                  ? "bg-red-50 border border-red-100"
                                  : "bg-yellow-50 border border-yellow-100"
                            }`}
                          >
                            <div className="flex items-start">
                              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Notes:</span>{" "}
                                <span className="text-gray-900">{goal.Notes}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center py-4">No goals found for January</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* February Goals */}
          <AccordionItem value="february" className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center">
                <span className="text-base font-medium text-gray-900">February Goals</span>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {februaryGoals.length}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 border-t border-gray-200">
                {februaryGoals.length > 0 ? (
                  <div className="space-y-4">
                    {februaryGoals.map((goal) => (
                      <div key={goal.Goal_ID} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b border-gray-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{goal.Goal_name}</h5>
                              <p className="text-sm text-gray-600 mt-1">
                                Goal ID: {goal.Goal_ID} | Weight: {goal.Goal_Weight}
                                {goal.Goal_Type === "Critical" || goal.Goal_Type === "Critical Goal" ? (
                                  <span className="ml-2 text-red-600 font-medium">CRITICAL</span>
                                ) : null}
                              </p>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                goal.Completion_Status === "Completed"
                                  ? "bg-green-100 text-green-800 flex items-center"
                                  : "bg-red-100 text-red-800 flex items-center"
                              }`}
                            >
                              {goal.Completion_Status === "Completed" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {goal.Completion_Status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium text-gray-700">Strategic Objective:</span>{" "}
                              <span className="text-gray-900">{goal.Strategic_Objective}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Strategic Tag:</span>{" "}
                              <span className="text-gray-900">{goal.Strategic_Tag}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">KPI Contribution:</span>{" "}
                              <span className="text-gray-900">{goal.KPI_Contribution}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Goal Category:</span>{" "}
                              <span className="text-gray-900">{goal.Goal_Category}</span>
                            </div>
                          </div>
                          <div
                            className={`mt-3 p-3 rounded-md text-sm ${
                              goal.Completion_Status === "Completed"
                                ? "bg-green-50 border border-green-100"
                                : goal.Goal_Type === "Critical" || goal.Goal_Type === "Critical Goal"
                                  ? "bg-red-50 border border-red-100"
                                  : "bg-yellow-50 border border-yellow-100"
                            }`}
                          >
                            <div className="flex items-start">
                              <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-medium text-gray-700">Notes:</span>{" "}
                                <span className="text-gray-900">{goal.Notes}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center py-4">No goals found for February</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Performance Reviews Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Reviews</h3>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {/* January Review */}
          <AccordionItem value="january-review" className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
              <span className="text-base font-medium text-gray-900">January Performance Review</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 border-t border-gray-200">
                {januaryReview ? (
                  <div>
                    <p className="mb-4 text-sm text-gray-800 leading-relaxed">{januaryReview.Performance_Review}</p>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                      <h5 className="font-medium text-gray-900 mb-2">Potential Key Result for Next Month:</h5>
                      <p className="text-sm text-gray-800">{januaryReview.Proposed_Key_Result}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center py-4">No review available for January</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* February Review */}
          <AccordionItem value="february-review" className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
              <span className="text-base font-medium text-gray-900">February Performance Review</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-4 border-t border-gray-200">
                {februaryReview ? (
                  <div>
                    <p className="mb-4 text-sm text-gray-800 leading-relaxed">{februaryReview.Performance_Review}</p>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                      <h5 className="font-medium text-gray-900 mb-2">Potential Key Result for Next Month:</h5>
                      <p className="text-sm text-gray-800">{februaryReview.Proposed_Key_Result}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center py-4">No review available for February</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

