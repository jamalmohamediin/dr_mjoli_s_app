import { useDeferredValue, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
}

type DateFilter = "all" | "today" | "week" | "month" | "date";

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

const getUniqueProcedureFilters = (records: PatientRecord[]) =>
  Array.from(
    new Set(
      records.flatMap((record) => [record.templateType, ...record.procedureNames]).filter(Boolean),
    ),
  );

const getProcedureFilterLabel = (value: string) =>
  [
    "procedure",
    "appendectomy",
    "ventralHernia",
    "rectalCancer",
    "smallBowel",
    "cholecystectomy",
    "periAnal",
  ].includes(value)
    ? getTemplateLabel(value as TemplateType)
    : value;

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
}: PatientsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [procedureFilter, setProcedureFilter] = useState("");
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());

  useEffect(() => {
    if (forcedProcedureFilter) {
      setProcedureFilter(forcedProcedureFilter);
    }
  }, [forcedProcedureFilter]);

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      const firstPatient = patients.find((patient) =>
        showRecycleBin ? Boolean(patient.deletedAt) : !patient.deletedAt,
      );
      if (firstPatient) {
        setSelectedPatientId(firstPatient.id);
      }
    }

    if (
      selectedPatientId &&
      !patients.some((patient) => patient.id === selectedPatientId)
    ) {
      setSelectedPatientId("");
    }
  }, [patients, selectedPatientId, showRecycleBin]);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const visiblePatients = patients.filter((patient) => {
    if (showRecycleBin ? !patient.deletedAt : Boolean(patient.deletedAt)) {
      return false;
    }

    if (deferredSearchTerm && !patient.searchText.includes(deferredSearchTerm)) {
      return false;
    }

    const patientRecords = records.filter(
      (record) =>
        record.patientDocId === patient.id &&
        (showRecycleBin ? Boolean(record.deletedAt) : !record.deletedAt),
    );

    if (procedureFilter) {
      const matchesProcedure = patientRecords.some(
        (record) =>
          record.templateType === procedureFilter ||
          record.procedureNames.includes(procedureFilter) ||
          record.templateLabel === procedureFilter,
      );

      if (!matchesProcedure) {
        return false;
      }
    }

    if (dateFilter === "all") {
      return true;
    }

    const relevantRecords = patientRecords.filter((record) => {
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
        return record.recordDate === selectedDate;
      }

      return true;
    });

    return relevantRecords.length > 0;
  });

  const selectedPatient =
    visiblePatients.find((patient) => patient.id === selectedPatientId) || visiblePatients[0] || null;
  const selectedPatientRecords = selectedPatient
    ? records.filter((record) => record.patientDocId === selectedPatient.id)
    : [];
  const visibleSelectedRecords = selectedPatientRecords.filter((record) =>
    showRecycleBin ? Boolean(record.deletedAt) : !record.deletedAt,
  );
  const latestSelectedRecord = visibleSelectedRecords[0] || null;
  const procedureOptions = getUniqueProcedureFilters(records);

  return (
    <div className="space-y-6">
      <Card className="shadow-glass-heavy">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Patients</CardTitle>
              <p className="text-sm text-gray-600">
                {showRecycleBin ? "Recycle Bin" : "All Patients"}: {visiblePatients.length}
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
              placeholder="Search by name, DOB, procedure, phone, medical aid, hospital, doctor..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={procedureFilter}
              onChange={(event) => setProcedureFilter(event.target.value)}
            >
              <option value="">All Procedures</option>
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
            {dateFilter === "date" && (
              <Input
                className="max-w-[14rem]"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
        <Card className="shadow-glass-heavy">
          <CardHeader>
            <CardTitle className="text-base">Patient List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-gray-600">Loading patients...</p>
            ) : visiblePatients.length === 0 ? (
              <p className="text-sm text-gray-600">
                No patients matched the current filters.
              </p>
            ) : (
              visiblePatients.map((patient) => {
                const latestRecord = records.find(
                  (record) =>
                    record.id === patient.latestRecordId &&
                    (showRecycleBin ? Boolean(record.deletedAt) : !record.deletedAt),
                );

                return (
                  <div
                    key={patient.id}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedPatient?.id === patient.id
                        ? "border-gray-900 bg-white/80 shadow"
                        : "border-white/50 bg-white/50 hover:bg-white/70"
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedPatientId(patient.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">
                          {patient.name || "Unnamed Patient"}
                        </p>
                        <p className="text-sm text-gray-600">
                          ID: {patient.patientId || "N/A"} | DOB:{" "}
                          {patient.dateOfBirth || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Latest: {patient.latestTemplateLabel} |{" "}
                          {formatDisplayDate(patient.latestRecordDate || patient.updatedAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Records: {patient.totalRecords} | Medical Aid:{" "}
                          {patient.medicalAidName || "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {latestRecord && !showRecycleBin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                onOpenRecord(latestRecord);
                              }}
                            >
                              Open Form
                            </Button>
                            <Button
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                onExportRecord(latestRecord);
                              }}
                            >
                              Download PDF
                            </Button>
                          </>
                        )}
                        {showRecycleBin ? (
                          <Button
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              onRestorePatient(patient.id);
                            }}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeletePatient(patient.id);
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-glass-heavy">
          <CardHeader>
            <CardTitle className="text-base">Patient Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPatient ? (
              <p className="text-sm text-gray-600">Select a patient to view the saved records.</p>
            ) : (
              <>
                <div className="rounded-xl bg-white/60 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedPatient.name || "Unnamed Patient"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.patientId || "N/A"} | {selectedPatient.sex || "N/A"} |{" "}
                        {selectedPatient.age || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.hospitalName || "No hospital"} |{" "}
                        {selectedPatient.doctorName || "No doctor"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedPatient.workNumber || selectedPatient.homeNumber || "No phone"} |{" "}
                        {selectedPatient.medicalAidName || "No medical aid"}
                      </p>
                    </div>
                    {!showRecycleBin && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStartNewEntry(selectedPatient, latestSelectedRecord)}
                        >
                          Add New Entry
                        </Button>
                        {latestSelectedRecord && (
                          <Button size="sm" onClick={() => onExportRecord(latestSelectedRecord)}>
                            Download Latest PDF
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Saved Records</p>
                  {visibleSelectedRecords.length === 0 ? (
                    <p className="text-sm text-gray-600">No saved records for this patient yet.</p>
                  ) : (
                    visibleSelectedRecords.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-xl border border-white/50 bg-white/50 p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{record.templateLabel}</p>
                            <p className="text-sm text-gray-600">
                              Procedure: {record.primaryProcedureName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Record Date: {formatDisplayDate(record.recordDate || record.updatedAt)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Updated: {formatDisplayDate(record.updatedAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!showRecycleBin && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => onOpenRecord(record)}>
                                  Edit Saved
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onStartNewEntry(selectedPatient, record)}
                                >
                                  Add To Previous
                                </Button>
                                <Button size="sm" onClick={() => onExportRecord(record)}>
                                  Download PDF
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
