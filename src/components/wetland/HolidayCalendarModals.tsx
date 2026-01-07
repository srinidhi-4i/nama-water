'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { WetlandHolidayListItem } from '@/types/wetland.types';

interface HolidayCalendarModalsProps {
    // Data Exists Modal
    showDataExistsModal: boolean;
    setShowDataExistsModal: (show: boolean) => void;
    onViewExisting: () => void;
    onCancelExisting: () => void;
    yearSelected: number;

    // WO Required Modal
    showWORequiredModal: boolean;
    setShowWORequiredModal: (show: boolean) => void;
    onCreateWO: () => void;
    onCancelWO: () => void;

    // Delete Single Holiday
    showDeleteModal: boolean;
    setShowDeleteModal: (show: boolean) => void;
    deleteTarget: WetlandHolidayListItem | null;
    confirmDelete: () => void;
    isLoading: boolean;

    // Edit SH Modal
    showEditSHModal: boolean;
    setShowEditSHModal: (show: boolean) => void;
    editFromDate: string;
    setEditFromDate: (date: string) => void;
    editToDate: string;
    setEditToDate: (date: string) => void;
    editDescription: string;
    setEditDescription: (desc: string) => void;
    editDescriptionAR: string;
    setEditDescriptionAR: (desc: string) => void;
    confirmEdit: () => void;

    // Delete All (WO/SH)
    showDeleteAllModal: boolean;
    setShowDeleteAllModal: (show: boolean) => void;
    onDeleteAll: () => void;
    type: 'WO' | 'SH' | '';

    // Warning Modal (606)
    showWarningModal: boolean;
    setShowWarningModal: (show: boolean) => void;
    warningMessage: string;
}

export default function HolidayCalendarModals({
    showDataExistsModal,
    setShowDataExistsModal,
    onViewExisting,
    onCancelExisting,
    yearSelected,
    showWORequiredModal,
    setShowWORequiredModal,
    onCreateWO,
    onCancelWO,
    showDeleteModal,
    setShowDeleteModal,
    deleteTarget,
    confirmDelete,
    isLoading,
    showEditSHModal,
    setShowEditSHModal,
    editFromDate,
    setEditFromDate,
    editToDate,
    setEditToDate,
    editDescription,
    setEditDescription,
    editDescriptionAR,
    setEditDescriptionAR,
    confirmEdit,
    showDeleteAllModal,
    setShowDeleteAllModal,
    onDeleteAll,
    type,
    showWarningModal,
    setShowWarningModal,
    warningMessage,
}: HolidayCalendarModalsProps) {
    return (
        <>
            {/* Data Exists Modal */}
            <Dialog open={showDataExistsModal} onOpenChange={setShowDataExistsModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Data Already Exists
                        </DialogTitle>
                        <DialogDescription>
                            Weekend Offs already exist for {yearSelected}. Do you want to view the existing data?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button variant="outline" onClick={onCancelExisting}>
                            No
                        </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={onViewExisting}>
                            Yes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* WO Required Modal */}
            <Dialog open={showWORequiredModal} onOpenChange={setShowWORequiredModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Weekend Off Required
                        </DialogTitle>
                        <DialogDescription>
                            Please create Weekend Offs for {yearSelected} before creating Special Holidays. Do you want to create Weekend Offs now?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button variant="outline" onClick={onCancelWO}>
                            No
                        </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={onCreateWO}>
                            Yes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription>
                            Do you want to delete the special holiday '{deleteTarget?.HolidayDescriptionEn}' that occurs on{' '}
                            {deleteTarget && new Date(deleteTarget.HolidayDate).toLocaleDateString('en-GB')}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit SH Modal */}
            <Dialog open={showEditSHModal} onOpenChange={setShowEditSHModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-teal-700">
                            <Calendar className="h-5 w-5" />
                            Edit Special Holiday
                        </DialogTitle>
                        <DialogDescription>
                            Update the details for the special holiday on {editFromDate}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">From Date</label>
                                <input
                                    type="date"
                                    value={editFromDate}
                                    onChange={(e) => setEditFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">To Date</label>
                                <input
                                    type="date"
                                    value={editToDate}
                                    onChange={(e) => setEditToDate(e.target.value)}
                                    min={editFromDate}
                                    className="w-full px-3 py-2 border rounded-md"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description [English]</label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-right">Description [Arabic]</label>
                            <textarea
                                value={editDescriptionAR}
                                onChange={(e) => setEditDescriptionAR(e.target.value)}
                                rows={3}
                                dir="rtl"
                                className="w-full px-3 py-2 border rounded-md"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditSHModal(false)}>
                            Cancel
                        </Button>
                        <Button 
                            className="bg-teal-600 hover:bg-teal-700" 
                            onClick={confirmEdit}
                            disabled={isLoading || !editDescription || !editDescriptionAR}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete All Confirmation Modal */}
            <Dialog open={showDeleteAllModal} onOpenChange={setShowDeleteAllModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete all {type === 'WO' ? 'Weekend' : 'Special'} Holidays for the year {yearSelected}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteAllModal(false)}
                        >
                            No
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                setShowDeleteAllModal(false);
                                onDeleteAll();
                            }}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Yes, Delete All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Warning Modal (Status 606) */}
            <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Warning
                        </DialogTitle>
                        <DialogDescription>
                            {warningMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end">
                        <Button
                            className="bg-teal-600 hover:bg-teal-700"
                            onClick={() => setShowWarningModal(false)}
                        >
                            Understood
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
