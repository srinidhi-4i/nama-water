import React, { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, Plus, X, Search, Check, Info, MapPin, AlertCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { waterShutdownService } from '@/services/watershutdown.service';
import { 
    WaterShutdownNotification, 
    RegionItem, 
    EventTypeItem, 
    TeamActionConfig,
    FocalPoint,
    Contractor
} from '@/types/watershutdown.types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface NotificationEditorProps {
    notificationId?: string; // If present, it's Edit mode
    onBack: () => void;
    onSaveSuccess: () => void;
}

const TEAMS = [
    { name: "NWS Leadership Team", code: "NSLT" },
    { name: "Operational Top Management", code: "OPTTM" },
    { name: "Operation Team", code: "OPT" },
    { name: "Call Center", code: "CACE" },
    { name: "Quality & Health Saftey Directrate", code: "QHSD" },
    { name: "Communication", code: "COMM" },
    { name: "Customer", code: "CUST" }
];

const NOTIFICATION_TYPES = [
    "Event Creation",
    "Intermediate",
    "Event Completion",
    "Apology",
    "Reminder",
    "Cancellation"
];

export function NotificationEditor({ notificationId, onBack, onSaveSuccess }: NotificationEditorProps) {
    const isEdit = !!notificationId;
    const [activeTab, setActiveTab] = useState("notification");
    const [loading, setLoading] = useState(false);
    
    // Map Modal State
    const [showMapModal, setShowMapModal] = useState(false);
    const [masterData, setMasterData] = useState<{ regions: RegionItem[], eventTypes: EventTypeItem[], templateTypes: any[] }>({
        regions: [],
        eventTypes: [],
        templateTypes: []
    });

    // Form State
    const [notificationTitle, setNotificationTitle] = useState("");
    const [selectedEventType, setSelectedEventType] = useState<string>("");
    const [teamActions, setTeamActions] = useState<any[]>(
        TEAMS.map(team => ({
            teamName: team.name,
            code: team.code,
            isActive: false,
            actions: []
        }))
    );

    // Location State
    const et = masterData.eventTypes.find(e => e.EventTypeID.toString() === selectedEventType);
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [allWillayats, setAllWillayats] = useState<any[]>([]);
    const [selectedWillayats, setSelectedWillayats] = useState<string[]>([]);
    const [allDMAs, setAllDMAs] = useState<any[]>([]);
    const [selectedDMAs, setSelectedDMAs] = useState<string[]>([]);
    const [willayatSearch, setWillayatSearch] = useState("");
    const [dmaSearch, setDmaSearch] = useState("");
    const [locationDetails, setLocationDetails] = useState("");
    
    // Event Details State
    const [startDateTime, setStartDateTime] = useState("");
    const [endDateTime, setEndDateTime] = useState("");
    const [apologyDate, setApologyDate] = useState("");
    const [reminderDate, setReminderDate] = useState("");
    const [valveLock, setValveLock] = useState("No");
    const [typeOfPipeline, setTypeOfPipeline] = useState("");
    const [sizeOfPipeline, setSizeOfPipeline] = useState("");
    const [hours, setHours] = useState("");
    const [details, setDetails] = useState("");
    const [reason, setReason] = useState("");
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [newContractor, setNewContractor] = useState("");
    const [focalPoints, setFocalPoints] = useState<FocalPoint[]>([]);
    const [newFocal, setNewFocal] = useState<FocalPoint>({ Name: "", Email: "", "Contact Number": "" });
     const [userList, setUserList] = useState<any[]>([]);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelComments, setCancelComments] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await waterShutdownService.getWaterShutdownUserList();
            setUserList(data);
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Sequence calls to ensure Master Data is ready before Details tries to use it
                const mData = await fetchMasterData();
                if (isEdit && notificationId) {
                    await fetchNotificationDetails(mData);
                }
            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [notificationId]);

    const fetchMasterData = async () => {
        const data = await waterShutdownService.getWaterShutdownMasterData();
        setMasterData({ regions: data.regions, eventTypes: data.eventTypes, templateTypes: data.templateTypes });
        return data; // Return data for chaining
    };

    const fetchNotificationDetails = async (mData: { regions: RegionItem[], eventTypes: EventTypeItem[], templateTypes: any[] }) => {
        if (!notificationId) return;
        // removing local setLoading(true) as it's handled in init()
        try {
            const data = await waterShutdownService.getNotificationById(notificationId);
            console.log("[Edit Mode] Fetched notification data:", data);
            setNotificationTitle(data.notificationTitle || "");
            
            // Use eventTypeId if available, otherwise try to find by name
            if (data.eventTypeId) {
                setSelectedEventType(data.eventTypeId.toString());
            } else {
                const et = mData.eventTypes.find(e => e.EventTypeName === data.eventType || e.EventTypeName?.trim() === data.eventTypeName?.trim());
                if (et) setSelectedEventType(et.EventTypeID.toString());
                else setSelectedEventType(""); 
            }

            if (data.teamActions && data.teamActions.length > 0) {
                // Merge fetched actions with existing TEAMS structure to ensure UI consistency
                setTeamActions(prev => prev.map((team, index) => {
                    // Try to match by teamName if available, or fall back to index/code mapping logic
                    // The service now returns teamName if available.
                    
                    // Strategy: 
                    // 1. Find by Name
                    // 2. Find by Code (assuming linear mapping to TEAMS array index or specific codes)
                    
                    // Since we don't know the exact codes for each team in TEAMS array, 
                    // and Table1 might be sparse (only active teams), we need a best-effort match.
                    
                    // If the service parsed "teamName" correctly (from backend), use it.
                    let match = data.teamActions?.find(t => t.teamName && t.teamName === team.teamName);
                    
                    // Fallback: If no name match, assume Table1 order matches TEAMS? No, risky.
                    // Fallback: Use EventActionCode if we knew the mapping.
                    // For now, if we can't match by name, we might lose data if backend names differ from frontend TEAMS list.
                    // Assuming backend accepts these TEAM names:
                    
                    if (!match) {
                        // Try strict name match or fuzzy
                         match = data.teamActions?.find(t => t.teamName && t.teamName.toLowerCase().trim() === team.teamName.toLowerCase().trim());
                    }

                    if (match) {
                        return {
                            ...team,
                            isActive: true, // If present in DB, it's active? Or check flag?
                            actions: match.actions || [],
                            code: match.code
                        };
                    }
                    return team;
                }));
            }

            // Location
            // Location
            // Ensure we match by ID or Name
            // Ensure we match by ID or Name using the passed master data (mData)
            const cleanRegionName = (name: string) => name?.toLowerCase().trim();
            const reg = mData.regions.find(r => 
                (r.RegionName && cleanRegionName(r.RegionName) === cleanRegionName(data.region)) || 
                (r.RegionCode && r.RegionCode === data.regionCode)
            );
            
            if (reg) {
                setSelectedRegion(reg.RegionID);
                // Populate allWillayats immediately
                if (reg.wilayats) {
                    setAllWillayats(reg.wilayats);
                    
                    // Convert Willayat NAMES to CODES
                    // data.affectedWillayats contains names like ["AL AMRAT"]
                    // but we need codes like ["ALAR"]
                    if (data.affectedWillayats && data.affectedWillayats.length > 0) {
                        console.log('[Edit] affectedWillayats from API (names):', data.affectedWillayats);
                        console.log('[Edit] reg.wilayats:', reg.wilayats);
                        
                        const willayatCodes = data.affectedWillayats
                            .map((name: string) => {
                                // Try to find by name (case-insensitive) OR Code OR ID
                                const found = reg.wilayats?.find((w: any) => 
                                    w.WillayathNameEn?.toUpperCase().trim() === name.toUpperCase().trim() ||
                                    w.WillayathName?.toUpperCase().trim() === name.toUpperCase().trim() ||
                                    w.WillayathCode === name ||
                                    w.WillayathID?.toString() === name
                                );
                                console.log(`[Edit] Looking for willayat "${name}", found:`, found);
                                return found?.WillayathCode;
                            })
                            .filter((code: string | undefined) => code !== undefined);
                        
                        console.log('[Edit] Converted willayat codes:', willayatCodes);
                        setSelectedWillayats(willayatCodes);
                    }
                }
            }
            
            // Set DMAs - these are already codes
            console.log('[Edit] Setting selectedDMAs:', data.affectedDMAs);
            setSelectedDMAs(data.affectedDMAs || []);
            
            // Set Location Details
            setLocationDetails(data.locationDetails || "");

            // Event Details
            setStartDateTime(data.startDateTime?.split('Z')[0] || "");
            setEndDateTime(data.endDateTime?.split('Z')[0] || "");
            const d = data as any;
            // User Instruction: Map ScheduleNotificationDate to ApologyNotificationDate if Apology missing
            const apology = d.apologyNotificationDate || d.ApologyNotificationDate || d.ApologyDate || d.scheduleNotificationDate || d.ScheduleNotificationDate;
            const remainder = d.remainderNotificationDate || d.RemainderNotificationDate || d.reminderNotificationDate || d.ReminderNotificationDate;
            
            setApologyDate(apology?.split('Z')[0] || "");
            setReminderDate(remainder?.split('Z')[0] || "");
            setValveLock(data.valveLock || "No");
            setTypeOfPipeline(data.typeOfPipeline || "");
            setSizeOfPipeline(data.sizeOfPipeline || "");
            
            // Calculate hours if not provided
            let calculatedHours = data.numberOfHours || "";
            if (!calculatedHours && data.startDateTime && data.endDateTime) {
                try {
                    const start = new Date(data.startDateTime);
                    const end = new Date(data.endDateTime);
                    const diffMs = end.getTime() - start.getTime();
                    const diffHours = diffMs / (1000 * 60 * 60);
                    calculatedHours = diffHours.toFixed(2);
                    console.log('[Edit] Calculated hours from dates:', calculatedHours);
                } catch (e) {
                    console.error('[Edit] Error calculating hours:', e);
                }
            }
            setHours(calculatedHours);
            
            setDetails(data.notificationDetails || "");
            setReason(data.reasonForShutdown || "");
            setContractors(data.contractors || []);
            setFocalPoints(data.focalPoint || []);
            
            console.log('[Edit] Focal points set:', data.focalPoint);

        } catch (error: any) {
            console.error('Error fetching notification details:', error);
            toast.error("Failed to load notification details. Returning to list.");
            onBack();
        } 
    };

    const autoSelectActions = (typeId: string) => {
        const eventType = masterData.eventTypes.find(t => t.EventTypeID.toString() === typeId);
        if (!eventType) return;

        const code = eventType.EventTypeCode;
        console.log(`[Auto-Select] EventTypeCode: ${code}`);
        
        setTeamActions(prev => prev.map(team => {
            let active = false;
            let actions: string[] = [];

            // Legacy Mapping Rules:
            // MJPE (Major Planned): NSLT, OPTTM, OPT, CACE -> EVNT; CUST -> APOL, CANC, REMD
            // MIPE (Minor Planned): Same as Major
            // Others (Unplanned etc): NSLT, OPTTM, OPT, CACE, QHSD, COMM -> EVNT; CUST -> APOL

            const isMajorMinor = code === "MJPE" || code === "MIPE";

            if (isMajorMinor) {
                if (["NWS Leadership Team", "Operational Top Management", "Operation Team", "Call Center"].includes(team.teamName)) {
                    active = true;
                    actions = ["Event Creation"];
                } else if (team.teamName === "Customer") {
                    active = true;
                    actions = ["Apology", "Reminder", "Cancellation"].filter(a => NOTIFICATION_TYPES.includes(a));
                }
            } else {
                // Others (Default / Unplanned)
                if (["NWS Leadership Team", "Operational Top Management", "Operation Team", "Call Center", "Quality & Health Saftey Directrate", "Communication"].includes(team.teamName)) {
                    active = true;
                    actions = ["Event Creation"];
                } else if (team.teamName === "Customer") {
                    active = true;
                    actions = ["Apology"];
                }
            }

            return {
                ...team,
                isActive: active,
                actions: actions
            };
        }));
    };

    const handleEventTypeChange = (value: string) => {
        setSelectedEventType(value);
        if (!isEdit) {
            autoSelectActions(value);
        }
    };

    // Re-run detail fetch once regions/event types are loaded to ensure correct ID mapping
    useEffect(() => {
        if (masterData.regions.length > 0 && selectedRegion) {
             // Automatically filter Willayats when region is selected (from Master Data)
             const region = masterData.regions.find(r => r.RegionID === selectedRegion);
             if (region && region.wilayats) {
                 setAllWillayats(region.wilayats);
             } else {
                 setAllWillayats([]);
             }
        }
    }, [masterData, selectedRegion]);

    useEffect(() => {
        if (isEdit && masterData.regions.length > 0 && loading === false && !selectedRegion) {
             fetchNotificationDetails(masterData);
        }
    }, [masterData]);

    // Removed fetchWillayats as it's handled by master data filtering now

    useEffect(() => {
        if (selectedWillayats.length > 0) {
            fetchDMAs(selectedWillayats);
        } else {
            setAllDMAs([]);
        }
    }, [selectedWillayats, allWillayats]);

    useEffect(() => {
        if (selectedEventType && !isEdit) {
            const defaultActions = ["Event Creation", "Reminder"];
            // Only set defaults if actions are empty to prevent overwriting user changes?
            // User requirement: "in the notification details the event action is again getting event creation and remainder as the same event action"
            // This implies duplication or overwriting.
            // If !isEdit, we want to set defaults.
            
            setTeamActions(prev => prev.map(team => {
                 // ONLY add defaults if the team currently has NO actions? 
                 // Or just ensure we don't duplicate.
                 // User Requirement: "each event type has its own mandatory event action if needed we can change that manually"
                 
                 // If the user has manually cleared actions, we shouldn't re-add them instantly.
                 // But in Create mode, we want initial defaults.
                 
                 // If the team has actions, keep them. If not, add defaults?
                 // No, that overrides manual clearing.
                 
                 // Better approach: ONLY set defaults when the event type CHANGED and the actions were empty before?
                 // Or just initialize once.
                 
                 // Current simple fix: Only add if 'Team Actions' is completely untouched (e.g. initial load of Create).
                 // But we are in a map.
                 
                 // Let's just ensure uniquenes and rely on the initial state or user interaction.
                 // For now, removing the "mandatory" force logic on every render, 
                 // and only ensuring uniqueness if we DO add them.
                 
                 // Actually, if this useEffect runs on every 'selectedEventType' change, it changes actions.
                 // We should probably only do this if the user *just* selected the type.
                 
                 const currentActions = new Set(team.actions);
                 // For now, let's NOT auto-add unless we decide specific logic based on Type.
                 // If the user says "Event Type has its own mandatory action", maybe we switch based on type.
                 // For now, just ensure no duplicates if we do add them in future.
                 
                 return team; 
            }));
        }
    }, [selectedEventType, isEdit]);

    // Replaced async fetchDMAs with synchronous filtering from master data
    const fetchDMAs = (willayatCodes: string[]) => {
        // Collect all DMAs from the currently loaded Willayats (which are already filtered by Region)
        const relevantWillayats = allWillayats.filter(w => willayatCodes.includes(w.WillayathCode));
        const dmas = relevantWillayats.flatMap(w => w.DMAs || []);
        
        // Deduplicate DMAs by Code
        const uniqueDMAs = dmas.reduce((acc: any[], current: any) => {
             const x = acc.find(item => item.DMACode === current.DMACode);
             if (!x) return acc.concat([current]);
             return acc;
        }, []);

        setAllDMAs(uniqueDMAs);
    };

    const handleTeamActionToggle = (index: number) => {
        const updated = [...teamActions];
        updated[index].isActive = !updated[index].isActive;
        setTeamActions(updated);
    };

    const handleTeamActionChange = (index: number, action: string) => {
        const updated = [...teamActions];
        const actions = [...updated[index].actions];
        if (actions.includes(action)) {
            updated[index].actions = actions.filter(a => a !== action);
        } else {
            updated[index].actions = [...actions, action];
        }
        setTeamActions(updated);
    };

    const isStep1Valid = () => {
        return notificationTitle.trim() !== "" && selectedEventType !== "";
    };

    const isStep2Valid = () => {
        return selectedRegion !== "" && locationDetails.trim() !== "";
    };

    const handleNext = () => {
        if (activeTab === "notification" && isStep1Valid()) setActiveTab("location");
        else if (activeTab === "location" && isStep2Valid()) setActiveTab("event");
    };

    const getCommonPayload = (contractorList: Contractor[] = contractors) => {
        const et = masterData.eventTypes.find(e => e.EventTypeID.toString() === selectedEventType);
        const eventTypeCategory = et?.EventTypeName || (et as any)?.EventTypeNameEn || "";
        
        const selectedRegionObj = masterData.regions.find(r => r.RegionCode === selectedRegion);
        const selectedWillayatObjs = allWillayats.filter(w => selectedWillayats.includes(w.WillayathCode));
        const selectedDMAObjs = Array.isArray(allDMAs) 
            ? allDMAs.filter(d => selectedDMAs.includes(d.DMACode)) 
            : []; 

        // focalPointsPayload must be before EventJsonData
        const focalPointsPayload = focalPoints.map(fp => ({
            Name: fp.Name,
            Email: fp.Email,
            "Contact Number": fp["Contact Number"] || "",
            ContactNumber: fp["Contact Number"] || "" 
        }));

        const startTimeFormatted = isValid(new Date(startDateTime)) ? format(new Date(startDateTime), 'yyyy-MM-dd HH:mm:ss') + '.000' : startDateTime;
        const endTimeFormatted = isValid(new Date(endDateTime)) ? format(new Date(endDateTime), 'yyyy-MM-dd HH:mm:ss') + '.000' : endDateTime;

        const eventJsonData = JSON.stringify({
            ActionsRequired: teamActions.filter(t => t.isActive).map(t => t.teamName),
            AffectedWillayats: selectedWillayatObjs.map(w => w.WillayathNameEn || w.WillayathName || w.WillayathCode),
            AffectedDMAs: selectedDMAObjs.map(d => d.DMANameEn || d.DMAName || d.DMACode),
            MapLocations: [],
            LocationDetails: locationDetails,
            ValveLock: valveLock,
            NotificationDetails: details,
            ReasonForShutdown: reason,
            StartTime: startTimeFormatted,
            EndTime: endTimeFormatted,
            FocalPoint: focalPointsPayload,
            SizeOfPipeline: sizeOfPipeline,
            TypeOfPipeline: typeOfPipeline,
            InitiatedBy: "", 
            ContractorName: contractorList,
            NumberOfHours: hours || "0"
        });

        const eventNotificationDetailsAction = teamActions.map(t => {
            const templates = t.actions.map((actionName: string) => {
                const found = masterData.templateTypes.find((tt: any) => 
                    (tt.TemplateTypeNameEn && tt.TemplateTypeNameEn.trim() === actionName.trim()) || 
                    (tt.TemplateTypeName && tt.TemplateTypeName.trim() === actionName.trim())
                );
                
                let tCode = "EVNT";
                if (actionName.toLowerCase().includes("apology")) tCode = "APOL";
                if (actionName.toLowerCase().includes("reminder")) tCode = "REMD";
                if (actionName.toLowerCase().includes("cancellation")) tCode = "CANC";

                return {
                    TemplateCode: tCode,
                    TemplateName: found?.TemplateTypeNameEn || found?.TemplateTypeName || actionName
                };
            });

            return {
                EventActionCode: t.code,
                IsEventAction: t.isActive,
                Templates: templates
            };
        });

        return {
            notificationTitle,
            eventTypeId: parseInt(selectedEventType),
            eventTypeCategory, 
            regionId: selectedRegion,
            locationDetails,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            apologyNotificationDate: apologyDate,
            remainderNotificationDate: reminderDate,
            valveLock,
            typeOfPipeline,
            sizeOfPipeline,
            numberOfHours: hours,
            notificationDetails: details,
            reasonForShutdown: reason,
            eventJsonData,
            contractors: contractorList, 
            focalPoints: focalPointsPayload, 
            teamActions,
            eventNotificationDetails: eventNotificationDetailsAction,
            locationObjects: {
                region: selectedRegionObj,
                willayats: selectedWillayatObjs,
                dmas: selectedDMAObjs
            }
        };
    };

    const handleSave = async () => {
        if (new Date(startDateTime) > new Date(endDateTime)) {
            toast.error("Start Date cannot be after End Date");
            return;
        }

        try {
            setLoading(true);
            
            let finalContractors = [...contractors];
            if (newContractor.trim() && !finalContractors.some(c => c.contractorName === newContractor.trim())) {
                finalContractors.push({ contractorName: newContractor.trim() });
            }

            const payload: any = getCommonPayload(finalContractors);
            console.log('[Debug] Save Payload:', payload);

            if (isEdit) {
                await waterShutdownService.updateNotification(notificationId!, payload);
                toast.success("Notification updated successfully");
            } else {
                await waterShutdownService.createNotification(payload);
                toast.success("Notification created successfully");
            }
            onSaveSuccess();
        } catch (error) {
            toast.error("Failed to save notification");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEvent = async () => {
        if (!cancelComments) {
            toast.error("Please enter cancellation comments");
            return;
        }

        try {
            setIsCancelling(true);
            
            let finalContractors = [...contractors];
            if (newContractor.trim() && !finalContractors.some(c => c.contractorName === newContractor.trim())) {
                finalContractors.push({ contractorName: newContractor.trim() });
            }

            const cancelData: any = getCommonPayload(finalContractors);
            cancelData.comments = cancelComments;
            
            // Override templates to CANC for cancellation flow if required by backend
            if (cancelData.eventNotificationDetails) {
                cancelData.eventNotificationDetails = cancelData.eventNotificationDetails.map((t: any) => ({
                    ...t,
                    Templates: t.Templates.map((tmp: any) => ({ ...tmp, TemplateCode: "CANC" }))
                }));
            }

            console.log('[Debug] Cancel Payload:', cancelData);

            await waterShutdownService.cancelNotification(notificationId!, cancelData as any);
            toast.success(`the event number ${notificationId} has been cancelled`);
            setIsCancelModalOpen(false);
            onSaveSuccess(); 
        } catch (error) {
            toast.error("Failed to cancel event");
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen pb-12">
            <div className="max-w-[1200px] mx-auto pt-6 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-white transition-colors">
                            <ChevronLeft className="w-6 h-6 text-[#123756]" />
                        </Button>
                        <h1 className="text-2xl font-bold text-[#123756]">
                            {isEdit ? "Edit Water Shutdown Event" : "Create Water Shutdown Event"}
                        </h1>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={(val: string) => {
                    if (isEdit) setActiveTab(val);
                    else if (val === "location" && isStep1Valid()) setActiveTab(val);
                    else if (val === "event" && isStep1Valid() && isStep2Valid()) setActiveTab(val);
                }} className="space-y-6">
                    <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-4 overflow-x-auto flex-nowrap shrink-0">
                        <TabsTrigger value="notification" className="data-[state=active]:border-[#42777c] data-[state=active]:text-[#42777c] border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap">
                            Notification Details
                        </TabsTrigger>
                        <TabsTrigger value="location" disabled={!isEdit && !isStep1Valid()} className="data-[state=active]:border-[#42777c] data-[state=active]:text-[#42777c] border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 whitespace-nowrap">
                            Location Details
                        </TabsTrigger>
                        <TabsTrigger value="event" disabled={!isEdit && (!isStep1Valid() || !isStep2Valid())} className="data-[state=active]:border-[#42777c] data-[state=active]:text-[#42777c] border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 whitespace-nowrap">
                            Event Details
                        </TabsTrigger>
                    </TabsList>

                    {/* Step 1: Notification Details */}
                    <TabsContent value="notification">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                            Notification Title <span className="text-red-500 font-bold">*</span>
                                        </label>
                                        <Input 
                                            placeholder="Enter notification title" 
                                            value={notificationTitle}
                                            onChange={(e) => setNotificationTitle(e.target.value)}
                                            className="h-11 border-gray-200 focus:border-[#42777c] transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                            Event Type <span className="text-red-500 font-bold">*</span>
                                        </label>
                                        <Select value={selectedEventType} onValueChange={handleEventTypeChange}>
                                            <SelectTrigger className="h-11 border-gray-200">
                                                <SelectValue placeholder="Select Event Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {masterData.eventTypes.map(type => (
                                                    <SelectItem key={type.EventTypeID} value={type.EventTypeID.toString()}>
                                                        {type.EventTypeName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="text-sm font-bold text-gray-700 block">
                                        Event Actions <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-gray-50/80">
                                                <TableRow>
                                                    <TableHead className="font-bold text-[#123756]">Status</TableHead>
                                                    <TableHead className="font-bold text-[#123756]">Teams</TableHead>
                                                    <TableHead className="font-bold text-[#123756]">Select Notifications</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {teamActions.map((team, idx) => (
                                                    <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <TableCell className="w-24">
                                                            <div className="flex items-center gap-3">
                                                                <span className={team.isActive ? "text-xs font-bold text-emerald-600" : "text-xs font-bold text-gray-400"}>
                                                                    {team.isActive ? "Yes" : "No"}
                                                                </span>
                                                                <Checkbox 
                                                                    checked={team.isActive} 
                                                                    onCheckedChange={() => handleTeamActionToggle(idx)}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-medium text-gray-800">{team.teamName}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-wrap gap-2 min-h-[44px] items-center">
                                                                {team.isActive ? (
                                                                    <>
                                                                        <Select onValueChange={(val) => handleTeamActionChange(idx, val)}>
                                                                            <SelectTrigger className="w-full text-xs h-9 border-dashed border-gray-300 hover:border-[#42777c] transition-all">
                                                                                <SelectValue placeholder="Select actions..." />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {NOTIFICATION_TYPES.map(type => (
                                                                                    <SelectItem key={type} value={type} className="text-xs">
                                                                                        <div className="flex items-center justify-between w-full">
                                                                                            {type}
                                                                                            {team.actions.includes(type) && <Check className="w-3 h-3 ml-2 text-emerald-500" />}
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                                            {team.actions.map((action: string, actionIdx: number) => (
                                                                                <Badge key={`${action}-${actionIdx}`} variant="secondary" className="bg-[#42777c]/10 text-[#42777c] border-none px-2 py-0.5 text-[10px] flex items-center gap-1 pr-1">
                                                                                    {action}
                                                                                    <span 
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleTeamActionChange(idx, action);
                                                                                        }}
                                                                                        className="hover:bg-red-100 p-0.5 rounded-full cursor-pointer transition-colors"
                                                                                    >
                                                                                        <X className="w-2.5 h-2.5" />
                                                                                    </span>
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 italic">Enable switch to select actions</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t font-sans gap-4">
                                    {isEdit && et?.EventTypeName?.toLowerCase().includes("planned") && !et?.EventTypeName?.toLowerCase().includes("unplanned") && (
                                        <Button 
                                            variant="outline" 
                                            className="border-red-200 text-red-600 hover:bg-red-50 h-11 px-6 rounded-lg font-bold"
                                            onClick={() => setIsCancelModalOpen(true)}
                                        >
                                            Cancel Event
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={handleNext} 
                                        disabled={!isStep1Valid()}
                                        className="bg-[#123756] hover:bg-[#1a4a75] px-8 h-11 rounded-lg transition-all"
                                    >
                                        Proceed to Location
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Step 2: Location Details */}
                    <TabsContent value="location">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardContent className="p-6 space-y-6">
                                <div className="max-w-md space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                        Region <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                        <SelectTrigger className="h-11 border-gray-200">
                                            <SelectValue placeholder="Select Region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {masterData.regions.map(reg => (
                                                <SelectItem key={reg.RegionID} value={reg.RegionID}>
                                                    {reg.RegionName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Location Details Input */}
                                <div className="max-w-2xl space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                        Location Details <span className="text-red-500 font-bold">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Enter location details" 
                                            className="h-11 border-gray-200 flex-1"
                                            value={locationDetails}
                                            onChange={(e) => setLocationDetails(e.target.value)}
                                        />
                                        <Button 
                                            variant="outline" 
                                            className="h-11 px-4 border-gray-200"
                                            onClick={() => {
                                                // Get current location logic
                                                setShowMapModal(true);
                                            }}
                                        >
                                            <MapPin className="w-4 h-4 mr-2" />
                                            Get Current Location
                                        </Button>
                                    </div>
                                </div>

                                {/* Map Modal */}
                                {showMapModal && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
                                            <div className="bg-[#123756] p-4 text-white flex justify-between items-center">
                                                <h3 className="font-bold">Map Locations</h3>
                                                <button onClick={() => setShowMapModal(false)} className="hover:bg-white/10 p-1 rounded">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="p-0 flex justify-center items-center bg-gray-100 min-h-[400px]">
                                                {/* Styled Map Placeholder matching UAT style */}
                                                <div className="w-full h-full min-h-[400px] bg-[#eef2f6] relative flex items-center justify-center border-t border-b">
                                                     {/* Simple map representation */}
                                                     <div className="w-[80%] h-[80%] bg-white shadow-sm border border-gray-200 relative rounded-sm overflow-hidden p-4">
                                                        <div className="absolute top-0 left-0 w-full h-8 bg-[#f8fafc] border-b flex items-center px-2 gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                        </div>
                                                        <div className="mt-6 flex flex-col gap-2">
                                                            {/* Mock Map UI Elements */}
                                                            <div className="h-2 w-1/3 bg-gray-100 rounded"></div>
                                                            <div className="h-32 w-full bg-blue-50/50 rounded border border-blue-100 relative">
                                                                <MapPin className="text-red-600 w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md animate-bounce" fill="currentColor" />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="h-2 w-1/4 bg-gray-100 rounded"></div>
                                                                <div className="h-2 w-1/4 bg-gray-100 rounded"></div>
                                                            </div>
                                                        </div>
                                                     </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white border-t flex justify-center">
                                                <Button 
                                                    onClick={() => {
                                                        // Simulate fetching location
                                                        setLocationDetails("OMN2426 - Muscat Ref"); 
                                                        setShowMapModal(false);
                                                    }} 
                                                    className="bg-[#123756] px-8"
                                                >
                                                    Ok
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 lg:h-[500px]">
                                    {/* Column 1: Select All Willayats */}
                                    <div className="flex flex-col border rounded-xl overflow-hidden bg-white">
                                        <div className="bg-gray-50 border-b p-3 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#123756] text-white flex items-center justify-center font-bold text-xs">1</div>
                                            <span className="text-sm font-bold text-[#123756]">All Willayats</span>
                                        </div>
                                        <div className="p-3 border-b">
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <Input 
                                                    placeholder="Search willayat..." 
                                                    className="pl-9 h-9 text-sm"
                                                    value={willayatSearch}
                                                    onChange={(e) => setWillayatSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                            {allWillayats
                                                .filter(w => (w.WillayathNameEn || w.WillayathName || "").toLowerCase().includes(willayatSearch.toLowerCase()))
                                                .map(w => {
                                                    // Match by WillayathCode (which is what we store in selectedWillayats)
                                                    const isSelected = selectedWillayats.includes(w.WillayathCode);
                                                    return (
                                                        <div 
                                                            key={w.WillayathID} 
                                                            onClick={async () => {
                                                                // Toggle selection
                                                                if (isSelected) {
                                                                    setSelectedWillayats(prev => prev.filter(code => code !== w.WillayathCode));
                                                                } else {
                                                                    setSelectedWillayats(prev => [...prev, w.WillayathCode]);
                                                                }
                                                                
                                                                // Let the useEffect handle DMA loading, or trigger explicitly if needed
                                                            }}
                                                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-[#42777c]/10 text-[#42777c]' : 'hover:bg-gray-50 text-gray-600'}`}
                                                        >
                                                            <span className="text-sm font-medium">{w.WillayathNameEn || w.WillayathName}</span>
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#42777c] border-[#42777c]' : 'border-gray-200'}`}>
                                                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        <div className="p-3 bg-gray-50 border-t flex justify-between gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setSelectedWillayats([])}>Clear</Button>
                                            <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-[#123756]" onClick={() => {
                                                if (selectedWillayats.length > 0) {
                                                    // On mobile, this would scroll to section 2
                                                }
                                            }}>Confirm Selection</Button>
                                        </div>
                                    </div>

                                    {/* Column 2: Affected Willayats (Select DMAs) */}
                                    <div className="flex flex-col border rounded-xl overflow-hidden bg-white">
                                        <div className="bg-gray-50 border-b p-3 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#123756] text-white flex items-center justify-center font-bold text-xs">2</div>
                                            <span className="text-sm font-bold text-[#123756]">Affected Willayats</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar bg-white">
                                             {Array.from(new Set(selectedWillayats)).map((willayatCode, idx) => {
                                                const w = allWillayats.find(item => item.WillayathCode === willayatCode);
                                                if (!w) return null;
                                                return (
                                                    <div key={`${willayatCode}-${idx}`} className="border-b last:border-b-0">
                                                        <div className="bg-gray-50/50 p-2 px-3 flex items-center justify-between sticky top-0 z-10 font-medium text-[#123756]">
                                                             <div className="flex items-center gap-2">
                                                                 {/* Allow selecting ALL DMAs for this Willayat */}
                                                                 <div 
                                                                    onClick={() => {
                                                                        const dmas = w.DMAs || [];
                                                                        const allCodes = dmas.map((d: any) => d.DMACode);
                                                                        const allSelected = allCodes.every((c: string) => selectedDMAs.includes(c));
                                                                        
                                                                        if (allSelected) {
                                                                            // Deselect all
                                                                            setSelectedDMAs(prev => prev.filter(c => !allCodes.includes(c)));
                                                                        } else {
                                                                            // Select all (union)
                                                                            setSelectedDMAs(prev => Array.from(new Set([...prev, ...allCodes])));
                                                                        }
                                                                    }}
                                                                    className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${
                                                                        (w.DMAs || []).length > 0 && (w.DMAs || []).every((d: any) => selectedDMAs.includes(d.DMACode))
                                                                            ? 'bg-[#123756] border-[#123756]' 
                                                                            : 'border-gray-300 bg-white'
                                                                    }`}
                                                                 >
                                                                    {(w.DMAs || []).length > 0 && (w.DMAs || []).every((d: any) => selectedDMAs.includes(d.DMACode)) && <Check className="w-3 h-3 text-white" />}
                                                                 </div>
                                                                 <span className="text-sm">{w.WillayathNameEn || w.WillayathName}</span>
                                                             </div>
                                                        </div>
                                                        <div className="p-2 pl-8 space-y-1">
                                                            {w.DMAs && w.DMAs.length > 0 ? (
                                                                w.DMAs.map((dma: any) => {
                                                                    const isSelected = selectedDMAs.includes(dma.DMACode);
                                                                    return (
                                                                        <div 
                                                                            key={dma.DMACode}
                                                                            className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded px-2"
                                                                            onClick={() => {
                                                                                if (isSelected) setSelectedDMAs(prev => prev.filter(code => code !== dma.DMACode));
                                                                                else setSelectedDMAs(prev => [...prev, dma.DMACode]);
                                                                            }}
                                                                        >
                                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-[#42777c] border-[#42777c]' : 'border-gray-300'}`}>
                                                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                            </div>
                                                                            <span className="text-sm text-gray-600">{dma.DMACode}</span>
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <div className="text-xs text-gray-400 italic py-2">No DMAs available</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedWillayats.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center space-y-2 opacity-50 p-8">
                                                    <Info className="w-8 h-8" />
                                                    <p className="text-xs">Select willayats from column 1 to see DMAs</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-gray-50 border-t flex justify-between gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setSelectedWillayats([])}>Clear All</Button>
                                            <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-[#123756]" onClick={() => {
                                                // Noop - visual confirmation
                                            }}>Confirm Selection</Button>
                                        </div>
                                    </div>

                                    {/* Column 3: Affected DMA (Selected Summary) */}
                                    <div className="flex flex-col border rounded-xl overflow-hidden bg-white">
                                        <div className="bg-gray-50 border-b p-3 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#123756] text-white flex items-center justify-center font-bold text-xs">3</div>
                                            <span className="text-sm font-bold text-[#123756]">Affected DMA</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar bg-white">
                                             {selectedWillayats.map(willayatCode => {
                                                const w = allWillayats.find(item => item.WillayathCode === willayatCode);
                                                if (!w) return null;
                                                
                                                // Filter DMAs for this Willayat that are SELECTED
                                                const selectedHere = (w.DMAs || []).filter((d: any) => selectedDMAs.includes(d.DMACode));
                                                
                                                if (selectedHere.length === 0) return null;

                                                return (
                                                    <div key={willayatCode} className="border-b last:border-b-0">
                                                        <div className="bg-emerald-50/50 p-2 px-3 sticky top-0 z-10 font-bold text-[#123756] text-sm flex items-center gap-2">
                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                            {w.WillayathNameEn || w.WillayathName}
                                                        </div>
                                                        <div className="p-2 pl-8 space-y-1">
                                                            {selectedHere.map((dma: any) => (
                                                                <div key={dma.DMACode} className="flex items-center gap-2 py-1">
                                                                     <div className="w-4 h-4 rounded bg-[#123756] flex items-center justify-center">
                                                                        <Check className="w-3 h-3 text-white" />
                                                                     </div>
                                                                     <span className="text-sm text-gray-700 font-medium">{dma.DMACode}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                             })}
                                             {selectedDMAs.length === 0 && (
                                                <div className="p-8 text-center text-gray-400 text-xs italic">
                                                    No DMAs selected. Select DMAs from column 2.
                                                </div>
                                             )}
                                        </div>
                                        <div className="p-3 bg-gray-50 border-t flex justify-between gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setSelectedDMAs([])}>Clear</Button>
                                            <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-[#123756]" onClick={() => {
                                                if (selectedDMAs.length > 0) handleNext();
                                            }}>Confirm {selectedDMAs.length} Selected</Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6 border-t mt-4">
                                    <Button variant="outline" onClick={() => setActiveTab("notification")} className="border-gray-300 h-11 px-8 rounded-lg">Previous</Button>
                                    <Button onClick={handleNext} disabled={!isStep2Valid()} className="bg-[#123756] hover:bg-[#1a4a75] h-auto min-h-[44px] py-2 px-8 rounded-lg transition-all whitespace-normal text-center leading-tight">Proceed to Event Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Step 3: Event Details */}
                    <TabsContent value="event">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardContent className="p-6 space-y-8">
                                    {/* Dates and Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Column */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">From Date & Time <span className="text-red-500 font-bold">*</span></label>
                                                <Input type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Apology Notification Date <span className="text-red-500 font-bold">*</span></label>
                                                <Input type="datetime-local" value={apologyDate} onChange={(e) => setApologyDate(e.target.value)} className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Valve Lock <span className="text-red-500 font-bold">*</span></label>
                                                <Select value={valveLock} onValueChange={setValveLock}>
                                                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Yes">Yes</SelectItem>
                                                        <SelectItem value="No">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Type of Pipeline <span className="text-red-500 font-bold">*</span></label>
                                                <Select value={typeOfPipeline} onValueChange={setTypeOfPipeline}>
                                                    <SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Transmission">Transmission</SelectItem>
                                                        <SelectItem value="Distribution">Distribution</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Size of Pipeline <span className="text-red-500 font-bold">*</span></label>
                                                <Input placeholder="Enter size" value={sizeOfPipeline} onChange={(e) => setSizeOfPipeline(e.target.value)} className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Number of Hours of Shutdown <span className="text-red-500 font-bold">*</span></label>
                                                <Input 
                                                    type="number" 
                                                    value={hours} 
                                                    onChange={(e) => setHours(e.target.value)} 
                                                    className="h-11 border-gray-200 focus:border-[#42777c] transition-colors" 
                                                    placeholder="Enter hours" 
                                                />
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">To Date & Time <span className="text-red-500 font-bold">*</span></label>
                                                <Input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Reminder Notification Date <span className="text-red-500 font-bold">*</span></label>
                                                <Input type="datetime-local" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Notification Details <span className="text-red-500 font-bold">*</span></label>
                                                <textarea 
                                                    className="w-full min-h-[100px] rounded-lg border border-gray-200 p-3 text-sm focus:border-[#42777c] outline-none transition-colors"
                                                    placeholder="Enter details"
                                                    value={details}
                                                    onChange={(e) => setDetails(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-gray-700">Reason for Shutdown <span className="text-red-500 font-bold">*</span></label>
                                                <textarea 
                                                    className="w-full min-h-[100px] rounded-lg border border-gray-200 p-3 text-sm focus:border-[#42777c] outline-none transition-colors"
                                                    placeholder="Enter reason"
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                {/* Contractors */}
                                <div className="space-y-4 pt-4 border-t">
                                    <label className="text-sm font-bold text-[#123756] flex items-center gap-1">Contractor Name <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Enter contractor name" 
                                            value={newContractor}
                                            onChange={(e) => setNewContractor(e.target.value)}
                                            className="h-11"
                                        />
                                        <Button className="bg-[#123756] h-11 px-4" onClick={() => {
                                            if (newContractor) {
                                                setContractors([...contractors, { contractorName: newContractor }]);
                                                setNewContractor("");
                                            }
                                        }}>
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {contractors.map((c, i) => (
                                            <Badge key={i} className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1.5 flex items-center gap-2">
                                                {c.contractorName}
                                                <X className="w-3.5 h-3.5 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setContractors(contractors.filter((_, idx) => idx !== i))} />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Focal Points */}
                                {/* Focal Points */}
                                <div className="space-y-4 pt-4 border-t">
                                    <label className="text-sm font-bold text-[#123756] flex items-center gap-1">Focal Point</label>
                                    
                                     {/* Add Focal Point Inputs (Restored) */}
                                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Name</span>
                                                <Input value={newFocal.Name} onChange={(e) => setNewFocal({...newFocal, Name: e.target.value})} className="h-10 text-sm" placeholder="Enter name" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Email</span>
                                                <Input value={newFocal.Email} onChange={(e) => setNewFocal({...newFocal, Email: e.target.value})} className="h-10 text-sm" placeholder="Enter email" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Phone</span>
                                                <Input value={newFocal["Contact Number"]} onChange={(e) => setNewFocal({...newFocal, "Contact Number": e.target.value})} className="h-10 text-sm" placeholder="Enter phone" />
                                            </div>
                                            <Button className="bg-[#123756] h-10 w-fit px-6" onClick={() => {
                                                if (newFocal.Name) {
                                                    setFocalPoints([...focalPoints, newFocal]);
                                                    setNewFocal({ Name: "", Email: "", "Contact Number": "" });
                                                }
                                            }}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add
                                            </Button>
                                        </div>

                                    {focalPoints.length === 0 ? (
                                        <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-lg text-center">
                                            No focal points assigned
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                           <div className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                                <span className="font-medium text-sm">List of Focal Points ({focalPoints.length})</span>
                                           </div>
                                            {focalPoints.map((fp, index) => (
                                                <div key={index} className="flex justify-between items-start p-3 bg-white border rounded text-sm relative group">
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
                                                        <div><span className="text-gray-500 text-xs">Name:</span> {fp.Name}</div>
                                                        <div><span className="text-gray-500 text-xs">Number:</span> {fp["Contact Number"]}</div>
                                                        <div className="col-span-2"><span className="text-gray-500 text-xs">Email:</span> {fp.Email}</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            const newFp = [...focalPoints];
                                                            newFp.splice(index, 1);
                                                            setFocalPoints(newFp);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        title="Remove Focal Point"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between pt-8 border-t mt-4">
                                    <Button variant="outline" onClick={() => setActiveTab("location")} className="h-11 px-8 rounded-lg border-gray-300">Previous</Button>
                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={onBack}>Cancel</Button>
                                        <Button className="bg-[#123756] hover:bg-[#38666a] text-white h-11 px-12 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50" onClick={handleSave} disabled={loading}>
                                            {loading ? "Processing..." : isEdit ? "Update Event" : "Create Event"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
            {/* Cancellation Modal */}
            <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                <AlertDialogContent className="max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-white p-8">
                            <AlertDialogHeader className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-[#123756]" />
                                </div>
                                <AlertDialogTitle className="text-2xl font-bold text-[#123756]">Are you sure you want to cancel the event?</AlertDialogTitle>
                                <AlertDialogDescription className="sr-only">
                                    Please provide comments to confirm the event cancellation.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                            <div className="w-full space-y-2 text-left">
                                <label className="text-sm font-bold text-[#123756]">
                                    Comments<span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={cancelComments}
                                    onChange={(e) => setCancelComments(e.target.value)}
                                    className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#123756]/20 transition-all resize-none"
                                    placeholder="Enter cancellation comments..."
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <AlertDialogCancel className="flex-1 h-12 rounded-xl border-gray-200 text-[#123756] font-bold hover:bg-gray-50 m-0">
                                    No
                                </AlertDialogCancel>
                                <Button 
                                    className="flex-1 h-12 rounded-xl bg-[#42777c] hover:bg-[#38666a] text-white font-bold transition-all shadow-lg"
                                    onClick={handleCancelEvent}
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? "Cancelling..." : "Yes"}
                                </Button>
                            </div>
                        </div>
                    </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
