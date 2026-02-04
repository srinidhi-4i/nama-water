import { useState } from "react"
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"
import { waterShutdownService } from "@/services/watershutdown.service"
import { LoadingButton } from "@/components/ui/loading-button"

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
        <ResponsiveModal open={open} onOpenChange={onOpenChange}>
            <ResponsiveModalContent side="bottom" className="sm:max-w-[500px]">
                <ResponsiveModalHeader>
                    <ResponsiveModalTitle className="bg-[#006A72] text-white p-3 -mx-6 -mt-6 rounded-t-lg">
                        Send Completion Notification
                    </ResponsiveModalTitle>
                     <ResponsiveModalDescription className="py-6 text-center text-lg text-black font-medium">
                        Are you sure to send completion notification?
                    </ResponsiveModalDescription>
                </ResponsiveModalHeader>

                <ResponsiveModalFooter className="flex-row gap-2 sm:justify-center">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none sm:w-auto">Cancel</Button>
                    <LoadingButton 
                        className="bg-[#006A72] text-white hover:bg-[#00555b] flex-1 sm:flex-none sm:w-auto" 
                        onClick={handleConfirm}
                        isLoading={isLoading}
                        loadingText="Sending..."
                    >
                        Send
                    </LoadingButton>
                </ResponsiveModalFooter>
            </ResponsiveModalContent>
        </ResponsiveModal>
    )
}
