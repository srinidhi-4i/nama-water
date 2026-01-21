import { Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RegistrationType } from "@/types/branchops.types"

interface RegistrationTypeSelectorProps {
  language: string
  selectedType: RegistrationType
  onSelect: (type: RegistrationType) => void
  onContinue: () => void
}

export default function RegistrationTypeSelector({
  language,
  selectedType,
  onSelect,
  onContinue
}: RegistrationTypeSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border overflow-hidden min-h-[600px]">
      {/* Left Section - Description */}
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-2/5 bg-gray-50 p-6 sm:p-8 lg:p-12 flex flex-col items-center justify-center border-b lg:border-r lg:border-b-0">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-teal-50 border-4 border-teal-100 flex items-center justify-center mb-6">
            <svg
              className="h-12 w-12 sm:h-14 sm:w-14 text-teal-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-900 mb-2 text-center">
            {language === "EN" ? "LET'S GET" : "لنبدأ"}
          </h2>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-900 mb-4 text-center">
            {language === "EN" ? "STARTED" : "ال��سجيل"}
          </h2>
          <p className="text-sm text-gray-600 text-center max-w-xs">
            {language === "EN"
              ? "Fill out the registration and start your journey with us"
              : "املأ نموذج التسجيل وابدأ رحلتك معنا"}
          </p>
        </div>

        {/* Right Section - Registration Type Selection */}
        <div className="lg:w-3/5 p-6 sm:p-8 lg:p-12">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-8 pb-3 border-b">
            {language === "EN" ? "Select Registration Type" : "اختر نوع التسجيل"}
          </h3>

          <div className="space-y-5">
            {/* Individual Option */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === "Individual"
                  ? "border-2 border-teal-800 bg-teal-50"
                  : "border hover:border-teal-300"
              }`}
              onClick={() => onSelect("Individual")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        selectedType === "Individual"
                          ? "border-teal-800 bg-teal-800"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedType === "Individual" && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-base sm:text-lg font-medium text-gray-800">
                      {language === "EN" ? "Individual" : "فردي"}
                    </span>
                  </div>
                  <svg
                    className="h-8 w-8 sm:h-10 sm:w-10 text-teal-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Corporate Option */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === "Corporate"
                  ? "border-2 border-teal-800 bg-teal-50"
                  : "border hover:border-teal-300"
              }`}
              onClick={() => onSelect("Corporate")}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        selectedType === "Corporate"
                          ? "border-teal-800 bg-teal-800"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedType === "Corporate" && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-base sm:text-lg font-medium text-gray-800">
                      {language === "EN" ? "Corporate" : "مؤسسي"}
                    </span>
                  </div>
                  <svg
                    className="h-8 w-8 sm:h-10 sm:w-10 text-teal-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Continue Button */}
          <div className="mt-10 flex justify-end">
            <Button
              onClick={onContinue}
              className="bg-teal-900 hover:bg-teal-800 px-10 h-12 text-sm sm:text-base"
            >
              {language === "EN" ? "Continue" : "متابعة"}
              <span className="ml-2">›</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
