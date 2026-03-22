import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ReportPreview } from "@/components/ReportPreview";
import { AppendectomyReportPreview } from "@/components/AppendectomyReportPreview";
import { VentralHerniaReportPreview } from "@/components/VentralHerniaReportPreview";
import { RectalCancerReportPreview } from "@/components/RectalCancerReportPreview";
import { SmallBowelSurgeryReportPreview } from "@/components/SmallBowelSurgeryReportPreview";
import { CholecystectomyReportPreview } from "@/components/CholecystectomyReportPreview";
import { PeriAnalReportPreview } from "@/components/PeriAnalReportPreview";
import { PatientRecord, PatientSummary, TemplateType, getTemplateLabel } from "@/utils/patientRecords";

interface PatientsTabProps {
  patients: PatientSummary[];
  records: PatientRecord[];
  isLoading?: boolean;
  isSyncing?: boolean;
  pendingQueueCount?: number;
  forcedProcedureFilter?: string | null;
  onOpenRecord: (record: PatientRecord) => void;
  onStartNewEntry: (patient: PatientSummary, record?: PatientRecord | null) => void;
  onExportRecord: (record: PatientRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onRestorePatient: (patientId: string) => void;
  onPermanentDeletePatients: (patientIds: string[]) => void;
}

type DateFilter = "all" | "today" | "week" | "month" | "date";
type PatientPanelKey = "morePatientDetails" | "savedRecords" | "templatePreview";

const TEMPLATE_TYPES: TemplateType[] = [
  "procedure",
  "appendectomy",
  "ventralHernia",
  "rectalCancer",
  "smallBowel",
  "cholecystectomy",
  "periAnal",
];

const sameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const dateFromIso = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value: string) => {
  if (!value) {
    return "No date";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const day = parsed.getDate().toString().padStart(2, "0");
  const month = (parsed.getMonth() + 1).toString().padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
};

const detailText = (value: string, fallback = "-") => {
  const trimmed = String(value || "").trim();
  return trimmed || fallback;
};

const getUniqueProcedureFilters = (records: PatientRecord[]) =>
  Array.from(
    new Set(
      records
        .flatMap((record) => [
          record.templateType,
          ...(Array.isArray(record.procedureNames) ? record.procedureNames : []),
        ])
        .filter(Boolean),
    ),
  );

const getProcedureFilterLabel = (value: string) =>
  TEMPLATE_TYPES.includes(value as TemplateType)
    ? getTemplateLabel(value as TemplateType)
    : value;

const getVisiblePatientRecords = (
  records: PatientRecord[],
  patientId: string,
  showRecycleBin: boolean,
) =>
  records.filter((record) => {
    if (record.patientDocId !== patientId) {
      return false;
    }

    return showRecycleBin ? Boolean(record.deletedAt) : !record.deletedAt;
  });

const getRowTint = (index: number) => {
  const tints = [
    "border-l-4 border-l-emerald-400 bg-emerald-50/50",
    "border-l-4 border-l-sky-400 bg-sky-50/45",
    "border-l-4 border-l-amber-400 bg-amber-50/45",
  ];

  return tints[index % tints.length];
};

const SummaryValue = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <p className={`min-w-0 truncate text-sm text-gray-800 ${className}`}>
    <span className="font-semibold text-gray-700">{label}</span> {value}
  </p>
);

const formatGenderValue = (value: string) => {
  const normalized = detailText(value);
  if (normalized === "-") {
    return normalized;
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const createInitialPatientPanelState = () => ({
  morePatientDetails: false,
  savedRecords: false,
  templatePreview: false,
});

const renderRecordPreview = (record: PatientRecord | null) => {
  if (!record) {
    return <p className="text-sm text-gray-600">No saved template preview available.</p>;
  }

  const report = record.reportSnapshot || {};

  switch (record.templateType) {
    case "appendectomy":
      return <AppendectomyReportPreview report={report} />;
    case "ventralHernia":
      return <VentralHerniaReportPreview report={report} />;
    case "rectalCancer":
      return <RectalCancerReportPreview report={report} />;
    case "smallBowel":
      return <SmallBowelSurgeryReportPreview report={report} />;
    case "cholecystectomy":
      return <CholecystectomyReportPreview report={report} />;
    case "periAnal":
      return <PeriAnalReportPreview report={report} />;
    case "procedure":
    default:
      return <ReportPreview report={report} />;
  }
};

export const PatientsTab = ({
  patients,
  records,
  isLoading = false,
  isSyncing = false,
  pendingQueueCount = 0,
  forcedProcedureFilter,
  onOpenRecord,
  onStartNewEntry,
  onExportRecord,
  onDeletePatient,
  onRestorePatient,
  onPermanentDeletePatients,
}: PatientsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [procedureFilter, setProcedureFilter] = useState("");
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [expandedPatientId, setExpandedPatientId] = useState("");
  const [selectedRecycleIds, setSelectedRecycleIds] = useState<string[]>([]);
  const [expandedPatientPanels, setExpandedPatientPanels] = useState<
    Record<string, ReturnType<typeof createInitialPatientPanelState>>
  >({});
  const [previewRecordIdsByPatient, setPreviewRecordIdsByPatient] = useState<Record<string, string>>(
    {},
  );
  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

  useEffect(() => {
    if (forcedProcedureFilter) {
      setProcedureFilter(forcedProcedureFilter);
    }
  }, [forcedProcedureFilter]);

  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - 6);
    return date;
  }, [today]);
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );

  const procedureOptions = useMemo(() => getUniqueProcedureFilters(records), [records]);

  const visiblePatients = useMemo(
    () =>
      patients.filter((patient) => {
        if (showRecycleBin ? !patient.deletedAt : Boolean(patient.deletedAt)) {
          return false;
        }

        if (deferredSearchTerm && !patient.searchText.includes(deferredSearchTerm)) {
          return false;
        }

        const patientRecords = getVisiblePatientRecords(records, patient.id, showRecycleBin);

        if (procedureFilter) {
          const matchesProcedure = patientRecords.some((record) => {
            const procedureNames = Array.isArray(record.procedureNames) ? record.procedureNames : [];
            return (
              record.templateType === procedureFilter ||
              record.templateLabel === procedureFilter ||
              procedureNames.includes(procedureFilter)
            );
          });

          if (!matchesProcedure) {
            return false;
          }
        }

        if (dateFilter === "all") {
          return true;
        }

        return patientRecords.some((record) => {
          const recordDate = dateFromIso(record.recordDate || record.updatedAt);
          if (!recordDate) {
            return false;
          }

          if (dateFilter === "today") {
            return sameDay(recordDate, today);
          }

          if (dateFilter === "week") {
            return recordDate >= weekStart;
          }

          if (dateFilter === "month") {
            return recordDate >= monthStart;
          }

          if (dateFilter === "date" && selectedDate) {
            return (record.recordDate || "").slice(0, 10) === selectedDate;
          }

          return true;
        });
      }),
    [
      dateFilter,
      deferredSearchTerm,
      monthStart,
      patients,
      procedureFilter,
      records,
      selectedDate,
      showRecycleBin,
      today,
      weekStart,
    ],
  );

  useEffect(() => {
    if (expandedPatientId && !visiblePatients.some((patient) => patient.id === expandedPatientId)) {
      setExpandedPatientId("");
    }
  }, [expandedPatientId, visiblePatients]);

  useEffect(() => {
    if (!showRecycleBin) {
      setSelectedRecycleIds([]);
      return;
    }

    const visibleIdSet = new Set(visiblePatients.map((patient) => patient.id));
    setSelectedRecycleIds((previousIds) =>
      previousIds.filter((patientId) => visibleIdSet.has(patientId)),
    );
  }, [showRecycleBin, visiblePatients]);

  const deletedPatientIds = useMemo(
    () => visiblePatients.map((patient) => patient.id),
    [visiblePatients],
  );

  const toggleRecycleSelection = (patientId: string) => {
    setSelectedRecycleIds((previousIds) =>
      previousIds.includes(patientId)
        ? previousIds.filter((currentId) => currentId !== patientId)
        : [...previousIds, patientId],
    );
  };

  const togglePatientPanel = (patientId: string, section: PatientPanelKey) => {
    setExpandedPatientPanels((previousState) => {
      const currentState = previousState[patientId] || createInitialPatientPanelState();
      return {
        ...previousState,
        [patientId]: {
          ...currentState,
          [section]: !currentState[section],
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-glass-heavy">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Patients</CardTitle>
              <p className="text-sm text-gray-600">
                {showRecycleBin ? "Recycle Bin" : "Active Patients"}: {visiblePatients.length}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/60 px-3 py-1 text-gray-700">
                Total Patients: {patients.filter((patient) => !patient.deletedAt).length}
              </span>
              <span className="rounded-full bg-white/60 px-3 py-1 text-gray-700">
                Sync Queue: {pendingQueueCount}
              </span>
              <span className="rounded-full bg-white/60 px-3 py-1 text-gray-700">
                {isSyncing ? "Syncing..." : "Idle"}
              </span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr,1fr,auto]">
            <Input
              placeholder="Search Patients by Name, DOB, Procedure, Patient ID, Phone, Medical Aid, Hospital..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={procedureFilter}
              onChange={(event) => setProcedureFilter(event.target.value)}
            >
              <option value="">All Operations / Procedures</option>
              {procedureOptions.map((option) => (
                <option key={option} value={option}>
                  {getProcedureFilterLabel(option)}
                </option>
              ))}
            </select>
            <Button
              variant={showRecycleBin ? "default" : "outline"}
              onClick={() => setShowRecycleBin((value) => !value)}
            >
              {showRecycleBin ? "Back To Active" : "Recycle Bin"}
            </Button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "today", label: "Today" },
                { key: "week", label: "This Week" },
                { key: "month", label: "This Month" },
                { key: "date", label: "By Date" },
              ].map((option) => (
                <Button
                  key={option.key}
                  size="sm"
                  variant={dateFilter === option.key ? "default" : "outline"}
                  onClick={() => setDateFilter(option.key as DateFilter)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {dateFilter === "date" ? (
              <Input
                className="max-w-[14rem]"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            ) : null}
          </div>

          {showRecycleBin ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={selectedRecycleIds.length === 0}
                onClick={() => onPermanentDeletePatients(selectedRecycleIds)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected Permanently
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deletedPatientIds.length === 0}
                onClick={() => onPermanentDeletePatients(deletedPatientIds)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Empty Recycle Bin
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={deletedPatientIds.length === 0}
                onClick={() =>
                  setSelectedRecycleIds((previousIds) =>
                    previousIds.length === deletedPatientIds.length ? [] : deletedPatientIds,
                  )
                }
              >
                {selectedRecycleIds.length === deletedPatientIds.length
                  ? "Clear Selection"
                  : "Select All"}
              </Button>
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <Card className="shadow-glass-heavy">
        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <p className="text-sm text-gray-600">Loading patients...</p>
          ) : visiblePatients.length === 0 ? (
            <p className="text-sm text-gray-600">No patients matched the current filters.</p>
          ) : (
            <>
              {visiblePatients.map((patient, index) => {
                const patientRecords = getVisiblePatientRecords(records, patient.id, showRecycleBin);
                const latestRecord =
                  patientRecords.find((record) => record.id === patient.latestRecordId) ||
                  patientRecords[0] ||
                  null;
                const isExpanded = expandedPatientId === patient.id;
                const isSelectedForDelete = selectedRecycleIds.includes(patient.id);
                const activePanels =
                  expandedPatientPanels[patient.id] || createInitialPatientPanelState();
                const previewRecord =
                  patientRecords.find(
                    (record) => record.id === previewRecordIdsByPatient[patient.id],
                  ) ||
                  latestRecord;
                const operationsSummary = Array.from(
                  new Set(
                    patientRecords
                      .map(
                        (record) =>
                          detailText(record.primaryProcedureName, "") ||
                          detailText(record.templateLabel, ""),
                      )
                      .filter(Boolean),
                  ),
                ).join(", ");

                return (
                  <div
                    key={patient.id}
                    className={`rounded-2xl border border-white/50 p-4 shadow-sm transition ${getRowTint(index)}`}
                  >
                    <div
                      className="w-full text-left"
                      onClick={() =>
                        setExpandedPatientId((currentValue) =>
                          currentValue === patient.id ? "" : patient.id,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedPatientId((currentValue) =>
                            currentValue === patient.id ? "" : patient.id,
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="grid gap-x-6 gap-y-2 md:grid-cols-[1.7fr,1fr,1.4fr] md:items-center">
                                <div className="flex min-w-0 items-center gap-3">
                                  {showRecycleBin ? (
                                    <input
                                      type="checkbox"
                                      checked={isSelectedForDelete}
                                      onChange={(event) => {
                                        event.stopPropagation();
                                        toggleRecycleSelection(patient.id);
                                      }}
                                      onClick={(event) => event.stopPropagation()}
                                    />
                                  ) : null}
                                  <p className="min-w-0 truncate text-sm font-semibold text-blue-900">
                                    <span className="mr-2 text-gray-900">{index + 1}.</span>
                                    {detailText(patient.name, "Unnamed Patient")}
                                  </p>
                                </div>
                                <SummaryValue
                                  label="Age & Gender:"
                                  value={`${detailText(patient.age)} / ${formatGenderValue(patient.sex)}`}
                                />
                                <SummaryValue
                                  label="Operations:"
                                  value={detailText(
                                    operationsSummary || patient.latestTemplateLabel,
                                  )}
                                />
                              </div>

                              <div className="grid gap-x-6 gap-y-2 md:grid-cols-[1.7fr,1fr,1.4fr]">
                                <SummaryValue
                                  label="ID:"
                                  value={detailText(patient.patientId)}
                                />
                                <SummaryValue
                                  label="DOB:"
                                  value={detailText(formatDisplayDate(patient.dateOfBirth))}
                                />
                                <SummaryValue label="Hospital:" value={detailText(patient.hospitalName)} />
                              </div>

                              <div className="grid gap-x-6 gap-y-2 md:grid-cols-[1.7fr,1fr,1.4fr]">
                                <SummaryValue
                                  label="Medical Aid:"
                                  value={detailText(patient.medicalAidName)}
                                />
                                <SummaryValue
                                  label="Med. Aid No.:"
                                  value={detailText(patient.medicalAidNumber)}
                                />
                                <SummaryValue
                                  label="Main Member:"
                                  value={detailText(patient.mainMember)}
                                />
                              </div>

                              <div className="grid gap-x-6 gap-y-2 md:grid-cols-[1.7fr,1fr,1.4fr]">
                                <SummaryValue
                                  label="Work No.:"
                                  value={detailText(patient.workNumber)}
                                />
                                <SummaryValue
                                  label="Home No.:"
                                  value={detailText(patient.homeNumber)}
                                />
                                <SummaryValue
                                  label="Address:"
                                  value={detailText(patient.address)}
                                />
                              </div>
                            </div>

                            {isExpanded ? (
                              <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-gray-500" />
                            ) : (
                              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!showRecycleBin && latestRecord ? (
                            <>
                              <Button
                                size="sm"
                                variant={activePanels.savedRecords && isExpanded ? "default" : "outline"}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setExpandedPatientId(patient.id);
                                  setExpandedPatientPanels((previousState) => {
                                    const currentState =
                                      previousState[patient.id] || createInitialPatientPanelState();
                                    return {
                                      ...previousState,
                                      [patient.id]: {
                                        ...currentState,
                                        savedRecords: !(
                                          currentState.savedRecords && expandedPatientId === patient.id
                                        ),
                                      },
                                    };
                                  });
                                }}
                              >
                                Saved Records
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onOpenRecord(latestRecord);
                                }}
                              >
                                Open Template
                              </Button>
                              <Button
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onExportRecord(latestRecord);
                                }}
                              >
                                Download Full PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onDeletePatient(patient.id);
                                }}
                              >
                                Delete Patient
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onRestorePatient(patient.id);
                                }}
                              >
                                Restore
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onPermanentDeletePatients([patient.id]);
                                }}
                              >
                                Delete Permanently
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 space-y-5 border-t border-white/60 pt-4">
                        <div className="rounded-xl bg-white/70 p-4">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between text-left"
                            onClick={() => togglePatientPanel(patient.id, "morePatientDetails")}
                          >
                            <span className="text-sm font-semibold text-gray-900">
                              More Patient Details
                            </span>
                            {activePanels.morePatientDetails ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                          {activePanels.morePatientDetails ? (
                            <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
                              <div className="space-y-2 rounded-xl bg-white/70 p-4 text-sm">
                                <p className="font-semibold text-gray-900">Patient Details</p>
                                <p>Patient Name: {detailText(patient.name)}</p>
                                <p>Gender: {formatGenderValue(patient.sex)}</p>
                                <p>Age: {detailText(patient.age)}</p>
                                <p>Patient ID: {detailText(patient.patientId)}</p>
                                <p>DOB: {detailText(patient.dateOfBirth)}</p>
                                <p>Address: {detailText(patient.address)}</p>
                              </div>
                              <div className="space-y-2 rounded-xl bg-white/70 p-4 text-sm">
                                <p className="font-semibold text-gray-900">Medical Aid</p>
                                <p>Medical Aid: {detailText(patient.medicalAidName)}</p>
                                <p>Med. Aid No.: {detailText(patient.medicalAidNumber)}</p>
                                <p>Main Member: {detailText(patient.mainMember)}</p>
                                <p>Main Member ID: {detailText(patient.mainMemberId)}</p>
                                <p>Authorization: {detailText(patient.authorization)}</p>
                                <p>Depend Code: {detailText(patient.dependCode)}</p>
                              </div>
                              <div className="space-y-2 rounded-xl bg-white/70 p-4 text-sm">
                                <p className="font-semibold text-gray-900">Hospital Details</p>
                                <p>Hospital: {detailText(patient.hospitalName)}</p>
                                <p>Visit No.: {detailText(patient.hospitalVisitNumber)}</p>
                                <p>Doctor: {detailText(patient.doctorName)}</p>
                                <p>Practice No.: {detailText(patient.doctorPracticeNumber)}</p>
                                <p>Visit Date: {detailText(patient.visitDate)}</p>
                                <p>Visit Time: {detailText(patient.visitTime)}</p>
                              </div>
                              <div className="space-y-2 rounded-xl bg-white/70 p-4 text-sm">
                                <p className="font-semibold text-gray-900">Contact</p>
                                <p>Work No.: {detailText(patient.workNumber)}</p>
                                <p>Home No.: {detailText(patient.homeNumber)}</p>
                                <p>Latest Template: {detailText(patient.latestTemplateLabel)}</p>
                                <p>Latest Record Date: {detailText(formatDisplayDate(patient.latestRecordDate))}</p>
                                <p>Total Records: {patient.totalRecords}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {!showRecycleBin ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onStartNewEntry(patient, latestRecord)}
                            >
                              Add New Entry From Latest
                            </Button>
                            {latestRecord ? (
                              <Button size="sm" onClick={() => onOpenRecord(latestRecord)}>
                                Open Latest Template
                              </Button>
                            ) : null}
                          </div>
                        ) : null}

                        {activePanels.savedRecords ? (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-gray-900">Saved Records</p>
                            {patientRecords.length === 0 ? (
                              <p className="text-sm text-gray-600">No saved records for this patient.</p>
                            ) : (
                              patientRecords.map((record) => (
                                <div
                                  key={record.id}
                                  className="rounded-xl border border-white/50 bg-white/55 p-4"
                                >
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-1">
                                      <p className="font-medium text-gray-900">{record.templateLabel}</p>
                                      <p className="text-sm text-gray-600">
                                        Procedure: {detailText(record.primaryProcedureName)}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Record Date: {formatDisplayDate(record.recordDate || record.updatedAt)}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Updated: {formatDisplayDate(record.updatedAt)}
                                      </p>
                                    </div>
                                    {!showRecycleBin ? (
                                      <div className="flex flex-wrap gap-2">
                                        <Button
                                          size="sm"
                                          variant={
                                            previewRecord?.id === record.id ? "default" : "outline"
                                          }
                                          onClick={() =>
                                            setPreviewRecordIdsByPatient((previousState) => ({
                                              ...previousState,
                                              [patient.id]: record.id,
                                            }))
                                          }
                                        >
                                          Preview
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => onOpenRecord(record)}>
                                          Open Template
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => onStartNewEntry(patient, record)}
                                        >
                                          Add To Previous
                                        </Button>
                                        <Button size="sm" onClick={() => onExportRecord(record)}>
                                          Download Full PDF
                                        </Button>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        ) : null}

                        {!showRecycleBin ? (
                          <div className="rounded-xl bg-white/70 p-4">
                            <button
                              type="button"
                              className="flex w-full items-center justify-between text-left"
                              onClick={() => togglePatientPanel(patient.id, "templatePreview")}
                            >
                              <span className="text-sm font-semibold text-gray-900">
                                Template Preview
                              </span>
                              {activePanels.templatePreview ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                            {activePanels.templatePreview ? (
                              <div className="overflow-x-auto rounded-xl border border-white/60 bg-white p-4 mt-4">
                                {renderRecordPreview(previewRecord)}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
