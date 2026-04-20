import {
  createInitialPatientInfoState,
  createPatientStickerSyncSnapshot,
} from "@/utils/patientSticker";

export type TemplateType =
  | "procedure"
  | "gastroscopy"
  | "colonoscopy"
  | "appendectomy"
  | "ventralHernia"
  | "rectalCancer"
  | "smallBowel"
  | "cholecystectomy"
  | "periAnal"
  | "inguinalHernia"
  | "transanalMinimallyInvasiveSurgery"
  | "openGeneralSurgery"
  | "openAbdominalSurgery";

export interface PatientRecord {
  id: string;
  patientDocId: string;
  templateType: TemplateType;
  templateLabel: string;
  currentTab: string;
  patientInfo: any;
  procedureNames: string[];
  primaryProcedureName: string;
  operationDescription: string;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  searchText: string;
  reportSnapshot: any;
}

export interface PatientAttachment {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  mimeType: string;
  kind: "image" | "video" | "document";
  sizeBytes: number;
  uploadedAt: string;
  source?: "firebase" | "local";
}

export interface PatientSummary {
  id: string;
  name: string;
  patientId: string;
  sex: string;
  age: string;
  dateOfBirth: string;
  address: string;
  medicalAidName: string;
  medicalAidNumber: string;
  mainMember: string;
  mainMemberId: string;
  authorization: string;
  workNumber: string;
  homeNumber: string;
  dependCode: string;
  hospitalName: string;
  hospitalVisitNumber: string;
  doctorName: string;
  doctorPracticeNumber: string;
  visitDate: string;
  visitTime: string;
  latestTemplateType: TemplateType;
  latestTemplateLabel: string;
  latestRecordId: string;
  latestRecordDate: string;
  totalRecords: number;
  procedureCounts: Record<string, number>;
  attachments: PatientAttachment[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  searchText: string;
}

export interface PatientDatabaseCache {
  patients: PatientSummary[];
  records: PatientRecord[];
}

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  procedure: "Endoscopy",
  gastroscopy: "Gastroscopy",
  colonoscopy: "Colonoscopy",
  appendectomy: "Appendicectomy",
  ventralHernia: "Ventral Hernia Repair",
  rectalCancer: "Colorectal Resection",
  smallBowel: "Small Bowel Surgery",
  cholecystectomy: "Cholecystectomy",
  periAnal: "Peri-Anal",
  inguinalHernia: "Inguinal Hernia Repair",
  transanalMinimallyInvasiveSurgery: "Transanal Minimally Invasive Surgery",
  openGeneralSurgery: "Open General Surgery - Narrative",
  openAbdominalSurgery: "Open Abdominal Surgery - Narrative",
};

const TEMPLATE_TAB_MAP: Record<TemplateType, string> = {
  procedure: "procedure",
  gastroscopy: "gastroscopy",
  colonoscopy: "colonoscopy",
  appendectomy: "appendectomy",
  ventralHernia: "hernia",
  rectalCancer: "rectal",
  smallBowel: "smallBowel",
  cholecystectomy: "cholecystectomy",
  periAnal: "periAnal",
  inguinalHernia: "inguinalHernia",
  transanalMinimallyInvasiveSurgery: "transanalMinimallyInvasiveSurgery",
  openGeneralSurgery: "openGeneralSurgery",
  openAbdominalSurgery: "openAbdominalSurgery",
};

const TAB_TEMPLATE_MAP: Record<string, TemplateType> = {
  procedure: "procedure",
  gastroscopy: "gastroscopy",
  colonoscopy: "colonoscopy",
  appendectomy: "appendectomy",
  hernia: "ventralHernia",
  ventralHernia: "ventralHernia",
  rectal: "rectalCancer",
  rectalCancer: "rectalCancer",
  smallBowel: "smallBowel",
  cholecystectomy: "cholecystectomy",
  periAnal: "periAnal",
  inguinalHernia: "inguinalHernia",
  transanalMinimallyInvasiveSurgery: "transanalMinimallyInvasiveSurgery",
  openGeneralSurgery: "openGeneralSurgery",
  openAbdominalSurgery: "openAbdominalSurgery",
};

const PATIENT_IDENTITY_FIELDS = [
  "name",
  "patientId",
  "sex",
  "age",
  "dateOfBirth",
  "address",
  "medicalAidName",
  "medicalAidNumber",
  "mainMember",
  "mainMemberId",
  "authorization",
  "workNumber",
  "homeNumber",
  "dependCode",
  "hospitalName",
  "hospitalVisitNumber",
  "doctorName",
  "doctorPracticeNumber",
  "visitDate",
  "visitTime",
] as const;

const text = (value: any) => String(value || "").trim();

const normalizeIdentityDate = (value: string) => {
  const raw = text(value);
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toISOString().slice(0, 10);
};

const buildSearchText = (values: any[]) =>
  values
    .flatMap((value) =>
      Array.isArray(value) ? value.map((entry) => text(entry)) : [text(value)],
    )
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const toIsoDate = (value: string, fallbackIso: string) => {
  const raw = text(value);
  if (!raw) {
    return fallbackIso.slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return fallbackIso.slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const createEmptyPatientDatabaseCache = (): PatientDatabaseCache => ({
  patients: [],
  records: [],
});

export const getTemplateTypeFromTab = (currentTab: string): TemplateType =>
  TAB_TEMPLATE_MAP[currentTab] || "procedure";

export const getCurrentTabForTemplate = (templateType: TemplateType) =>
  TEMPLATE_TAB_MAP[templateType] || "procedure";

export const getTemplateLabel = (templateType: TemplateType) =>
  TEMPLATE_LABELS[templateType] || TEMPLATE_LABELS.procedure;

export const getTemplatePatientInfo = (reportSnapshot: any, templateType: TemplateType) => {
  switch (templateType) {
    case "gastroscopy":
      return reportSnapshot?.gastroscopy?.patientInfo || {};
    case "colonoscopy":
      return reportSnapshot?.colonoscopy?.patientInfo || {};
    case "appendectomy":
      return reportSnapshot?.appendectomy?.patientInfo || {};
    case "ventralHernia":
      return reportSnapshot?.ventralHernia?.patientInfo || {};
    case "rectalCancer":
      return reportSnapshot?.rectalCancer?.patientInfo || {};
    case "smallBowel":
      return reportSnapshot?.smallBowel?.patientInfo || {};
    case "cholecystectomy":
      return reportSnapshot?.cholecystectomy?.patientInfo || {};
    case "periAnal":
      return reportSnapshot?.periAnal?.patientInfo || {};
    case "inguinalHernia":
      return reportSnapshot?.inguinalHernia?.patientInfo || {};
    case "transanalMinimallyInvasiveSurgery":
      return reportSnapshot?.transanalMinimallyInvasiveSurgery?.patientInfo || {};
    case "openGeneralSurgery":
      return reportSnapshot?.openGeneralSurgery?.patientInfo || {};
    case "openAbdominalSurgery":
      return reportSnapshot?.openAbdominalSurgery?.patientInfo || {};
    case "procedure":
    default:
      return reportSnapshot?.patientInfo || {};
  }
};

const getTemplateOperationDescription = (reportSnapshot: any, templateType: TemplateType) => {
  switch (templateType) {
    case "gastroscopy":
      return text(reportSnapshot?.gastroscopy?.additionalInfo?.conclusion);
    case "colonoscopy":
      return text(reportSnapshot?.colonoscopy?.additionalInfo?.conclusion);
    case "appendectomy":
      return text(reportSnapshot?.appendectomy?.procedure?.operationDescription);
    case "ventralHernia":
      return text(reportSnapshot?.ventralHernia?.procedure?.operationDescription);
    case "rectalCancer":
      return (
        text(reportSnapshot?.rectalCancer?.procedureDetails?.additionalNotes) ||
        text(reportSnapshot?.rectalCancer?.procedureFindings?.additionalNotes)
      );
    case "smallBowel":
      return text(reportSnapshot?.smallBowel?.procedure?.operationDescription);
    case "cholecystectomy":
      return text(reportSnapshot?.cholecystectomy?.procedure?.operationDescription);
    case "periAnal":
      return (
        text(reportSnapshot?.periAnal?.preoperative?.operationDescription) ||
        text(reportSnapshot?.periAnal?.procedureFindings?.additionalNotes)
      );
    case "inguinalHernia":
      return text(reportSnapshot?.inguinalHernia?.procedure?.description);
    case "transanalMinimallyInvasiveSurgery":
      return text(reportSnapshot?.transanalMinimallyInvasiveSurgery?.operativeFindings?.findings);
    case "openGeneralSurgery":
      return text(reportSnapshot?.openGeneralSurgery?.narrative?.operationDone);
    case "openAbdominalSurgery":
      return text(reportSnapshot?.openAbdominalSurgery?.narrative?.operationDone);
    case "procedure":
    default:
      return (reportSnapshot?.selectedProcedures || []).join(", ");
  }
};

export const getTemplateProcedureNames = (reportSnapshot: any, templateType: TemplateType) => {
  if (templateType === "procedure") {
    const procedures = Array.isArray(reportSnapshot?.selectedProcedures)
      ? reportSnapshot.selectedProcedures.map((value: any) => text(value)).filter(Boolean)
      : [];

    return procedures.length > 0 ? procedures : [getTemplateLabel(templateType)];
  }

  return [getTemplateLabel(templateType)];
};

export const getTemplateRecordDate = (
  reportSnapshot: any,
  templateType: TemplateType,
  fallbackIso: string,
) => {
  const patientInfo = createInitialPatientInfoState(
    getTemplatePatientInfo(reportSnapshot, templateType),
  );
  return toIsoDate(patientInfo.visitDate, fallbackIso);
};

const sortRecords = (records: PatientRecord[]) =>
  [...records].sort((left, right) =>
    (right.updatedAt || "").localeCompare(left.updatedAt || ""),
  );

const sortPatients = (patients: PatientSummary[]) =>
  [...patients].sort((left, right) =>
    (right.updatedAt || "").localeCompare(left.updatedAt || ""),
  );

const parseIsoTimestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortPatientsForMerge = (patients: PatientSummary[]) =>
  [...patients].sort((left, right) => {
    const deletedStateDiff = Number(Boolean(left.deletedAt)) - Number(Boolean(right.deletedAt));
    if (deletedStateDiff !== 0) {
      return deletedStateDiff;
    }

    const updatedAtDiff = parseIsoTimestamp(right.updatedAt) - parseIsoTimestamp(left.updatedAt);
    if (updatedAtDiff !== 0) {
      return updatedAtDiff;
    }

    return text(left.id).localeCompare(text(right.id));
  });

const isSamePatientIdentity = (left: PatientSummary, right: PatientSummary) => {
  const leftName = text(left.name).toLowerCase();
  const rightName = text(right.name).toLowerCase();
  const leftPatientId = text(left.patientId).toLowerCase();
  const rightPatientId = text(right.patientId).toLowerCase();
  const leftDob = normalizeIdentityDate(left.dateOfBirth);
  const rightDob = normalizeIdentityDate(right.dateOfBirth);

  if (leftPatientId && rightPatientId && leftPatientId === rightPatientId) {
    if (!leftDob || !rightDob || leftDob === rightDob) {
      return true;
    }
  }

  if (leftName && rightName && leftName === rightName) {
    if (leftDob && rightDob && leftDob === rightDob) {
      return true;
    }

    if (leftPatientId && rightPatientId && leftPatientId === rightPatientId) {
      return true;
    }
  }

  return false;
};

const mergePatientSummaries = (
  candidates: PatientSummary[],
  canonicalPatientId: string,
): PatientSummary | null => {
  if (candidates.length === 0) {
    return null;
  }

  const sortedCandidates = sortPatientsForMerge(candidates);
  const primary = sortedCandidates[0];
  const attachmentMap = new Map<string, PatientAttachment>();

  sortedCandidates.forEach((candidate) => {
    (Array.isArray(candidate.attachments) ? candidate.attachments : []).forEach((attachment) => {
      attachmentMap.set(attachment.id, attachment);
    });
  });

  const hasActiveCandidate = sortedCandidates.some((candidate) => !candidate.deletedAt);
  const earliestCreatedAt = sortedCandidates.reduce((earliest, candidate) => {
    const candidateTimestamp = parseIsoTimestamp(candidate.createdAt);
    if (!candidateTimestamp) {
      return earliest;
    }
    if (!earliest) {
      return candidate.createdAt;
    }
    return candidateTimestamp < parseIsoTimestamp(earliest) ? candidate.createdAt : earliest;
  }, "");

  const latestUpdatedAt = sortedCandidates.reduce((latest, candidate) => {
    const candidateTimestamp = parseIsoTimestamp(candidate.updatedAt);
    if (!candidateTimestamp) {
      return latest;
    }
    if (!latest) {
      return candidate.updatedAt;
    }
    return candidateTimestamp > parseIsoTimestamp(latest) ? candidate.updatedAt : latest;
  }, "");

  return {
    ...primary,
    id: canonicalPatientId,
    attachments: Array.from(attachmentMap.values()).sort((left, right) =>
      (right.uploadedAt || "").localeCompare(left.uploadedAt || ""),
    ),
    createdAt: earliestCreatedAt || primary.createdAt || new Date().toISOString(),
    updatedAt: latestUpdatedAt || primary.updatedAt || new Date().toISOString(),
    deletedAt: hasActiveCandidate ? null : primary.deletedAt || null,
  };
};

const dedupeRecordsById = (records: PatientRecord[]) => {
  const latestRecordsById = new Map<string, PatientRecord>();

  records.forEach((record) => {
    const existingRecord = latestRecordsById.get(record.id);
    if (!existingRecord) {
      latestRecordsById.set(record.id, record);
      return;
    }

    if ((record.updatedAt || "").localeCompare(existingRecord.updatedAt || "") > 0) {
      latestRecordsById.set(record.id, record);
    }
  });

  return sortRecords(Array.from(latestRecordsById.values()));
};

const sanitizeId = (value: unknown) => text(value);

const getPatientIdentityKeyFromInfo = (patientInfo: any) => {
  const info = createPatientStickerSyncSnapshot(patientInfo);
  const normalizedName = text(info.name).toLowerCase();
  const normalizedPatientId = text(info.patientId).toLowerCase();
  const normalizedDob = normalizeIdentityDate(info.dateOfBirth);

  if (normalizedPatientId && normalizedDob) {
    return `patientId+dob:${normalizedPatientId}|${normalizedDob}`;
  }

  if (normalizedName && normalizedDob) {
    return `name+dob:${normalizedName}|${normalizedDob}`;
  }

  if (normalizedPatientId && normalizedName) {
    return `patientId+name:${normalizedPatientId}|${normalizedName}`;
  }

  if (normalizedPatientId) {
    return `patientId:${normalizedPatientId}`;
  }

  if (normalizedName) {
    return `name:${normalizedName}`;
  }

  return "";
};

const getPatientSummarySearchText = (summary: PatientSummary, records: PatientRecord[]) =>
  buildSearchText([
    ...PATIENT_IDENTITY_FIELDS.map((field) => summary[field]),
    summary.latestTemplateLabel,
    records.flatMap((record) => [
      record.templateLabel,
      record.primaryProcedureName,
      record.operationDescription,
      Array.isArray(record.procedureNames) ? record.procedureNames : [],
    ]),
  ]);

export const findMatchingPatientId = (patients: PatientSummary[], patientInfo: any) => {
  const info = createPatientStickerSyncSnapshot(patientInfo);
  const normalizedName = text(info.name).toLowerCase();
  const normalizedDob = normalizeIdentityDate(info.dateOfBirth);
  const normalizedPatientId = text(info.patientId).toLowerCase();

  const byNameAndIdAndDob =
    normalizedName && normalizedPatientId && normalizedDob
      ? patients.find(
          (patient) =>
            !patient.deletedAt &&
            text(patient.name).toLowerCase() === normalizedName &&
            text(patient.patientId).toLowerCase() === normalizedPatientId &&
            normalizeIdentityDate(patient.dateOfBirth) === normalizedDob,
        )
      : null;

  if (byNameAndIdAndDob) {
    return byNameAndIdAndDob.id;
  }

  const byPatientIdAndDob =
    normalizedPatientId && normalizedDob
      ? patients.find(
          (patient) =>
            !patient.deletedAt &&
            text(patient.patientId).toLowerCase() === normalizedPatientId &&
            normalizeIdentityDate(patient.dateOfBirth) === normalizedDob,
        )
      : null;

  if (byPatientIdAndDob) {
    return byPatientIdAndDob.id;
  }

  const byNameAndDob =
    normalizedName && normalizedDob
      ? patients.find(
          (patient) =>
            !patient.deletedAt &&
            text(patient.name).toLowerCase() === normalizedName &&
            normalizeIdentityDate(patient.dateOfBirth) === normalizedDob,
        )
      : null;

  if (byNameAndDob) {
    return byNameAndDob.id;
  }

  const byPatientId = normalizedPatientId
    ? patients.find(
        (patient) =>
          !patient.deletedAt &&
          text(patient.patientId).toLowerCase() === normalizedPatientId,
      )
    : null;

  if (byPatientId) {
    return byPatientId.id;
  }

  const byNameAndPatientId =
    normalizedName && normalizedPatientId
      ? patients.find(
          (patient) =>
            !patient.deletedAt &&
            text(patient.name).toLowerCase() === normalizedName &&
            text(patient.patientId).toLowerCase() === normalizedPatientId,
        )
      : null;

  if (byNameAndPatientId) {
    return byNameAndPatientId.id;
  }

  const byUniqueNameOnly =
    normalizedName &&
    !normalizedPatientId &&
    !normalizedDob
      ? patients.filter(
          (patient) =>
            !patient.deletedAt && text(patient.name).toLowerCase() === normalizedName,
        )
      : [];

  if (byUniqueNameOnly.length === 1) {
    return byUniqueNameOnly[0].id;
  }

  return null;
};

export const buildPatientRecord = ({
  currentTab,
  existingRecord,
  patientDocId,
  reportSnapshot,
  templateType,
}: {
  currentTab: string;
  existingRecord?: PatientRecord | null;
  patientDocId: string;
  reportSnapshot: any;
  templateType: TemplateType;
}): PatientRecord => {
  const nowIso = new Date().toISOString();
  const patientInfo = createPatientStickerSyncSnapshot(
    getTemplatePatientInfo(reportSnapshot, templateType),
  );
  const procedureNames = getTemplateProcedureNames(reportSnapshot, templateType);
  const operationDescription = getTemplateOperationDescription(reportSnapshot, templateType);

  return {
    id: existingRecord?.id || createId("record"),
    patientDocId,
    templateType,
    templateLabel: getTemplateLabel(templateType),
    currentTab: getCurrentTabForTemplate(templateType) || currentTab,
    patientInfo,
    procedureNames,
    primaryProcedureName: procedureNames[0] || getTemplateLabel(templateType),
    operationDescription,
    recordDate: getTemplateRecordDate(reportSnapshot, templateType, nowIso),
    createdAt: existingRecord?.createdAt || nowIso,
    updatedAt: nowIso,
    deletedAt: existingRecord?.deletedAt || null,
    searchText: buildSearchText([
      ...PATIENT_IDENTITY_FIELDS.map((field) => patientInfo[field]),
      getTemplateLabel(templateType),
      procedureNames,
      operationDescription,
    ]),
    reportSnapshot: JSON.parse(JSON.stringify(reportSnapshot)),
  };
};

export const buildPatientSummary = ({
  existingPatient,
  patientDocId,
  records,
}: {
  existingPatient?: PatientSummary | null;
  patientDocId: string;
  records: PatientRecord[];
}): PatientSummary => {
  const visibleRecords = sortRecords(
    records.filter((record) => record.patientDocId === patientDocId && !record.deletedAt),
  );
  const latestRecord = visibleRecords[0];
  const patientInfo = createInitialPatientInfoState(
    latestRecord?.patientInfo || existingPatient || {},
  );
  const procedureCounts = visibleRecords.reduce(
    (acc, record) => ({
      ...acc,
      [record.templateType]: (acc[record.templateType] || 0) + 1,
    }),
    {} as Record<string, number>,
  );

  const summary: PatientSummary = {
    id: patientDocId,
    name: text(patientInfo.name),
    patientId: text(patientInfo.patientId),
    sex: text(patientInfo.sexOther || patientInfo.sex),
    age: text(patientInfo.age),
    dateOfBirth: text(patientInfo.dateOfBirth),
    address: text(patientInfo.address),
    medicalAidName: text(patientInfo.medicalAidName),
    medicalAidNumber: text(patientInfo.medicalAidNumber),
    mainMember: text(patientInfo.mainMember),
    mainMemberId: text(patientInfo.mainMemberId),
    authorization: text(patientInfo.authorization),
    workNumber: text(patientInfo.workNumber),
    homeNumber: text(patientInfo.homeNumber),
    dependCode: text(patientInfo.dependCode),
    hospitalName: text(patientInfo.hospitalName),
    hospitalVisitNumber: text(patientInfo.hospitalVisitNumber),
    doctorName: text(patientInfo.doctorName),
    doctorPracticeNumber: text(patientInfo.doctorPracticeNumber),
    visitDate: text(patientInfo.visitDate),
    visitTime: text(patientInfo.visitTime),
    latestTemplateType: latestRecord?.templateType || existingPatient?.latestTemplateType || "procedure",
    latestTemplateLabel:
      latestRecord?.templateLabel ||
      existingPatient?.latestTemplateLabel ||
      getTemplateLabel("procedure"),
    latestRecordId: latestRecord?.id || existingPatient?.latestRecordId || "",
    latestRecordDate: latestRecord?.recordDate || existingPatient?.latestRecordDate || "",
    totalRecords: visibleRecords.length,
    procedureCounts,
    attachments: existingPatient?.attachments || [],
    createdAt:
      existingPatient?.createdAt || latestRecord?.createdAt || new Date().toISOString(),
    updatedAt:
      latestRecord?.updatedAt || existingPatient?.updatedAt || new Date().toISOString(),
    deletedAt: existingPatient?.deletedAt || null,
    searchText: "",
  };

  summary.searchText = getPatientSummarySearchText(summary, visibleRecords);
  return summary;
};

export const normalizePatientDatabaseCache = (
  cache?: Partial<PatientDatabaseCache> | null,
): PatientDatabaseCache => {
  const cachePatients = cache?.patients;
  const cacheRecords = cache?.records;
  const sourcePatients = Array.isArray(cachePatients)
    ? cachePatients.map((patient, index) => {
        const safePatient =
          patient && typeof patient === "object" ? (patient as PatientSummary) : ({} as PatientSummary);
        const normalizedId = sanitizeId(safePatient?.id) || `patient_recovered_${index + 1}`;
        return {
          ...safePatient,
          id: normalizedId,
        };
      })
    : [];
  const sourceRecords = Array.isArray(cacheRecords)
    ? cacheRecords.map((record, index) => {
        const safeRecord =
          record && typeof record === "object" ? (record as PatientRecord) : ({} as PatientRecord);
        return {
          ...safeRecord,
          id: sanitizeId(safeRecord?.id) || `record_recovered_${index + 1}`,
          patientDocId: sanitizeId(safeRecord?.patientDocId),
        };
      })
    : [];

  if (sourcePatients.length === 0 && sourceRecords.length === 0) {
    return createEmptyPatientDatabaseCache();
  }

  const aliasToCanonicalPatientId = new Map<string, string>();
  const canonicalPatients: PatientSummary[] = [];

  sortPatientsForMerge(sourcePatients).forEach((patient) => {
    const existingCanonicalPatient =
      canonicalPatients.find((canonicalPatient) =>
        isSamePatientIdentity(canonicalPatient, patient),
      ) || null;

    if (existingCanonicalPatient) {
      aliasToCanonicalPatientId.set(patient.id, existingCanonicalPatient.id);
      return;
    }

    canonicalPatients.push(patient);
    aliasToCanonicalPatientId.set(patient.id, patient.id);
  });

  const recoveredPatientIdByIdentity = new Map<string, string>();
  let recoveredPatientCounter = 0;
  const normalizedRecords = dedupeRecordsById(
    sourceRecords.map((record) => {
      const aliasPatientId = sanitizeId(aliasToCanonicalPatientId.get(record.patientDocId));
      if (aliasPatientId) {
        return aliasPatientId === record.patientDocId
          ? record
          : { ...record, patientDocId: aliasPatientId };
      }

      const existingPatientId = sanitizeId(record.patientDocId);
      if (existingPatientId) {
        const matchedPatientId = sanitizeId(
          findMatchingPatientId(canonicalPatients, record.patientInfo),
        );
        if (matchedPatientId && matchedPatientId !== existingPatientId) {
          return { ...record, patientDocId: matchedPatientId };
        }

        return existingPatientId === record.patientDocId
          ? record
          : { ...record, patientDocId: existingPatientId };
      }

      const matchedPatientId = sanitizeId(
        findMatchingPatientId(canonicalPatients, record.patientInfo),
      );
      if (matchedPatientId) {
        return { ...record, patientDocId: matchedPatientId };
      }

      const identityKey = getPatientIdentityKeyFromInfo(record.patientInfo);
      if (identityKey) {
        const existingRecoveredPatientId = recoveredPatientIdByIdentity.get(identityKey);
        if (existingRecoveredPatientId) {
          return { ...record, patientDocId: existingRecoveredPatientId };
        }

        recoveredPatientCounter += 1;
        const recoveredPatientId = `patient_recovered_by_identity_${recoveredPatientCounter}`;
        recoveredPatientIdByIdentity.set(identityKey, recoveredPatientId);
        return { ...record, patientDocId: recoveredPatientId };
      }

      return { ...record, patientDocId: `patient_recovered_${record.id}` };
    }),
  );

  const groupedPatientsByCanonicalId = new Map<string, PatientSummary[]>();
  sourcePatients.forEach((patient) => {
    const canonicalPatientId = aliasToCanonicalPatientId.get(patient.id) || patient.id;
    const groupedPatients = groupedPatientsByCanonicalId.get(canonicalPatientId) || [];
    groupedPatientsByCanonicalId.set(canonicalPatientId, [...groupedPatients, patient]);
  });

  const allPatientIds = new Set<string>([
    ...Array.from(groupedPatientsByCanonicalId.keys()),
    ...normalizedRecords
      .map((record) => sanitizeId(record.patientDocId))
      .filter(Boolean),
  ]);

  const normalizedPatients = sortPatients(
    Array.from(allPatientIds).map((patientId) =>
      buildPatientSummary({
        existingPatient: mergePatientSummaries(
          groupedPatientsByCanonicalId.get(patientId) || [],
          patientId,
        ),
        patientDocId: patientId,
        records: normalizedRecords,
      }),
    ),
  );

  return {
    patients: normalizedPatients,
    records: normalizedRecords,
  };
};

export const upsertPatientRecordInCache = (
  cache: PatientDatabaseCache,
  record: PatientRecord,
) => {
  const nextRecords = sortRecords([
    ...cache.records.filter((existingRecord) => existingRecord.id !== record.id),
    record,
  ]);
  const existingPatient = cache.patients.find((patient) => patient.id === record.patientDocId) || null;
  const nextPatient = buildPatientSummary({
    existingPatient,
    patientDocId: record.patientDocId,
    records: nextRecords,
  });
  const nextPatients = sortPatients([
    ...cache.patients.filter((patient) => patient.id !== record.patientDocId),
    nextPatient,
  ]);

  return {
    patients: nextPatients,
    records: nextRecords,
  };
};

export const removePatientRecordFromCache = (
  cache: PatientDatabaseCache,
  recordId: string,
) => {
  const existingRecord = cache.records.find((record) => record.id === recordId) || null;
  if (!existingRecord) {
    return cache;
  }

  const nextRecords = sortRecords(
    cache.records.filter((record) => record.id !== recordId),
  );
  const existingPatient =
    cache.patients.find((patient) => patient.id === existingRecord.patientDocId) || null;

  if (!existingPatient) {
    return {
      patients: cache.patients,
      records: nextRecords,
    };
  }

  const remainingVisibleRecords = nextRecords.filter(
    (record) => record.patientDocId === existingRecord.patientDocId && !record.deletedAt,
  );
  const nextPatient = buildPatientSummary({
    existingPatient:
      remainingVisibleRecords.length === 0
        ? {
            ...existingPatient,
            latestTemplateType: "procedure",
            latestTemplateLabel: "",
            latestRecordId: "",
            latestRecordDate: "",
            updatedAt: new Date().toISOString(),
          }
        : existingPatient,
    patientDocId: existingRecord.patientDocId,
    records: nextRecords,
  });

  const nextPatients = sortPatients([
    ...cache.patients.filter((patient) => patient.id !== existingRecord.patientDocId),
    nextPatient,
  ]);

  return {
    patients: nextPatients,
    records: nextRecords,
  };
};

export const applyPatientDeletedState = (
  cache: PatientDatabaseCache,
  patientId: string,
  deletedAt: string | null,
) => {
  const nextRecords = sortRecords(
    cache.records.map((record) =>
      record.patientDocId === patientId ? { ...record, deletedAt } : record,
    ),
  );
  const existingPatient = cache.patients.find((patient) => patient.id === patientId) || null;
  const rebuiltPatient = buildPatientSummary({
    existingPatient: existingPatient
      ? {
          ...existingPatient,
          deletedAt,
          updatedAt: new Date().toISOString(),
        }
      : null,
    patientDocId: patientId,
    records: nextRecords,
  });

  const nextPatients = sortPatients([
    ...cache.patients.filter((patient) => patient.id !== patientId),
    {
      ...rebuiltPatient,
      deletedAt,
      updatedAt: new Date().toISOString(),
    },
  ]);

  return {
    patients: nextPatients,
    records: nextRecords,
  };
};

export const removePatientsFromCache = (
  cache: PatientDatabaseCache,
  patientIds: string[],
) => {
  const patientIdSet = new Set(patientIds);

  return {
    patients: cache.patients.filter((patient) => !patientIdSet.has(patient.id)),
    records: cache.records.filter((record) => !patientIdSet.has(record.patientDocId)),
  };
};

export const createNewPatientId = () => createId("patient");

export const createNewPatientRecordId = () => createId("record");
