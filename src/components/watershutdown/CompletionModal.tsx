import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { waterShutdownService } from "@/services/watershutdown.service"
import { Loader2 } from "lucide-react"

interface CompletionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: string
    onSuccess: () => void
}

export function CompletionModal({
    open,
    onOpenChange,
    eventId,
    onSuccess
}: CompletionModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            await waterShutdownService.sendCompletionNotification(eventId)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to send completion notification:", error)
            alert("Failed to send completion notification")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="bg-[#006A72] text-white p-3 -mx-6 -mt-6 rounded-t-lg">
                        Send Completion Notification
                    </DialogTitle>
                     <DialogDescription className="py-6 text-center text-lg text-black font-medium">
                        Are you sure to send completion notification?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="justify-center sm:justify-center gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button 
                        className="bg-[#006A72] text-white hover:bg-[#00555b]" 
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
