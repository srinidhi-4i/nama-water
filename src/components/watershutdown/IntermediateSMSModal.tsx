import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { waterShutdownService } from "@/services/watershutdown.service"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

interface IntermediateSMSModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: string
    initialTemplateEn?: string
    initialTemplateAr?: string
    defaultTab?: "send" | "history"
    canSend?: boolean
    onSuccess: () => void
}

export function IntermediateSMSModal({
    open,
    onOpenChange,
    eventId,
    initialTemplateEn = "",
    initialTemplateAr = "",
    defaultTab = "send",
    canSend = true,
    onSuccess
}: IntermediateSMSModalProps) {
    const [activeTab, setActiveTab] = useState<string>(defaultTab)
    const [templateEn, setTemplateEn] = useState(initialTemplateEn)
    const [templateAr, setTemplateAr] = useState(initialTemplateAr)
    const [fromHrs, setFromHrs] = useState("")
    const [toHrs, setToHrs] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [isHistoryLoading, setIsHistoryLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setTemplateEn(initialTemplateEn)
            setTemplateAr(initialTemplateAr)
            setFromHrs("")
            setToHrs("")
            setActiveTab(defaultTab)
            loadHistory()
        }
    }, [open, eventId, initialTemplateEn, initialTemplateAr, defaultTab])

    const loadHistory = async () => {
        setIsHistoryLoading(true)
        try {
            const data = await waterShutdownService.getIntermediateHistory(eventId)
            // Ensure data is array
            setHistory(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error(error)
            setHistory([])
        } finally {
            setIsHistoryLoading(false)
        }
    }

    const handleSend = async () => {
        if (!fromHrs || !toHrs) {
            // In a real app show toast here
            alert("Please enter From Hrs and To Hrs")
            return
        }

        setIsLoading(true)
        try {
            await waterShutdownService.sendIntermediateSMS(eventId, {
                fromHour: fromHrs,
                toHour: toHrs,
                templateEn: templateEn,
                templateAr: templateAr
            })
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to send SMS:", error)
            alert("Failed to send intermediate SMS")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle className="bg-[#006A72] text-white p-3 -mx-6 -mt-6 rounded-t-lg">
                        Send Intermediate Message
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-start mb-4 border-b">
                        <TabsList className="bg-transparent border-none">
                            {canSend && (
                                <TabsTrigger 
                                    value="send" 
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#006A72] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2"
                                >
                                    Send Intermediate Message
                                </TabsTrigger>
                            )}
                            <TabsTrigger 
                                value="history"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#006A72] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2"
                            >
                                History
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="send" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Intermediate Message (English)</Label>
                                <Textarea 
                                    className="h-32 min-h-0"
                                    value={templateEn}
                                    onChange={(e) => setTemplateEn(e.target.value)}
                                />
                            </div>
                             <div className="space-y-2">
                                <Label>Intermediate Message (Arabic)</Label>
                                <Textarea 
                                    className="h-32 min-h-0 text-right"
                                    dir="rtl"
                                    value={templateAr}
                                    onChange={(e) => setTemplateAr(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>From Hrs</Label>
                                <Input 
                                    placeholder="Enter from hours" 
                                    value={fromHrs}
                                    onChange={(e) => setFromHrs(e.target.value)}
                                    type="number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>To Hrs</Label>
                                <Input 
                                    placeholder="Enter to hours" 
                                    value={toHrs}
                                    onChange={(e) => setToHrs(e.target.value)}
                                    type="number"
                                />
                            </div>
                        </div>

                         <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button 
                                className="bg-[#006A72] text-white hover:bg-[#00555b]" 
                                onClick={handleSend}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                         <div className="border rounded-md">
                            {isHistoryLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No history found</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-[#123756] text-white">
                                        <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Intermediate Message</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((item, index) => (
                                            <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-3">
                                                    {item.CreatedDate ? format(new Date(item.CreatedDate), 'dd/MM/yyyy HH:mm') : '--'}
                                                </td>
                                                <td className="p-3 max-w-md truncate" title={item.Comments || item.Message}>
                                                    {item.Comments || item.Message || '--'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
