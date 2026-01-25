"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountPaymentDetails } from "@/types/branchops.types"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { ArrowLeft, CreditCard, Monitor, CheckCircle2 } from "lucide-react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AccountPaymentResultProps {
  data: AccountPaymentDetails
  onBack: () => void
}

export function AccountPaymentResult({ data, onBack }: AccountPaymentResultProps) {
  const { language } = useLanguage()
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [gsmNumber, setGsmNumber] = useState<string>("")
  const [emailId, setEmailId] = useState<string>("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [paymentType, setPaymentType] = useState<"POS" | "ONLINE" | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [terminalId, setTerminalId] = useState<string>("")
  const [transactionId, setTransactionId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Calculations
  const calcNetTopUpAmount = () => {
    if (!paymentAmount) return ""
    const amt = parseFloat(paymentAmount) || 0
    const fixed = parseFloat(data.WasteWaterFixedCharge) || 0
    const vat = parseFloat(data.VAT) || 0
    const net = amt - fixed - vat
    return net > 0 ? net.toFixed(3) : "0.000"
  }

  const calcNetTopUpM3 = () => {
    if (!paymentAmount) return ""
    return data.NetTopUpAmountM3 || "0"
  }

  const handlePaymentClick = (type: "POS" | "ONLINE") => {
      if (!gsmNumber) {
          toast.error("Please enter GSM number")
          return
      }
      setPaymentType(type)
      setShowConfirm(true)
  }

  const confirmPayment = async () => {
      setIsLoading(true)
      try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          if (paymentType === "ONLINE") {
              // Online payment logic: typically redirects or shows a message
              toast.success("Redirecting to payment gateway...")
              // In real app: window.location.href = ...
          } else {
              toast.success("POS Payment recorded successfully")
          }
          
          setIsSuccess(true)
          setShowConfirm(false)
          setTimeout(() => {
              setIsSuccess(false)
          }, 5000)
      } catch (error) {
          toast.error("Payment failed")
      } finally {
          setIsLoading(false)
          setTerminalId("")
          setTransactionId("")
      }
  }

  // Get current date for the "As On" text
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-')

  const isRTL = language === "AR"
  const dir = isRTL ? "rtl" : "ltr"

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6" dir={dir}>
      {/* Top Tabs */}
      <Tabs defaultValue="view_pay" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 h-auto bg-transparent border-b rounded-none p-0 mx-auto md:mx-0">
          <TabsTrigger 
            value="search_bill" 
            disabled
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#006A72] data-[state=active]:text-[#006A72] pb-2 text-gray-400"
          >
            {language === "AR" ? "البحث عن الفاتورة" : "Search Bill"}
          </TabsTrigger>
          <TabsTrigger 
            value="view_pay" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#006A72] data-[state=active]:text-[#006A72] pb-2 font-bold"
          >
            {language === "AR" ? "عرض ودفع الفاتورة" : "View & Pay Your Bill"}
          </TabsTrigger>
        </TabsList>

        <div className="mt-8 space-y-8">
            {isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 className="text-green-600 w-5 h-5" />
                    <p className="text-green-800 font-medium">
                        {language === "AR" ? "تمت معالجة الدفع بنجاح!" : "Payment processed successfully!"}
                    </p>
                </div>
            )}

            {/* Inner Tabs for Top Up / Pay Outstanding */}
             <Tabs defaultValue="top_up" className="w-full">
                <div className="flex justify-center border-b max-w-sm mx-auto mb-8">
                    <TabsList className="bg-transparent p-0">
                        <TabsTrigger 
                            value="top_up" 
                            className="rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#006A72] data-[state=active]:text-[#006A72] pb-2 px-8"
                        >
                            {language === "AR" ? "تعبئة رصيد" : "Top Up"}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="pay_outstanding" 
                            className="rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#006A72] data-[state=active]:text-[#006A72] pb-2 px-8"
                        >
                            {language === "AR" ? "دفع المستحقات" : "Pay Outstanding"}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Top Up Tab - Detailed View (Image 2) */}
                <TabsContent value="top_up" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {data.OutstandingFetchError && (
                        <div className="text-red-600 font-semibold py-3 border-b border-red-100 italic text-sm">
                            {language === "AR" 
                                ? "نحن غير قادرين حاليا على عرض رصيدك المستحق. سيتم تعديل ذلك تلقائيا وعكسه خلال عملية التعبئة القادمة."
                                : "We are currently unable to display your outstanding balance. This will be automatically adjusted and reflected during your next top-up."}
                        </div>
                    )}
                    {/* Account Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-sm">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "اسم صاحب الحساب :" : "Account Holder Name :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.AccountHolderName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "نوع الخدمة :" : "Service Type :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.ServiceType}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "مبلغ آخر دفعة :" : "Last Payment Amount :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.LastPaymentAmount}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                             <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "رقم الحساب القديم :" : "Old Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.OldAccountNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "رقم الحساب الجديد :" : "New Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.NewAccountNumber}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "تاريخ آخر دفعة :" : "Last Payment Date :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.LastPaymentDate || "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Outstanding Card */}
                    {/* Outstanding Card - UAT Style */}
                    <div className="bg-[#004D55] text-white rounded-none mt-6 overflow-hidden">
                        <div className="p-4 space-y-4">
                            <div className="space-y-1">
                                <h3 className="font-medium text-sm">
                                    {language === "AR" ? "إجمالي المبلغ المستحق" : "Total Current Outstanding Amount As On"} {currentDate}
                                </h3>
                                <div className="border border-white/20 p-4 flex justify-center items-center bg-[#004D55]">
                                    <span className="text-2xl font-bold tracking-tight">
                                        {data.TotalOutstandingAmount} <span className="text-xs font-normal ml-1">OMR</span>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <p className="font-medium text-sm">
                                    {language === "AR" ? `رصيدك الحالي كما في` : `Your Current Balance As On`}
                                </p>
                                <p className="text-[10px] opacity-80">{currentDate}</p>
                                <div className="border border-white/20 p-4 space-y-1 flex flex-col items-center bg-[#004D55]">
                                    <span className="text-xl font-bold tracking-tight">
                                        {data.CurrentBalance} <span className="text-xs font-normal ml-1">OMR</span>
                                    </span>
                                    <span className="text-xl font-bold tracking-tight">
                                        {data.CurrentBalanceM3 || "0.000"} <span className="text-xs font-normal ml-1">M3</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Inputs */}
                    {/* Payment Inputs - UAT Style */}
                    <div className="space-y-6 pt-10 ltr:text-left rtl:text-right">
                        <div className="space-y-2">
                            <Label className="text-gray-600 font-medium text-sm">{language === "AR" ? "مبلغ الدفع" : "Payment Amount"}</Label>
                            <div className="relative max-w-sm">
                                <Input 
                                    className="bg-white border-gray-300 pr-12 h-10 text-sm focus:ring-[#006A72]" 
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder=""
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium uppercase">OMR</span>
                            </div>
                        </div>

                         <div className="space-y-6 pt-2">
                             <div className="space-y-1">
                                <p className="text-gray-500 font-medium text-sm">{language === "AR" ? "رسوم الصرف الصحي الثابتة" : "Waste Water Fixed Charge"}</p>
                                <p className="text-[#015e66] font-bold text-base">{data.WasteWaterFixedCharge} OMR</p>
                             </div>
                             
                             <div className="space-y-1">
                                <p className="text-gray-500 font-medium text-sm">{language === "AR" ? "ضريبة القيمة المضافة (%)" : "VAT (%)"}</p>
                                <p className="text-[#015e66] font-bold text-base">{paymentAmount ? `${data.VAT} OMR` : "OMR"}</p>
                             </div>
                             
                             <div className="space-y-1">
                                <p className="text-gray-500 font-medium text-sm">{language === "AR" ? "صافي مبلغ التعبئة" : "Net Top Up Amount"}</p>
                                <div className="flex flex-col">
                                    <p className="text-[#015e66] font-bold text-base">{calcNetTopUpAmount()} OMR</p>
                                    <p className="text-[#015e66] font-bold text-sm ltr:ml-32 rtl:mr-32">= {calcNetTopUpM3()} M3</p>
                                </div>
                             </div>
                         </div>

                         <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <Label className="text-gray-600 font-bold md:col-span-1">
                                    {language === "AR" ? "رقم الهاتف" : "GSM Number"} <span className="text-red-500">*</span>
                                </Label>
                                <div className="md:col-span-2 flex ltr:flex-row rtl:flex-row-reverse">
                                    <div className="bg-gray-50 border border-r-0 border-gray-300 px-3 py-2 text-gray-500 text-sm rounded-l-md rtl:rounded-l-none rtl:rounded-r-md rtl:border-l-0 rtl:border-r">
                                        +968
                                    </div>
                                    <Input 
                                        className="bg-white border-gray-300 rounded-l-none rtl:rounded-l-md rtl:rounded-r-none" 
                                        placeholder={language === "AR" ? "أدخل رقم الهاتف" : "Enter your GSM number"}
                                        value={gsmNumber}
                                        onChange={(e) => setGsmNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    />
                                </div>
                            </div>
                            
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <Label className="text-gray-600 font-bold md:col-span-1">
                                    {language === "AR" ? "البريد الإلكتروني" : "Email ID"}
                                </Label>
                                <div className="md:col-span-2">
                                    <Input 
                                        className="bg-white border-gray-300" 
                                        placeholder={language === "AR" ? "أدخل البريد الإلكتروني" : "Enter email Id"}
                                        value={emailId}
                                        onChange={(e) => setEmailId(e.target.value)}
                                    />
                                </div>
                            </div>
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row justify-between pt-8 gap-4">
                         <Button 
                            variant="secondary" 
                            onClick={onBack}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-full md:w-32"
                        >
                            {language === "AR" ? "رجوع" : "Back"}
                        </Button>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                             <Button 
                                variant="outline" 
                                onClick={() => handlePaymentClick("POS")}
                                className="border-[#006A72] text-[#006A72] hover:bg-[#006A72]/10 w-full md:w-40 gap-2"
                                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                            >
                                <CreditCard className="w-4 h-4" />
                                {language === "AR" ? "دفع POS" : "POS Payment"}
                            </Button>
                             <Button 
                                onClick={() => handlePaymentClick("ONLINE")}
                                className="bg-[#004D55] hover:bg-[#003d44] text-white w-full md:w-40 gap-2"
                                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                            >
                                <Monitor className="w-4 h-4" />
                                {language === "AR" ? "دفع إلكتروني" : "Online Payment"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Pay Outstanding Tab - Simplified View (Image 3) */}
                <TabsContent value="pay_outstanding" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {data.OutstandingFetchError && (
                        <div className="text-red-600 font-semibold py-3 border-b border-red-100 italic text-sm ltr:text-left rtl:text-right">
                             {language === "AR" 
                                ? "نحن غير قادرين حاليا على عرض رصيدك المستحق. سيتم تعديل ذلك تلقائيا وعكسه خلال عملية التعبئة القادمة."
                                : "We are currently unable to display your outstanding balance. This will be automatically adjusted and reflected during your next top-up."}
                        </div>
                    )}
                     {/* Account Details simplified Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-sm">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "اسم صاحب الحساب :" : "Account Name :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.AccountHolderName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "نوع الخدمة :" : "Service Type :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.ServiceType}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "مبلغ آخر دفعة :" : "Last Payment Amount :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.LastPaymentAmount}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                             <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "رقم الحساب القديم :" : "Old Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.OldAccountNumber}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "رقم الحساب الجديد :" : "New Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.NewAccountNumber}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-500 font-medium">{language === "AR" ? "تاريخ آخر دفعة :" : "Last Payment Date :"}</span>
                                <span className="text-[#006A72] font-semibold text-right">{data.LastPaymentDate || "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Simple Outstanding Card - UAT Style */}
                    <div className="bg-[#004D55] text-white rounded-none mt-6 overflow-hidden">
                        <div className="p-4 flex justify-between items-center">
                            <div className="space-y-1">
                                <h3 className="font-medium text-sm">
                                    {language === "AR" ? "إجمالي المبلغ المستحق" : "Total Current Outstanding Amount As On"} {currentDate}
                                </h3>
                                <div className="border border-white/20 px-8 py-3 flex justify-center items-center bg-[#004D55]">
                                    <span className="text-xl font-bold tracking-tight">
                                        {data.TotalOutstandingAmount} <span className="text-xs font-normal ml-1">OMR</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simplified Payment Section */}
                    <div className="max-w-2xl mx-auto space-y-6 pt-10 ltr:text-left rtl:text-right">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                            <Label className="text-gray-600 font-bold text-base">{language === "AR" ? "رسوم الصرف الصحي الثابتة" : "Waste Water Fixed Charge"}</Label>
                            <div className="relative w-full md:w-96">
                                <Input 
                                    className="bg-gray-50 border-gray-200 pr-16 h-12 text-right font-bold text-[#006A72] text-lg cursor-not-allowed" 
                                    value={data.WasteWaterFixedCharge}
                                    readOnly
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium border-l pl-3">OMR</span>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <Label className="text-gray-600 font-bold text-base">
                                    {language === "AR" ? "رقم الهاتف" : "GSM Number"} <span className="text-red-500">*</span>
                                </Label>
                                <div className="w-full md:w-96 flex ltr:flex-row rtl:flex-row-reverse shadow-sm">
                                    <div className="bg-gray-50 border border-r-0 border-gray-300 px-3 py-2 text-gray-500 text-sm rounded-l-md flex items-center">
                                        +968
                                    </div>
                                    <Input 
                                        className="bg-white border-gray-300 rounded-l-none h-12" 
                                        placeholder={language === "AR" ? "أدخل رقم الهاتف" : "Enter your GSM number"}
                                        value={gsmNumber}
                                        onChange={(e) => setGsmNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <Label className="text-gray-600 font-bold text-base">
                                    {language === "AR" ? "البريد الإلكتروني" : "Email ID"}
                                </Label>
                                <div className="w-full md:w-96 shadow-sm">
                                    <Input 
                                        className="bg-white border-gray-300 h-12" 
                                        placeholder={language === "AR" ? "أدخل البريد الإلكتروني" : "Enter email Id"}
                                        value={emailId}
                                        onChange={(e) => setEmailId(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row justify-between pt-10 gap-4">
                         <Button 
                            variant="secondary" 
                            onClick={onBack}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-full md:w-28 h-9 rounded-sm"
                        >
                            {language === "AR" ? "رجوع" : "Back"}
                        </Button>
                        
                        <div className="flex flex-col md:flex-row gap-2">
                             <Button 
                                variant="outline" 
                                onClick={() => handlePaymentClick("POS")}
                                className="border-[#006A72] text-[#006A72] hover:bg-[#006A72]/5 w-full md:w-36 h-9 rounded-sm gap-2 text-xs font-bold"
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                {language === "AR" ? "دفع POS" : "POS Payment"}
                            </Button>
                             <Button 
                                onClick={() => handlePaymentClick("ONLINE")}
                                className="bg-[#004D55] hover:bg-[#003d44] text-white w-full md:w-36 h-9 rounded-sm gap-2 text-xs font-bold"
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                {language === "AR" ? "دفع إلكتروني" : "Online Payment"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
             </Tabs>
        </div>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
             <AlertDialogTitle>
                 {language === "AR" ? "تأكيد عملية الدفع" : "Confirm Payment"}
             </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4 ltr:text-left rtl:text-right">
            <AlertDialogDescription>
                {language === "AR" 
                    ? `هل أنت متأكد من دفع ${paymentAmount || data.TotalOutstandingAmount} OMR عبر ${paymentType === "POS" ? "جهاز POS" : "الدفع الإلكتروني"}؟`
                    : `Are you sure you want to pay ${paymentAmount || data.TotalOutstandingAmount} OMR via ${paymentType === "POS" ? "POS Device" : "Online Payment"}?`}
            </AlertDialogDescription>

            {paymentType === "POS" && (
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label>{language === "AR" ? "رقم الجهاز (Terminal ID)" : "Terminal ID"} <span className="text-red-500">*</span></Label>
                        <Input 
                            value={terminalId}
                            onChange={(e) => setTerminalId(e.target.value)}
                            placeholder="Enter Terminal ID"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{language === "AR" ? "رقم العملية (Transaction ID)" : "Transaction ID"} <span className="text-red-500">*</span></Label>
                        <Input 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter Transaction ID"
                        />
                    </div>
                </div>
            )}
          </div>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel 
                onClick={() => { setTerminalId(""); setTransactionId(""); }}
                className="mt-0"
            >
                {language === "AR" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmPayment} 
                disabled={isLoading || (paymentType === "POS" && (!terminalId || !transactionId))}
                className="bg-[#006A72] hover:bg-[#005a61] text-white"
            >
                {isLoading ? (language === "AR" ? "جاري المعالجة..." : "Processing...") : (language === "AR" ? "تأكيد الدفع" : "Confirm Payment")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
