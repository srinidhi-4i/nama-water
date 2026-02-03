"use client"

import { useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { User, MapPin, Mail, Phone, Info } from "lucide-react"
import { decryptString } from "@/lib/crypto"

interface DashboardSidebarProps {
    accountData: any
}

export default function DashboardSidebar({ accountData }: DashboardSidebarProps) {
    const { language } = useLanguage()

    // Debug logging
    useEffect(() => {
        console.log('Sidebar accountData:', { 
            AccountHolderName: accountData?.AccountHolderName, 
            AccountNumber: accountData?.AccountNumber,
            personName: accountData?.personName,
            personNameEn: accountData?.personNameEn 
        })
    }, [accountData])

    if (!accountData) return null

    return (
        <div className="w-full h-full bg-white border-r border-slate-200 overflow-y-auto hide-scrollbar">
            {/* Profile Section */}
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border-b border-slate-100">
                <div className="h-20 w-20 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border-2 border-teal-50 mb-4 transition-transform hover:scale-105">
                    <User className="h-10 w-10 text-teal-800" />
                </div>
                <h3 className="text-lg font-black text-slate-800">{accountData.AccountHolderName || accountData.personNameEn || accountData.personName || "--"}</h3>
                <p className="text-[10px] text-teal-600 font-black uppercase tracking-[0.2em] mt-1">Verified Account Holder</p>
            </div>

            <div className="p-5 space-y-6">
                {/* Account Details */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 px-1">
                         <Label className="text-slate-800 text-[10px] font-black uppercase tracking-tight">Account Details</Label>
                         <div className="h-1 w-1 rounded-full bg-teal-500"></div>
                    </div>
                    
                    <div className="space-y-3 px-1">
                         <div className="flex justify-between items-center group">
                              <span className="text-[10px] font-medium text-gray-400">Account Number</span>
                              <span className="text-[11px] font-black text-slate-700">{accountData.AccountNumber}</span>
                         </div>

                        <div className="flex justify-between items-center group">
                             <span className="text-[10px] font-medium text-gray-400">Account Type</span>
                             <span className="text-[9px] font-black text-orange-600 px-1.5 py-0.5 bg-orange-50 rounded">{accountData.ServiceType }</span>
                        </div>
                        <div className="flex justify-between items-center group">
                             <span className="text-[10px] font-medium text-gray-400">Water Meter Number</span>
                             <span className="text-[11px] font-black text-slate-700">{accountData.customerInfo?.meterNumber || "--"}</span>
                        </div>
                         <div className="flex justify-between items-center group">
                              <span className="text-[10px] font-medium text-gray-400">Meter Location</span>
                              <div className="h-7 w-7 bg-red-50 rounded flex items-center justify-center border border-red-100 hover:bg-red-500 hover:text-white transition-all cursor-pointer group/loc">
                                  <MapPin className="h-3.5 w-3.5 text-red-500 group-hover/loc:text-white" />
                              </div>
                         </div>
                        
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 px-1">
                         <Label className="text-slate-800 text-[10px] font-black uppercase tracking-tight">Contact Info</Label>
                         <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                    </div>
                    
                    <div className="space-y-3 px-1">
                        <div className="flex items-start gap-3 group">
                             <div className="h-7 w-7 rounded bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                             </div>
                             <div className="min-w-0">
                                 <p className="text-[11px] font-bold text-slate-700 truncate">{accountData.customerInfo?.emailId || "--"}</p>
                             </div>
                        </div>
                        <div className="flex items-start gap-3 group">
                             <div className="h-7 w-7 rounded bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                             </div>
                             <div>
                                <p className="text-[11px] font-black text-slate-700">{accountData.customerInfo?.gsmNumber || "--"}</p>
                             </div>
                        </div>
                         <div className="flex items-start gap-3 group">
                             <div className="h-7 w-7 rounded bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                             </div>
                             <div>
                                <p className="text-[11px] font-black text-slate-700">{accountData.customerInfo?.willayat || "--"}</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* General Information - Image 4 Style */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 px-1">
                         <Label className="text-slate-800 text-[10px] font-black uppercase tracking-tight">General Information</Label>
                         <div className="h-1 w-1 rounded-full bg-orange-400"></div>
                    </div>
                    
                    <div className="space-y-3 px-1">
                         <div className="flex justify-between items-center group">
                              <span className="text-[10px] font-medium text-gray-400">Civil ID</span>
                              <span className="text-[11px] font-black text-slate-700">
                                  {accountData.customerInfo?.civilId || "--"}
                              </span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
