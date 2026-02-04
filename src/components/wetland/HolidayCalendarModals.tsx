'use client';

import React from 'react';
import {
    ResponsiveModal,
    ResponsiveModalContent,
    ResponsiveModalHeader,
    ResponsiveModalTitle,
    ResponsiveModalDescription,
    ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Info, AlertTriangle, Calendar } from 'lucide-react';
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
            <ResponsiveModal open={showDataExistsModal} onOpenChange={setShowDataExistsModal}>
                <ResponsiveModalContent side="bottom" className="sm:max-w-md">
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Data Already Exists
                        </ResponsiveModalTitle>
                        <ResponsiveModalDescription>
                            Weekend Offs already exist for {yearSelected}. Do you want to view the existing data?
                        </ResponsiveModalDescription>
                    </ResponsiveModalHeader>
                    <ResponsiveModalFooter className="flex-row gap-3 sm:justify-end">
                        <Button variant="outline" onClick={onCancelExisting} className="flex-1 sm:flex-none sm:w-auto">
                            No
                        </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none sm:w-auto" onClick={onViewExisting}>
                            Yes
                        </Button>
                    </ResponsiveModalFooter>
                </ResponsiveModalContent>
            </ResponsiveModal>

            {/* WO Required Modal */}
            <ResponsiveModal open={showWORequiredModal} onOpenChange={setShowWORequiredModal}>
                <ResponsiveModalContent side="bottom" className="sm:max-w-md">
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Weekend Off Required
                        </ResponsiveModalTitle>
                        <ResponsiveModalDescription>
                            Please create Weekend Offs for {yearSelected} before creating Special Holidays. Do you want to create Weekend Offs now?
                        </ResponsiveModalDescription>
                    </ResponsiveModalHeader>
                    <ResponsiveModalFooter className="flex-row gap-3 sm:justify-end">
                        <Button variant="outline" onClick={onCancelWO} className="flex-1 sm:flex-none sm:w-auto">
                            No
                        </Button>
                        <Button className="bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none sm:w-auto" onClick={onCreateWO}>
                            Yes
                        </Button>
                    </ResponsiveModalFooter>
                </ResponsiveModalContent>
            </ResponsiveModal>

            {/* Delete Confirmation Modal */}
            <ResponsiveModal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <ResponsiveModalContent side="bottom" className="sm:max-w-md">
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete
                        </ResponsiveModalTitle>
                        <ResponsiveModalDescription>
                            Do you want to delete the special holiday '{deleteTarget?.HolidayDescriptionEn}' that occurs on{' '}
                            {deleteTarget && new Date(deleteTarget.HolidayDate).toLocaleDateString('en-GB')}?
                        </ResponsiveModalDescription>
                    </ResponsiveModalHeader>
                    <ResponsiveModalFooter className="flex-row gap-3 sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 sm:flex-none sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            variant="destructive"
                            onClick={confirmDelete}
                            isLoading={isLoading}
                            className="flex-1 sm:flex-none sm:w-auto"
                        >
                            Delete
                        </LoadingButton>
                    </ResponsiveModalFooter>
                </ResponsiveModalContent>
            </ResponsiveModal>

            {/* Edit SH Modal */}
            <ResponsiveModal open={showEditSHModal} onOpenChange={setShowEditSHModal}>
                <ResponsiveModalContent side="bottom" className="sm:max-w-2xl">
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle className="flex items-center gap-2 text-teal-700 font-bold border-b pb-4">
                            <Calendar className="h-5 w-5" />
                            Edit Special Holiday
                        </ResponsiveModalTitle>
                        <ResponsiveModalDescription>
                            Update the details for the special holiday on {editFromDate}.
                        </ResponsiveModalDescription>
                    </ResponsiveModalHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">From Date</label>
                                <input
                                    type="date"
                                    value={editFromDate}
                                    onChange={(e) => setEditFromDate(e.target.value)}
                                    className="w-full h-11 px-3 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">To Date</label>
                                <input
                                    type="date"
                                    value={editToDate}
                                    onChange={(e) => setEditToDate(e.target.value)}
                                    min={editFromDate}
                                    className="w-full h-11 px-3 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Description [English]</label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                                className="w-full p-3 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 text-right w-full block">Description [Arabic]</label>
                            <textarea
                                value={editDescriptionAR}
                                onChange={(e) => setEditDescriptionAR(e.target.value)}
                                rows={3}
                                dir="rtl"
                                className="w-full p-3 border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <ResponsiveModalFooter className="flex-row gap-3 sm:justify-end">
                        <Button variant="outline" onClick={() => setShowEditSHModal(false)} className="flex-1 sm:flex-none sm:w-auto">
                            Cancel
                        </Button>
                        <LoadingButton 
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 flex-1 sm:flex-none sm:w-auto shadow-lg shadow-teal-100" 
                            onClick={confirmEdit}
                            isLoading={isLoading}
                            disabled={!editDescription || !editDescriptionAR}
                            loadingText="Saving Changes..."
                        >
                            Save Changes
                        </LoadingButton>
                    </ResponsiveModalFooter>
                </ResponsiveModalContent>
            </ResponsiveModal>

            {/* Delete All Confirmation Modal */}
            <ResponsiveModal open={showDeleteAllModal} onOpenChange={setShowDeleteAllModal}>
                <ResponsiveModalContent side="bottom" className="sm:max-w-md">
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Delete
                        </ResponsiveModalTitle>
                        <ResponsiveModalDescription>
                            Are you sure you want to delete all {type === 'WO' ? 'Weekend' : 'Special'} Holidays for the year {yearSelected}? This action cannot be undone.
                        </ResponsiveModalDescription>
                    </ResponsiveModalHeader>
                    <ResponsiveModalFooter className="flex-row gap-3 sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteAllModal(false)}
                            className="flex-1 sm:flex-none sm:w-auto"
                        >
                            No
                        </Button>
                        <LoadingButton
                            variant="destructive"
                            onClick={() => {
                                setShowDeleteAllModal(false);
                                onDeleteAll();
                            }}
                            isLoading={isLoading}
                            className="flex-1 sm:flex-none sm:w-auto"
                        >
                            Yes, Delete All
                        </LoadingButton>
                    </ResponsiveModalFooter>
                </ResponsiveModalContent>
            </ResponsiveModal>

            {/* Warning Modal (Status 606) */}
            <ResponsiveModal open={showWarningModal} onOpenChange={setShowWarningModal}>
                <ResponsiveModalContent side="bottom" className="sm:max-w-md">
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-5 w-5" />
                            Warning
                        </ResponsiveModalTitle>
                        <ResponsiveModalDescription>
                            {warningMessage}
                        </ResponsiveModalDescription>
                    </ResponsiveModalHeader>
                    <ResponsiveModalFooter className="sm:justify-end">
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto mt-2 h-11 font-bold"
                            onClick={() => setShowWarningModal(false)}
                        >
                            Understood
                        </Button>
                    </ResponsiveModalFooter>
                </ResponsiveModalContent>
            </ResponsiveModal>
        </>
    );
}
