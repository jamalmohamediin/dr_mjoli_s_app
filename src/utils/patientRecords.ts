import {
  createInitialPatientInfoState,
  createPatientStickerSyncSnapshot,
} from "@/utils/patientSticker";

export type TemplateType =
  | "procedure"
  | "appendectomy"
  | "ventralHernia"
  | "rectalCancer"
  | "smallBowel"
  | "cholecystectomy"
  | "periAnal";

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
  appendectomy: "Appendicectomy",
  ventralHernia: "Ventral Hernia Repair",
  rectalCancer: "Colorectal Resection",
  smallBowel: "Small Bowel Surgery",
  cholecystectomy: "Cholecystectomy",
  periAnal: "Peri-Anal",
};

const TEMPLATE_TAB_MAP: Record<TemplateType, string> = {
  procedure: "procedure",
  appendectomy: "appendectomy",
  ventralHernia: "hernia",
  rectalCancer: "rectal",
  smallBowel: "smallBowel",
  cholecystectomy: "cholecystectomy",
  periAnal: "periAnal",
};

const TAB_TEMPLATE_MAP: Record<string, TemplateType> = {
  procedure: "procedure",
  appendectomy: "appendectomy",
  hernia: "ventralHernia",
  ventralHernia: "ventralHernia",
  rectal: "rectalCancer",
  rectalCancer: "rectalCancer",
  smallBowel: "smallBowel",
  cholecystectomy: "cholecystectomy",
  periAnal: "periAnal",
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

const buildSearchText = (values: any[]) =>
  values
    .flatMap((value) =>
      Array.isArray(value)
        ? value.map((entry) => text(entry))
        : [text(value)],
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
    case "procedure":
    default:
      return reportSnapshot?.patientInfo || {};
  }
};

const getTemplateOperationDescription = (reportSnapshot: any, templateType: TemplateType) => {
  switch (templateType) {
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
  const patientInfo = createInitialPatientInfoState(getTemplatePatientInfo(reportSnapshot, templateType));
  return toIsoDate(patientInfo.visitDate, fallbackIso);
};

const sortRecords = (records: PatientRecord[]) =>
  [...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

const sortPatients = (patients: PatientSummary[]) =>
  [...patients].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

const getPatientSummarySearchText = (summary: PatientSummary, records: PatientRecord[]) =>
  buildSearchText([
    ...PATIENT_IDENTITY_FIELDS.map((field) => summary[field]),
    summary.latestTemplateLabel,
    records.flatMap((record) => [
      record.templateLabel,
      record.primaryProcedureName,
      record.operationDescription,
      record.procedureNames,
    ]),
  ]);

export const findMatchingPatientId = (
  patients: PatientSummary[],
  patientInfo: any,
) => {
  const info = createPatientStickerSyncSnapshot(patientInfo);
  const normalizedName = text(info.name).toLowerCase();
  const normalizedDob = text(info.dateOfBirth);
  const normalizedPatientId = text(info.patientId).toLowerCase();
  const normalizedAidNumber = text(info.medicalAidNumber).toLowerCase();

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

  const byAidAndDob =
    normalizedAidNumber && normalizedDob
      ? patients.find(
          (patient) =>
            !patient.deletedAt &&
            text(patient.medicalAidNumber).toLowerCase() === normalizedAidNumber &&
            text(patient.dateOfBirth) === normalizedDob,
        )
      : null;

  if (byAidAndDob) {
    return byAidAndDob.id;
  }

  const byNameAndDob =
    normalizedName && normalizedDob
      ? patients.find(
          (patient) =>
            !patient.deletedAt &&
            text(patient.name).toLowerCase() === normalizedName &&
            text(patient.dateOfBirth) === normalizedDob,
        )
      : null;

  return byNameAndDob?.id || null;
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

export const createNewPatientId = () => createId("patient");
