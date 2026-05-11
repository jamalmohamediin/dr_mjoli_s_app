const text = (value: unknown) => String(value || "").trim();

const TEMPLATE_KEY_BY_TYPE: Record<string, string> = {
  procedure: "",
  gastroscopy: "gastroscopy",
  colonoscopy: "colonoscopy",
  appendectomy: "appendectomy",
  ventralHernia: "ventralHernia",
  rectalCancer: "rectalCancer",
  smallBowel: "smallBowel",
  cholecystectomy: "cholecystectomy",
  periAnal: "periAnal",
  inguinalHernia: "inguinalHernia",
  transanalMinimallyInvasiveSurgery: "transanalMinimallyInvasiveSurgery",
  openGeneralSurgery: "openGeneralSurgery",
  openAbdominalSurgery: "openAbdominalSurgery",
};

export const toIsoDateOfOperation = (value: unknown) => {
  const raw = text(value);
  if (!raw) {
    return "";
  }

  const isoDateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
  if (isoDateTime) {
    return `${isoDateTime[1]}-${isoDateTime[2]}-${isoDateTime[3]}`;
  }

  const ddMmYyyy = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s|T|$)/);
  if (ddMmYyyy) {
    return `${ddMmYyyy[3]}-${ddMmYyyy[2]}-${ddMmYyyy[1]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear().toString().padStart(4, "0");
  const month = (parsed.getMonth() + 1).toString().padStart(2, "0");
  const day = parsed.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateOfOperationForDisplay = (value: unknown) => {
  const isoDate = toIsoDateOfOperation(value);
  if (!isoDate) {
    return text(value);
  }

  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};

export const getDateOfOperationFromTemplateData = (templateData: any) => {
  const candidates = [
    templateData?.procedureDetails?.dateOfOperation,
    templateData?.procedure?.dateOfOperation,
    templateData?.preoperative?.dateOfOperation,
    templateData?.patientInfo?.dateOfOperation,
    templateData?.dateOfOperation,
  ];

  return text(candidates.find((candidate) => text(candidate)));
};

export const getTemplateDateOfOperation = (
  reportSnapshot: any,
  templateType: string,
) => {
  const root = reportSnapshot || {};
  const templateKey = TEMPLATE_KEY_BY_TYPE[templateType] || "";
  const templateData = templateKey ? root?.[templateKey] || {} : root;

  const candidates =
    templateType === "procedure"
      ? [
          root?.patientInfo?.dateOfOperation,
          root?.procedure?.dateOfOperation,
          root?.patientInfo?.date,
          root?.procedure?.date,
        ]
      : [
          getDateOfOperationFromTemplateData(templateData),
          templateData?.patientInfo?.dateOfOperation,
        ];

  return text(candidates.find((candidate) => text(candidate)));
};

export const getTemplateDateOfOperationIso = (
  reportSnapshot: any,
  templateType: string,
) => toIsoDateOfOperation(getTemplateDateOfOperation(reportSnapshot, templateType));
