"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { User, MapPin, Mail, Phone } from "lucide-react"
import { decryptString } from "@/lib/crypto"

interface DashboardSidebarProps {
    accountData: any
}

export default function DashboardSidebar({ accountData }: DashboardSidebarProps) {
    const { language } = useLanguage()

    if (!accountData) return null

    return (
        <div className="w-full h-full bg-white border-r shadow-sm overflow-y-auto">
            {/* Profile Card */}
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 border-b">
                <div className="h-24 w-24 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border-2 border-teal-100 mb-4">
                    <User className="h-12 w-12 text-teal-800" />
                </div>
                <h3 className="text-xl font-bold text-teal-900">{accountData.AccountHolderName || "Customer Name"}</h3>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">Primary Account Holder</p>
            </div>

            <div className="p-6 space-y-8">
                {/* Account Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                         <div className="h-6 w-1 bg-teal-600 rounded-full"></div>
                         <Label className="text-gray-800 text-sm font-bold uppercase tracking-tight">Account Details</Label>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center group">
                             <span className="text-sm font-medium text-gray-400">Account Number</span>
                             <span className="text-sm font-bold text-teal-900">{accountData.AccountNumber}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                             <span className="text-sm font-medium text-gray-400">Legacy ID</span>
                             <span className="text-sm font-bold text-teal-700">{accountData.LegacyId || "--"}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                             <span className="text-sm font-medium text-gray-400">Account Type</span>
                             <span className="text-sm font-bold text-slate-700">{accountData.ServiceType || "POSTPAID"}</span>
                        </div>
                        <div className="flex justify-between items-center group">
                             <span className="text-sm font-medium text-gray-400">Meter Number</span>
                             <span className="text-sm font-bold text-slate-700">{accountData.customerInfo?.meterNumber || accountData.MeterNumber || "N/A"}</span>
                        </div>
                         <div className="flex justify-between items-center group pt-2">
                             <span className="text-sm font-medium text-gray-400">Meter Location</span>
                             <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center justify-center shadow-sm border border-red-100 hover:bg-red-100 transition-colors cursor-pointer">
                                 <MapPin className="h-5 w-5 text-red-500" />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                         <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                         <Label className="text-gray-800 text-sm font-bold uppercase tracking-tight">Contact Info</Label>
                    </div>
                    
                    <div className="space-y-5">
                        <div className="flex items-start gap-4 group">
                             <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                                <Mail className="h-4 w-4 text-blue-600" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Email Address</p>
                                <p className="text-sm font-medium text-slate-700 truncate">{accountData.customerInfo?.emailId ? decryptString(accountData.customerInfo.emailId) : "--"}</p>
                             </div>
                        </div>
                        <div className="flex items-start gap-4 group">
                             <div className="h-8 w-8 rounded bg-green-50 flex items-center justify-center shrink-0">
                                <Phone className="h-4 w-4 text-green-600" />
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Mobile Number</p>
                                <p className="text-sm font-bold text-slate-700">{accountData.customerInfo?.gsmNumber ? decryptString(accountData.customerInfo.gsmNumber) : "17744944"}</p>
                             </div>
                        </div>
                         <div className="flex items-start gap-4 group">
                             <div className="h-8 w-8 rounded bg-gray-50 flex items-center justify-center shrink-0">
                                <MapPin className="h-4 w-4 text-gray-600" />
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Willayat / Area</p>
                                <p className="text-sm font-bold text-slate-700">{accountData.customerInfo?.willayat || "NIZWA 001"}</p>
                             </div>
                        </div>
                    </div>
                </div>
                
                {/* General Info */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b">
                         <div className="h-6 w-1 bg-slate-400 rounded-full"></div>
                         <Label className="text-gray-800 text-sm font-bold uppercase tracking-tight">General Info</Label>
                    </div>
                    
                     <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Civil ID</span>
                         <span className="text-sm font-black text-slate-800">{accountData.customerInfo?.civilId ? decryptString(accountData.customerInfo.civilId) : "--"}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
