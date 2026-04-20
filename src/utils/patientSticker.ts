import { getFullASAText } from "@/utils/asaDescriptions";

export const PATIENT_STICKER_FIELD_KEYS = [
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

export const PATIENT_STICKER_METADATA_KEYS = [
  "stickerMode",
  "stickerImageName",
  "stickerImageData",
  "stickerExtractionStatus",
  "stickerExtractionError",
  "stickerLastExtractedAt",
] as const;

export const PATIENT_STICKER_SYNC_KEYS = [
  "name",
  "patientId",
  "sex",
  "sexOther",
  "age",
  "dateOfBirth",
  "weight",
  "height",
  "bmi",
  "asaScore",
  "asaNotes",
  ...PATIENT_STICKER_FIELD_KEYS,
] as const;

export const PATIENT_STICKER_SYNC_METADATA_KEYS = [
  "stickerMode",
  "stickerImageName",
  "stickerExtractionStatus",
  "stickerExtractionError",
  "stickerLastExtractedAt",
] as const;

const PATIENT_STICKER_SHARED_SYNC_KEYS = [
  "name",
  "patientId",
  "dateOfBirth",
  "age",
  "sex",
  "sexOther",
  "weight",
  "height",
  "bmi",
  "asaScore",
  "asaNotes",
  ...PATIENT_STICKER_FIELD_KEYS,
] as const;

export const createInitialPatientInfoState = (overrides: Record<string, any> = {}) => ({
  name: "",
  patientId: "",
  dateOfBirth: "",
  age: "",
  sex: "",
  sexOther: "",
  weight: "",
  height: "",
  bmi: "",
  asaScore: "",
  asaNotes: "",
  address: "",
  medicalAidName: "",
  medicalAidNumber: "",
  mainMember: "",
  mainMemberId: "",
  authorization: "",
  workNumber: "",
  homeNumber: "",
  dependCode: "",
  hospitalName: "",
  hospitalVisitNumber: "",
  doctorName: "",
  doctorPracticeNumber: "",
  visitDate: "",
  visitTime: "",
  stickerMode: false,
  stickerImageName: "",
  stickerImageData: "",
  stickerExtractionStatus: "idle",
  stickerExtractionError: "",
  stickerLastExtractedAt: "",
  ...overrides,
});

export const createEmptyPatientStickerPatch = () => ({
  name: "",
  patientId: "",
  dateOfBirth: "",
  age: "",
  sex: "",
  sexOther: "",
  address: "",
  medicalAidName: "",
  medicalAidNumber: "",
  mainMember: "",
  mainMemberId: "",
  authorization: "",
  workNumber: "",
  homeNumber: "",
  dependCode: "",
  hospitalName: "",
  hospitalVisitNumber: "",
  doctorName: "",
  doctorPracticeNumber: "",
  visitDate: "",
  visitTime: "",
  stickerMode: false,
  stickerImageName: "",
  stickerImageData: "",
  stickerExtractionStatus: "idle",
  stickerExtractionError: "",
  stickerLastExtractedAt: "",
});

const hasTextValue = (value: any) => typeof value === "string" && value.trim().length > 0;

const isGeneratedDraftSyncName = (value: any) =>
  /^Draft Sync \d+$/i.test(String(value || "").trim());

const isGeneratedDraftSyncPatientId = (value: any) =>
  /^SYNC-\d+$/i.test(String(value || "").trim());

const getStickerFieldValue = (patientInfo: any, key: string) => {
  const info = patientInfo || {};
  return hasTextValue(info[key]) ? info[key].trim() : "";
};

export const hasPatientStickerMode = (patientInfo?: any) => {
  const info = patientInfo || {};

  if (info.stickerMode) {
    return true;
  }

  if (hasTextValue(info.stickerImageName) || hasTextValue(info.stickerImageData)) {
    return true;
  }

  if (info.stickerExtractionStatus && info.stickerExtractionStatus !== "idle") {
    return true;
  }

  return PATIENT_STICKER_FIELD_KEYS.some((key) => hasTextValue(info[key]));
};

export const hasExtractedPatientStickerData = (patientInfo?: any) => {
  const info = normalizePatientInfo(patientInfo);
  const hasExtractionMarker =
    info.stickerExtractionStatus === "success" ||
    hasTextValue(info.stickerLastExtractedAt) ||
    hasTextValue(info.stickerImageName) ||
    hasTextValue(info.stickerImageData);
  const hasStickerSpecificFields = PATIENT_STICKER_FIELD_KEYS.some((key) =>
    hasTextValue(info[key]),
  );

  // Some templates can end up with the extracted sticker payload copied into
  // patientInfo without the original extraction metadata. In that case we still
  // want every template to recognize the shared sticker details.
  if (!hasExtractionMarker && !hasStickerSpecificFields) {
    return false;
  }

  return hasMeaningfulPatientInfoSyncData(info);
};

export const normalizePatientInfo = (patientInfo?: any) => {
  const normalized = createInitialPatientInfoState(patientInfo || {});

  if (isGeneratedDraftSyncName(normalized.name)) {
    normalized.name = "";
  }

  if (isGeneratedDraftSyncPatientId(normalized.patientId)) {
    normalized.patientId = "";
  }

  if (!normalized.stickerMode && hasPatientStickerMode(normalized)) {
    normalized.stickerMode = true;
  }

  return normalized;
};

export const getPdfSafePatientInfo = (patientInfo?: any) => {
  const info = normalizePatientInfo(patientInfo);

  return {
    ...info,
    medicalAidName: "",
    medicalAidNumber: "",
    mainMember: "",
    mainMemberId: "",
    workNumber: "",
    homeNumber: "",
    authorization: "",
    dependCode: "",
    hospitalName: "",
    hospitalVisitNumber: "",
    doctorName: "",
    doctorPracticeNumber: "",
  };
};

export const hasMeaningfulPatientInfoSyncData = (patientInfo?: any) => {
  const info = normalizePatientInfo(patientInfo);
  return PATIENT_STICKER_SHARED_SYNC_KEYS.some((key) => hasTextValue(info[key]));
};

export const createPatientStickerSyncSnapshot = (patientInfo?: any) => {
  const info = normalizePatientInfo(patientInfo);
  const snapshot = PATIENT_STICKER_SYNC_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: typeof info[key] === "string" ? info[key].trim() : info[key] || "",
    }),
    {} as Record<string, any>,
  );

  return normalizePatientInfo({
    ...snapshot,
    stickerMode: hasPatientStickerMode(info),
    stickerImageName: String(info.stickerImageName || "").trim(),
    stickerExtractionStatus:
      String(info.stickerExtractionStatus || "").trim() ||
      (hasMeaningfulPatientInfoSyncData(info) ? "success" : "idle"),
    stickerExtractionError: String(info.stickerExtractionError || "").trim(),
    stickerLastExtractedAt: String(info.stickerLastExtractedAt || "").trim(),
  });
};

export const getPatientStickerSyncSignature = (patientInfo?: any) => {
  const info = createPatientStickerSyncSnapshot(patientInfo);
  const signaturePayload = [...PATIENT_STICKER_SYNC_KEYS, ...PATIENT_STICKER_SYNC_METADATA_KEYS].reduce(
    (acc, key) => ({
      ...acc,
      [key]: typeof info[key] === "string" ? info[key].trim() : info[key] || "",
    }),
    {} as Record<string, any>,
  );

  return JSON.stringify(signaturePayload);
};

export const getPatientStickerSyncTimestamp = (patientInfo?: any) => {
  const info = createPatientStickerSyncSnapshot(patientInfo);
  const timestamp = Date.parse(String(info.stickerLastExtractedAt || "").trim());
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const calculatePatientAge = (dateOfBirth: string) => {
  const raw = String(dateOfBirth || "").trim();
  if (!raw) {
    return "";
  }

  const birthDate = new Date(raw);
  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
};

export const calculatePatientBMI = (weight: string, height: string) => {
  const weightNum = Number.parseFloat(String(weight || "").trim());
  const heightNum = Number.parseFloat(String(height || "").trim());

  if (!weightNum || !heightNum || heightNum <= 0) {
    return "";
  }

  const heightInMeters = heightNum / 100;
  const bmi = weightNum / (heightInMeters * heightInMeters);
  return Number.isFinite(bmi) ? bmi.toFixed(1) : "";
};

export const mergePatientInfoUpdates = (
  currentPatientInfo: any,
  updates: Record<string, any> = {},
) => {
  const previousInfo = createInitialPatientInfoState(currentPatientInfo || {});
  const nextInfo = createInitialPatientInfoState({
    ...previousInfo,
    ...updates,
  });

  if (
    Object.prototype.hasOwnProperty.call(updates, "dateOfBirth") &&
    !Object.prototype.hasOwnProperty.call(updates, "age")
  ) {
    const previousAge = String(previousInfo.age || "").trim();
    const previousAutoAge = calculatePatientAge(previousInfo.dateOfBirth);
    const canAutoRecalculateAge = !previousAge || previousAge === previousAutoAge;

    if (canAutoRecalculateAge) {
      nextInfo.age = calculatePatientAge(nextInfo.dateOfBirth);
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, "weight") ||
    Object.prototype.hasOwnProperty.call(updates, "height")
  ) {
    nextInfo.bmi = calculatePatientBMI(nextInfo.weight, nextInfo.height);
  }

  return nextInfo;
};

const pad = (value: number) => value.toString().padStart(2, "0");

export const formatPatientStickerDate = (value?: string | Date | null) => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const normalizeDateString = (value: any) => {
  if (!hasTextValue(value)) {
    return "";
  }

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const slashOrDash = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (slashOrDash) {
    return `${slashOrDash[3]}-${slashOrDash[2]}-${slashOrDash[1]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const normalizeTimeString = (value: any) => {
  if (!hasTextValue(value)) {
    return "";
  }

  const raw = String(value).trim();
  const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return "";
  }

  return `${pad(Number(timeMatch[1]))}:${timeMatch[2]}`;
};

const normalizeGenderValue = (value: any) => {
  if (!hasTextValue(value)) {
    return { sex: "", sexOther: "" };
  }

  const raw = String(value).trim();
  const normalized = raw.toLowerCase();

  if (normalized.includes("female")) {
    return { sex: "female", sexOther: "" };
  }

  if (normalized.includes("male")) {
    return { sex: "male", sexOther: "" };
  }

  return { sex: "other", sexOther: raw };
};

const collapseAddress = (value: any) => {
  if (Array.isArray(value)) {
    return value
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  if (!hasTextValue(value)) {
    return "";
  }

  return String(value)
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
};

export const normalizePatientStickerPayload = (payload: any) => {
  const source = payload?.patientInfo || payload?.extractedData || payload || {};
  const gender = normalizeGenderValue(source.sex || source.gender || source.patientGender);

  return {
    name: String(source.name || source.patientName || source.fullName || "").trim(),
    patientId: String(source.patientId || source.idNumber || source.id || "").trim(),
    dateOfBirth: normalizeDateString(source.dateOfBirth || source.dob),
    age: String(source.age || "").trim(),
    sex: gender.sex,
    sexOther: gender.sexOther,
    address: collapseAddress(source.address),
    medicalAidName: String(source.medicalAidName || "").trim(),
    medicalAidNumber: String(source.medicalAidNumber || "")
      .trim()
      .replace(/^#/, ""),
    mainMember: String(source.mainMember || "").trim(),
    mainMemberId: String(source.mainMemberId || "").trim(),
    authorization: String(source.authorization || "").trim(),
    workNumber: String(source.workNumber || "").trim(),
    homeNumber: String(source.homeNumber || "").trim(),
    dependCode: String(source.dependCode || "").trim(),
    hospitalName: String(source.hospitalName || "").trim(),
    hospitalVisitNumber: String(source.hospitalVisitNumber || "").trim(),
    doctorName: String(source.doctorName || "").trim(),
    doctorPracticeNumber: String(source.doctorPracticeNumber || "").trim(),
    visitDate: normalizeDateString(source.visitDate || source.date),
    visitTime: normalizeTimeString(source.visitTime || source.time),
  };
};

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export const formatPatientGender = (patientInfo?: any) => {
  const info = normalizePatientInfo(patientInfo);

  if (info.sex === "other" && hasTextValue(info.sexOther)) {
    return info.sexOther;
  }

  if (!hasTextValue(info.sex)) {
    return "";
  }

  return titleCase(info.sex);
};

const txt = (value: any) => String(value || "").trim();

export const getPatientInfoDisplayEntries = (
  patientInfo?: any,
  fallbackName = "",
  fallbackPatientId = "",
) => {
  const info = normalizePatientInfo(patientInfo);
  const gender = formatPatientGender(info);
  const entries = hasPatientStickerMode(info)
    ? [
        { label: "Patient Name", value: txt(info.name || fallbackName) },
        { label: "Patient ID", value: txt(info.patientId || fallbackPatientId) },
        { label: "Gender", value: gender },
        { label: "Age", value: txt(info.age) },
        { label: "Date Of Birth", value: formatPatientStickerDate(info.dateOfBirth) },
        { label: "Address", value: txt(info.address), fullWidth: true },
        { label: "Medical Aid Name", value: txt(info.medicalAidName) },
        { label: "Medical Aid Number", value: txt(info.medicalAidNumber) },
        { label: "Main Member", value: txt(info.mainMember) },
        { label: "Main Member ID", value: txt(info.mainMemberId) },
        { label: "Authorization", value: txt(info.authorization) },
        { label: "Work Number", value: txt(info.workNumber) },
        { label: "Home Number", value: txt(info.homeNumber) },
        { label: "Depend Code", value: txt(info.dependCode) },
        { label: "Hospital Name", value: txt(info.hospitalName), fullWidth: true },
        { label: "Hospital Visit Number", value: txt(info.hospitalVisitNumber), fullWidth: true },
        { label: "Doctor's Name", value: txt(info.doctorName) },
        { label: "Doctor's Practice Number", value: txt(info.doctorPracticeNumber) },
        { label: "Date", value: formatPatientStickerDate(info.visitDate) },
        { label: "Time", value: txt(info.visitTime) },
        { label: "Weight", value: txt(info.weight) ? `${txt(info.weight)} kg` : "" },
        { label: "Height", value: txt(info.height) ? `${txt(info.height)} cm` : "" },
        { label: "BMI", value: txt(info.bmi) },
      ]
    : [
        { label: "Name", value: txt(info.name || fallbackName) },
        { label: "Patient ID", value: txt(info.patientId || fallbackPatientId) },
        { label: "Date Of Birth", value: formatPatientStickerDate(info.dateOfBirth) },
        { label: "Age", value: txt(info.age) },
        { label: "Sex", value: gender },
        { label: "Weight", value: txt(info.weight) ? `${txt(info.weight)} kg` : "" },
        { label: "Height", value: txt(info.height) ? `${txt(info.height)} cm` : "" },
        { label: "BMI", value: txt(info.bmi) },
      ];

  if (txt(info.asaScore)) {
    entries.push({
      label: "ASA Score",
      value: getFullASAText(info.asaScore),
      fullWidth: true,
    });
  }

  if (txt(info.asaNotes)) {
    entries.push({
      label: "ASA Notes",
      value: txt(info.asaNotes),
      fullWidth: true,
    });
  }

  return entries.filter((entry) => hasTextValue(entry.value));
};

export const hasMeaningfulPatientInfoData = (
  patientInfo?: any,
  fallbackName = "",
  fallbackPatientId = "",
) => getPatientInfoDisplayEntries(patientInfo, fallbackName, fallbackPatientId).length > 0;

const hasPatientPdfCellValue = (cell: string) =>
  hasTextValue(String(cell || "").replace(/^[^:]+:\s*/, ""));

const filterPatientPdfRows = (rows: string[][]) =>
  rows.filter((row) => row.some((cell) => hasPatientPdfCellValue(cell)));

export const getPatientInfoPdfSections = (
  patientInfo?: any,
  fallbackName = "",
  fallbackPatientId = "",
) => {
  const info = getPdfSafePatientInfo(patientInfo);
  const gender = formatPatientGender(info);

  if (hasPatientStickerMode(info)) {
    return [
      {
        title: "Patient Details",
        rows: filterPatientPdfRows([
          [
            `Patient Name: ${txt(info.name || fallbackName)}`,
            `Gender: ${gender}`,
            `Age: ${txt(info.age)}`,
          ],
          [
            `Patient ID: ${txt(info.patientId || fallbackPatientId)}`,
            `Date Of Birth: ${formatPatientStickerDate(info.dateOfBirth)}`,
            `Address: ${txt(info.address)}`,
          ],
          [
            `ASA Physical Status Classification: ${info.asaScore ? getFullASAText(info.asaScore) : ""}`,
            `ASA Notes: ${txt(info.asaNotes)}`,
            "",
          ],
          [
            `Weight: ${txt(info.weight)}`,
            `Height: ${txt(info.height)}`,
            `BMI: ${txt(info.bmi)}`,
          ],
          [
            `Date: ${formatPatientStickerDate(info.visitDate)}`,
            `Time: ${txt(info.visitTime)}`,
            "",
          ],
        ]),
      },
    ].filter((section) => section.rows.length > 0);
  }

  return [
    {
      title: "",
      rows: filterPatientPdfRows([
        [`Name: ${txt(info.name || fallbackName)}`, `Patient ID: ${txt(info.patientId || fallbackPatientId)}`, ""],
        [
          `Date Of Birth: ${formatPatientStickerDate(info.dateOfBirth)}`,
          `Age: ${txt(info.age)}`,
          `Sex: ${gender}`,
        ],
        [`Weight: ${txt(info.weight)}`, `Height: ${txt(info.height)}`, `BMI: ${txt(info.bmi)}`],
        [
          `ASA Score: ${info.asaScore ? getFullASAText(info.asaScore) : ""}`,
          `ASA Notes: ${txt(info.asaNotes)}`,
          "",
        ],
      ]),
    },
  ].filter((section) => section.rows.length > 0);
};

export const getPatientInfoPdfRows = (
  patientInfo?: any,
  fallbackName = "",
  fallbackPatientId = "",
) => getPatientInfoPdfSections(patientInfo, fallbackName, fallbackPatientId).flatMap(
  (section) => section.rows,
);
