"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  // Helper to format currency
  const formatCurrency = (amount: string) => {
    return `${amount} OMR`
  }

  const handlePaymentClick = (type: "POS" | "ONLINE") => {
      setPaymentType(type)
      setShowConfirm(true)
  }

  const confirmPayment = () => {
      setShowConfirm(false)
      // Simulate payment success
      setIsSuccess(true)
      setTimeout(() => {
          setIsSuccess(false)
      }, 3000)
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
      <Tabs defaultValue="pay_outstanding" className="w-full">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs sm:text-sm">
                        <div className="space-y-4">
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "اسم صاحب الحساب :" : "Account Holder Name :"}</span>
                                <span className="text-[#006A72] font-semibold truncate">{data.AccountHolderName}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "نوع الخدمة :" : "Service Type :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.ServiceType}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "مبلغ آخر دفعة :" : "Last Payment Amount :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.LastPaymentAmount}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                             <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "رقم الحساب القديم :" : "Old Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.OldAccountNumber}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "رقم الحساب الجديد :" : "New Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.NewAccountNumber}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "تاريخ آخر دفعة :" : "Last Payment Date :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.LastPaymentDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Outstanding Card */}
                    <Card className="bg-[#004D55] text-white border-none shadow-lg rounded-sm mt-6">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-lg">{language === "AR" ? "إجمالي المبلغ المستحق" : "Total Current Outstanding"}</h3>
                                    <p className="text-sm opacity-90">{language === "AR" ? `المبلغ كما في ${currentDate}` : `Amount As On ${currentDate}`}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-white/20">
                                        <p className="font-medium">{language === "AR" ? `رصيدك الحالي كما في` : `Your Current Balance As On`}</p>
                                        <p className="text-sm opacity-90">{currentDate}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-right md:text-left rtl:text-left ltr:text-right">
                                    <div className="border border-white/30 p-4 rounded bg-[#004D55]"> {/* Inner fake box styling */}
                                        <div className="text-3xl font-bold flex items-baseline justify-end gap-2">
                                            {data.TotalOutstandingAmount} <span className="text-sm font-normal">OMR</span>
                                        </div>
                                    </div>
                                    <div className="border border-white/30 p-4 rounded bg-[#004D55]">
                                        <div className="text-xl font-bold flex items-baseline justify-end gap-2">
                                            {data.CurrentBalance} <span className="text-sm font-normal">OMR</span>
                                        </div>
                                         <div className="text-xl font-bold flex items-baseline justify-end gap-2">
                                            0.000 <span className="text-sm font-normal">M3</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Inputs */}
                    <div className="max-w-2xl mx-auto space-y-6 pt-6 ltr:text-left rtl:text-right">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <Label className="text-gray-600 font-bold md:col-span-1">{language === "AR" ? "مبلغ الدفع" : "Payment Amount"}</Label>
                            <div className="md:col-span-2 relative">
                                <Input 
                                    className="bg-white border-gray-300 pr-12 text-right" 
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                />
                                <span className="absolute right-3 top-2 text-gray-500 text-sm font-medium">OMR</span>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium border-b pb-4 border-gray-100">
                             <span className="text-gray-600">{language === "AR" ? "رسوم الصرف الصحي الثابتة" : "Waste Water Fixed Charge"}</span>
                             <span className="text-[#006A72] text-right">{data.WasteWaterFixedCharge} OMR</span>
                             
                             <span className="text-gray-600">{language === "AR" ? "ضريبة القيمة المضافة (0%)" : "VAT (0%)"}</span>
                             <span className="text-[#006A72] text-right">{data.VAT} OMR</span>
                             
                             <span className="text-gray-600 font-bold">{language === "AR" ? "صافي مبلغ التعبئة" : "Net Top Up Amount"}</span>
                             <div className="flex justify-end gap-4">
                                <span className="text-[#006A72] font-bold">{data.NetTopUpAmount} OMR</span>
                                <span className="text-[#006A72] font-bold">-0.000 M3</span>
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
                                        onChange={(e) => setGsmNumber(e.target.value)}
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
                            >
                                <CreditCard className="w-4 h-4" />
                                {language === "AR" ? "دفع POS" : "POS Payment"}
                            </Button>
                             <Button 
                                onClick={() => handlePaymentClick("ONLINE")}
                                className="bg-[#004D55] hover:bg-[#003d44] text-white w-full md:w-40 gap-2"
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
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs sm:text-sm">
                        <div className="space-y-4">
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "اسم الحساب :" : "Account Name :"}</span>
                                <span className="text-[#006A72] font-semibold truncate">{data.AccountHolderName}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "نوع الخدمة :" : "Service Type :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.ServiceType}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "مبلغ آخر دفعة :" : "Last Payment Amount :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.LastPaymentAmount}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                             <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "رقم الحساب القديم :" : "Old Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.OldAccountNumber}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "رقم الحساب الجديد :" : "New Account Number :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.NewAccountNumber}</span>
                            </div>
                            <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-gray-600 font-medium w-40">{language === "AR" ? "تاريخ آخر دفعة :" : "Last Payment Date :"}</span>
                                <span className="text-[#006A72] font-semibold">{data.LastPaymentDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Simple Outstanding Card from Image 3 */}
                    <Card className="bg-[#004D55] text-white border-none shadow-lg rounded-sm mt-6">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-base">{language === "AR" ? "إجمالي المبلغ المستحق" : "Total Current Outstanding"}</h3>
                                    <p className="text-xs opacity-90">{language === "AR" ? `المبلغ كما في ${currentDate}` : `Amount As On ${currentDate}`}</p>
                                </div>
                                <div className="border border-white/30 px-6 py-2 rounded bg-transparent">
                                    <div className="text-2xl font-bold flex items-baseline gap-2">
                                        {data.TotalOutstandingAmount} <span className="text-xs font-normal">OMR</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simplified Payment Section */}
                    <div className="max-w-2xl mx-auto space-y-4 pt-4 ltr:text-left rtl:text-right">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <Label className="text-gray-600 font-medium md:col-span-1">{language === "AR" ? "رسوم الصرف الصحي الثابتة" : "Waste Water Fixed Charge"}</Label>
                            <div className="md:col-span-2 relative">
                                <Input 
                                    className="bg-gray-50 border-gray-200 text-right font-semibold text-[#006A72]" 
                                    value={data.WasteWaterFixedCharge + " OMR"}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
                            <Label className="text-gray-600 font-bold md:col-span-1">
                                {language === "AR" ? "رقم الهاتف" : "GSM Number"} <span className="text-red-500">*</span>
                            </Label>
                            <div className="md:col-span-2 flex ltr:flex-row rtl:flex-row-reverse">
                                <div className="bg-gray-100 border border-r-0 border-gray-300 px-3 py-2 text-gray-500 text-sm rounded-l-md rtl:rounded-l-none rtl:rounded-r-md rtl:border-l-0 rtl:border-r">
                                    +968
                                </div>
                                <Input 
                                    className="bg-white border-gray-300 rounded-l-none rtl:rounded-l-md rtl:rounded-r-none" 
                                    placeholder={language === "AR" ? "أدخل رقم الهاتف" : "Enter your GSM number"}
                                    value={gsmNumber}
                                    onChange={(e) => setGsmNumber(e.target.value)}
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

                    {/* Actions from Image 3 */}
                    <div className="flex flex-col md:flex-row justify-between pt-8 gap-4">
                         <Button 
                            variant="secondary" 
                            onClick={onBack}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 w-full md:w-32 rounded-md font-medium"
                        >
                            {language === "AR" ? "رجوع" : "Back"}
                        </Button>
                        
                        <div className="flex flex-col md:flex-row gap-4">
                             <Button 
                                variant="outline" 
                                onClick={() => handlePaymentClick("POS")}
                                className="border-gray-300 text-gray-600 hover:bg-gray-50 w-full md:w-40 gap-2 font-medium"
                            >
                                <CreditCard className="w-4 h-4" />
                                {language === "AR" ? "دفع POS" : "POS Payment"}
                            </Button>
                             <Button 
                                onClick={() => handlePaymentClick("ONLINE")}
                                className="bg-[#1F4E58] hover:bg-[#16373e] text-white w-full md:w-40 gap-2 font-medium"
                            >
                                <Monitor className="w-4 h-4" />
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
          
          <div className="space-y-4 py-4">
            <AlertDialogDescription>
                {language === "AR" 
                    ? `هل أنت متأكد من دفع ${paymentAmount ? `${paymentAmount} OMR` : "المبلغ"} عبر ${paymentType === "POS" ? "جهاز POS" : "الدفع الإلكتروني"}؟`
                    : `Are you sure you want to pay ${paymentAmount ? `${paymentAmount} OMR` : "the amount"} via ${paymentType === "POS" ? "POS Device" : "Online Payment"}?`}
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
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setTerminalId(""); setTransactionId(""); }}>
                {language === "AR" ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmPayment} 
                disabled={paymentType === "POS" && (!terminalId || !transactionId)}
                className="bg-[#006A72] hover:bg-[#005a61]"
            >
                {language === "AR" ? "تأكيد الدفع" : "Confirm Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
