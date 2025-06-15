"use client"

import type React from "react"
import { useState } from "react"
import { X, Download, FileText, FileSpreadsheet } from "lucide-react"
import { useTask } from "../contexts/TaskContext"

interface ExportModalProps {
  onClose: () => void
  currentFilters: {
    status?: string
    priority?: string
    search?: string
  }
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, currentFilters }) => {
  const { exportTasks } = useTask()
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "pdf">("csv")
  const [includeFilters, setIncludeFilters] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const exportParams = includeFilters ? currentFilters : {}
      await exportTasks(selectedFormat, exportParams)
      onClose()
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const hasActiveFilters = currentFilters.status || currentFilters.priority || currentFilters.search

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Tasks</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={selectedFormat === "csv"}
                  onChange={(e) => setSelectedFormat(e.target.value as "csv")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">CSV File</div>
                  <div className="text-sm text-gray-500">Spreadsheet format, compatible with Excel</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={selectedFormat === "pdf"}
                  onChange={(e) => setSelectedFormat(e.target.value as "pdf")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <FileText className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium text-gray-900">PDF Document</div>
                  <div className="text-sm text-gray-500">Professional formatted document, ready to print</div>
                </div>
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFilters}
                  onChange={(e) => setIncludeFilters(e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Apply current filters to export</span>
              </label>
              <div className="mt-2 text-xs text-gray-500">
                {includeFilters ? (
                  <div>
                    Current filters will be applied:
                    {currentFilters.status && <span className="block">• Status: {currentFilters.status}</span>}
                    {currentFilters.priority && <span className="block">• Priority: {currentFilters.priority}</span>}
                    {currentFilters.search && <span className="block">• Search: "{currentFilters.search}"</span>}
                  </div>
                ) : (
                  "All tasks will be exported"
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
