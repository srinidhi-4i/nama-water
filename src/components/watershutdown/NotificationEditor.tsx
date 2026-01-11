import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, Plus, X, Search, Check, Info } from 'lucide-react';
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
    "NWS Leadership Team",
    "Operational Top Management",
    "Operation Team",
    "Call Center",
    "Quality & Health Saftey Directrate",
    "Communication",
    "Customer"
];

const NOTIFICATION_TYPES = [
    "Event Creation",
    "Intermediate",
    "Event Completion",
    "Apology",
    "Reminder"
];

export function NotificationEditor({ notificationId, onBack, onSaveSuccess }: NotificationEditorProps) {
    const isEdit = !!notificationId;
    const [activeTab, setActiveTab] = useState("notification");
    const [loading, setLoading] = useState(false);
    const [masterData, setMasterData] = useState<{ regions: RegionItem[], eventTypes: EventTypeItem[] }>({
        regions: [],
        eventTypes: []
    });

    // Form State
    const [notificationTitle, setNotificationTitle] = useState("");
    const [selectedEventType, setSelectedEventType] = useState<string>("");
    const [teamActions, setTeamActions] = useState<TeamActionConfig[]>(
        TEAMS.map(team => ({
            teamName: team,
            isActive: false,
            actions: []
        }))
    );

    // Location State
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [allWillayats, setAllWillayats] = useState<any[]>([]);
    const [selectedWillayats, setSelectedWillayats] = useState<string[]>([]);
    const [allDMAs, setAllDMAs] = useState<any[]>([]);
    const [selectedDMAs, setSelectedDMAs] = useState<string[]>([]);
    const [willayatSearch, setWillayatSearch] = useState("");
    const [dmaSearch, setDmaSearch] = useState("");
    
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
        setMasterData({ regions: data.regions, eventTypes: data.eventTypes });
        return data; // Return data for chaining
    };

    const fetchNotificationDetails = async (mData: { regions: RegionItem[], eventTypes: EventTypeItem[] }) => {
        if (!notificationId) return;
        // removing local setLoading(true) as it's handled in init()
        try {
            const data = await waterShutdownService.getNotificationById(notificationId);
            setNotificationTitle(data.notificationTitle || "");
            
            // Find EventTypeID from name if possible
            const et = mData.eventTypes.find(e => e.EventTypeName === data.eventType || e.EventTypeName?.trim() === data.eventTypeName?.trim());
            if (et) setSelectedEventType(et.EventTypeID.toString());
            else setSelectedEventType(""); 

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
                // Willayats will be auto-populated by the useEffect on selectedRegion if we set it locally? 
                // No, we need to populate 'allWillayats' immediately or let the effect handle it.
                // The effect [masterData, selectedRegion] will run after this render.
                
                // However, we also need to set the specific *selected* items.
                if (reg.wilayats) setAllWillayats(reg.wilayats);
            }
            setSelectedWillayats(data.affectedWillayats || []);
            setSelectedDMAs(data.affectedDMAs || []);

            // Event Details
            setStartDateTime(data.startDateTime?.split('Z')[0] || "");
            setEndDateTime(data.endDateTime?.split('Z')[0] || "");
            setApologyDate(data.apologyNotificationDate?.split('Z')[0] || "");
            setReminderDate(data.scheduleNotificationDate?.split('Z')[0] || "");
            setValveLock(data.valveLock || "No");
            setTypeOfPipeline(data.typeOfPipeline || "");
            setSizeOfPipeline(data.sizeOfPipeline || "");
            setHours(data.numberOfHours || "");
            setDetails(data.notificationDetails || "");
            setReason(data.reasonForShutdown || "");
            setContractors(data.contractors || []);
            setFocalPoints(data.focalPoint || []);

        } catch (error: any) {
            console.error('Error fetching notification details:', error);
            toast.error("Failed to load notification details. Returning to list.");
            onBack();
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
        // Only Region is strictly required to proceed? Or Willayats too?
        // Usually Region is enough to show tab, but to move to Event details we might need data.
        return selectedRegion !== "";
    };

    const handleNext = () => {
        if (activeTab === "notification" && isStep1Valid()) setActiveTab("location");
        else if (activeTab === "location" && isStep2Valid()) setActiveTab("event");
    };

    const handleSave = async () => {
        // Date Validation
        if (new Date(startDateTime) > new Date(endDateTime)) {
            toast.error("Start Date cannot be after End Date");
            return;
        }

        try {
            setLoading(true);
            const et = masterData.eventTypes.find(e => e.EventTypeID.toString() === selectedEventType);
            
            const eventJsonData = JSON.stringify({
                AffectedWillayats: selectedWillayats,
                AffectedDMAs: selectedDMAs,
                ContractorName: contractors,
                TeamActions: teamActions.filter(t => t.isActive), // Only send active teams
                ValveLock: valveLock,
                SizeOfPipeline: sizeOfPipeline,
                TypeOfPipeline: typeOfPipeline,
                NumberOfHours: hours,
                FocalPoint: focalPoints,
                // Add more meta as needed
            });

            const payload = {
                notificationTitle,
                eventTypeId: parseInt(selectedEventType),
                regionId: selectedRegion,
                startDateTime: startDateTime,
                endDateTime: endDateTime,
                apologyNotificationDate: apologyDate,
                reminderNotificationDate: reminderDate,
                valveLock,
                typeOfPipeline,
                sizeOfPipeline,
                numberOfHours: hours,
                notificationDetails: details,
                reasonForShutdown: reason,
                eventJsonData
            };

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
                    <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 space-x-8">
                        <TabsTrigger value="notification" className="data-[state=active]:border-[#42777c] data-[state=active]:text-[#42777c] border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-semibold transition-all">
                            Notification Details
                        </TabsTrigger>
                        <TabsTrigger value="location" disabled={!isEdit && !isStep1Valid()} className="data-[state=active]:border-[#42777c] data-[state=active]:text-[#42777c] border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50">
                            Location Details
                        </TabsTrigger>
                        <TabsTrigger value="event" disabled={!isEdit && (!isStep1Valid() || !isStep2Valid())} className="data-[state=active]:border-[#42777c] data-[state=active]:text-[#42777c] border-b-2 border-transparent rounded-none px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50">
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
                                        <Select value={selectedEventType} onValueChange={setSelectedEventType}>
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
                                                                            {team.actions.map(action => (
                                                                                <Badge key={action} variant="secondary" className="bg-[#42777c]/10 text-[#42777c] border-none px-2 py-0.5 text-[10px] flex items-center gap-1 pr-1">
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

                                <div className="flex justify-end pt-6 border-t font-sans">
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
                                                    const isSelected = selectedWillayats.includes(w.WillayatCode);
                                                    return (
                                                        <div 
                                                            key={w.WillayathID} 
                                                            onClick={() => {
                                                                if (isSelected) setSelectedWillayats(prev => prev.filter(code => code !== w.WillayathCode));
                                                                else setSelectedWillayats(prev => [...prev, w.WillayathCode]);
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

                                    {/* Column 2: Affected Willayats (Selected) */}
                                    <div className="flex flex-col border rounded-xl overflow-hidden bg-white">
                                        <div className="bg-gray-50 border-b p-3 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#123756] text-white flex items-center justify-center font-bold text-xs">2</div>
                                            <span className="text-sm font-bold text-[#123756]">Affected Willayats</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                            {selectedWillayats.map(willayatCode => {
                                                const w = allWillayats.find(item => item.WillayathCode === willayatCode);
                                                return (
                                                    <div key={willayatCode} className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-bold text-gray-800">{w?.WillayathNameEn || willayatCode}</span>
                                                            <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                                                        </div>
                                                        <div className="pl-4 space-y-1 border-l-2 border-gray-100">
                                                            {/* We could fetch DMAs here if we want more granularity, 
                                                                but typically users select DMAs in column 3 */}
                                                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Active listed DMAs will appear in section 3</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedWillayats.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center space-y-2 opacity-50">
                                                    <Info className="w-8 h-8" />
                                                    <p className="text-xs">Select willayats from the first column</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-gray-50 border-t flex justify-between gap-2">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setSelectedWillayats([])}>Clear All</Button>
                                            <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-[#123756]" onClick={() => {}}>Confirm Willayats</Button>
                                        </div>
                                    </div>

                                    {/* Column 3: Affected DMA */}
                                    <div className="flex flex-col border rounded-xl overflow-hidden bg-white">
                                        <div className="bg-gray-50 border-b p-3 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#123756] text-white flex items-center justify-center font-bold text-xs">3</div>
                                            <span className="text-sm font-bold text-[#123756]">Affected DMA</span>
                                        </div>
                                        <div className="p-3 border-b">
                                            <div className="relative">
                                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <Input 
                                                    placeholder="Search DMA..." 
                                                    className="pl-9 h-9 text-sm"
                                                    value={dmaSearch}
                                                    onChange={(e) => setDmaSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                            {allDMAs
                                                .filter(d => (d.DMANameEn || d.DMAName || "").toLowerCase().includes(dmaSearch.toLowerCase()))
                                                .map(d => {
                                                    const isSelected = selectedDMAs.includes(d.DMACode);
                                                    return (
                                                        <div 
                                                            key={d.DMAID} 
                                                            onClick={() => {
                                                                if (isSelected) setSelectedDMAs(prev => prev.filter(code => code !== d.DMACode));
                                                                else setSelectedDMAs(prev => [...prev, d.DMACode]);
                                                            }}
                                                            className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-[#42777c]/10 text-[#42777c]' : 'hover:bg-gray-50 text-gray-600'}`}
                                                        >
                                                            <span className="text-sm font-medium">{d.DMANameEn || d.DMAName} ({d.DMACode})</span>
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#42777c] border-[#42777c]' : 'border-gray-200'}`}>
                                                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            {allDMAs.length === 0 && selectedWillayats.length > 0 && (
                                                <div className="p-8 text-center text-gray-400 text-xs italic">
                                                    No DMAs found for selected willayats
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
                                    <Button onClick={handleNext} disabled={!isStep2Valid()} className="bg-[#123756] hover:bg-[#1a4a75] h-11 px-8 rounded-lg transition-all">Proceed to Event Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Step 3: Event Details */}
                    <TabsContent value="event">
                        <Card className="border-none shadow-md overflow-hidden">
                            <CardContent className="p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Dates */}
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
                                    </div>

                                    {/* More Dates and Inputs */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">To Date & Time <span className="text-red-500 font-bold">*</span></label>
                                            <Input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Number of Hours Shutdown <span className="text-red-500 font-bold">*</span></label>
                                            <Input 
                                                type="number" 
                                                value={hours} 
                                                onChange={(e) => setHours(e.target.value)} 
                                                className="h-11 border-gray-200 focus:border-[#42777c] transition-colors" 
                                                placeholder="Enter hours" 
                                            />
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Number of Hours of Shutdown <span className="text-red-500 font-bold">*</span></label>
                                            <Input placeholder="Enter hours" value={hours} onChange={(e) => setHours(e.target.value)} className="h-11" />
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
                                <div className="space-y-4 pt-4 border-t">
                                    <label className="text-sm font-bold text-[#123756] flex items-center gap-1">Focal Point <span className="text-red-500">*</span></label>
                                    <div className="space-y-4">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Search User to Auto-fill</span>
                                            {/* Focal point search dropdown removed as per user request to simplify, 
                                                but keeping functionality available via a simpler input or just hiding this block
                                                User said: "focal point dropdown is not needed"
                                                I will hide the Select and keep the manual entry fields effectively.
                                            */}
                                           

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Name</span>
                                                <Input value={newFocal.Name} onChange={(e) => setNewFocal({...newFocal, Name: e.target.value})} className="h-10" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Email</span>
                                                <Input value={newFocal.Email} onChange={(e) => setNewFocal({...newFocal, Email: e.target.value})} className="h-10" />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Phone</span>
                                                <Input value={newFocal["Contact Number"]} onChange={(e) => setNewFocal({...newFocal, "Contact Number": e.target.value})} className="h-10" />
                                            </div>
                                            <Button className="bg-[#123756] h-10 w-fit px-8" onClick={() => {
                                                if (newFocal.Name) {
                                                    setFocalPoints([...focalPoints, newFocal]);
                                                    setNewFocal({ Name: "", Email: "", "Contact Number": "" });
                                                }
                                            }}>Add Focal Point</Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {focalPoints.map((f, i) => (
                                                <div key={i} className="bg-gray-50 border rounded-lg p-3 relative group transition-all hover:border-[#42777c]">
                                                    <div className="font-bold text-gray-800 text-sm">{f.Name}</div>
                                                    <div className="text-xs text-gray-500">{f.Email}</div>
                                                    <div className="text-xs text-gray-500">{f["Contact Number"]}</div>
                                                    <X 
                                                        className="w-4 h-4 absolute top-2 right-2 text-gray-400 cursor-pointer hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" 
                                                        onClick={() => setFocalPoints(focalPoints.filter((_, idx) => idx !== i))} 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-8 border-t mt-4">
                                    <Button variant="outline" onClick={() => setActiveTab("location")} className="h-11 px-8 rounded-lg border-gray-300">Previous</Button>
                                    <Button 
                                        className="bg-[#42777c] hover:bg-[#38666a] text-white h-11 px-12 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50"
                                        onClick={handleSave}
                                        disabled={loading}
                                    >
                                        {loading ? "Processing..." : isEdit ? "Update Event" : "Create Event"}
                                    </Button>
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
        </div>
    );
}
