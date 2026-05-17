export const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

export const hasText = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

export const text = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

type EndoscopyTemplateKey = "gastroscopy" | "colonoscopy";
type EndoscopyLegacyCanvasKey = "gastroscopyCanvasData" | "colonoscopyCanvasData";
type EndoscopyLegacyFindingsKey = "gastroscopyFindings" | "colonoscopyFindings";

const cloneSerializable = <T,>(value: T): T => {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    if (Array.isArray(value)) {
      return [...value] as T;
    }

    if (value && typeof value === "object") {
      return { ...(value as Record<string, any>) } as T;
    }

    return value;
  }
};

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};

const compactEndoscopySnapshotSection = (
  snapshot: Record<string, any>,
  templateKey: EndoscopyTemplateKey,
  legacyCanvasKey: EndoscopyLegacyCanvasKey,
  legacyFindingsKey: EndoscopyLegacyFindingsKey,
) => {
  const hasTemplateKey = Object.prototype.hasOwnProperty.call(snapshot, templateKey);
  const hasLegacyCanvasKey = Object.prototype.hasOwnProperty.call(snapshot, legacyCanvasKey);
  const hasLegacyFindingsKey = Object.prototype.hasOwnProperty.call(snapshot, legacyFindingsKey);
  const templateState = asRecord(snapshot[templateKey]);
  const templateDiagram = asRecord(templateState.diagram);
  const legacyFindings = asRecord(snapshot[legacyFindingsKey]);

  const resolvedCanvasImage =
    text(templateDiagram.canvasImageData) ||
    text(templateDiagram.drawingImageData) ||
    text(snapshot[legacyCanvasKey]) ||
    text(legacyFindings.canvasImageData) ||
    text(legacyFindings.drawingImageData);

  const nextTemplateState: Record<string, any> = {
    ...templateState,
    diagram: {
      ...templateDiagram,
      ...(resolvedCanvasImage ? { canvasImageData: resolvedCanvasImage } : {}),
    },
  };

  if (
    text(nextTemplateState.diagram?.drawingImageData) &&
    (text(nextTemplateState.diagram?.drawingImageData) === resolvedCanvasImage ||
      String(nextTemplateState.diagram?.drawingImageData).trim().startsWith("data:"))
  ) {
    nextTemplateState.diagram = {
      ...nextTemplateState.diagram,
      drawingImageData: "",
    };
  }

  const templateLegacyCanvasKey = `${templateKey}CanvasData`;
  if (text(nextTemplateState[templateLegacyCanvasKey])) {
    nextTemplateState[templateLegacyCanvasKey] = "";
  }

  if (hasTemplateKey || resolvedCanvasImage || Object.keys(templateState).length > 0) {
    snapshot[templateKey] = nextTemplateState;
  }

  if (hasLegacyCanvasKey) {
    snapshot[legacyCanvasKey] = "";
  }

  if (hasLegacyFindingsKey && Object.keys(legacyFindings).length > 0) {
    const nextLegacyFindings: Record<string, any> = {
      ...legacyFindings,
      canvasImageData: "",
    };

    if ("drawingImageData" in nextLegacyFindings) {
      nextLegacyFindings.drawingImageData = "";
    }

    if (!Array.isArray(nextLegacyFindings.findings)) {
      nextLegacyFindings.findings = [];
    }

    snapshot[legacyFindingsKey] = nextLegacyFindings;
  }
};

export const compactEndoscopyReportSnapshot = (reportSnapshot: any) => {
  if (!reportSnapshot || typeof reportSnapshot !== "object" || Array.isArray(reportSnapshot)) {
    return reportSnapshot;
  }

  const clonedSnapshot = cloneSerializable(reportSnapshot) as Record<string, any>;

  compactEndoscopySnapshotSection(
    clonedSnapshot,
    "gastroscopy",
    "gastroscopyCanvasData",
    "gastroscopyFindings",
  );
  compactEndoscopySnapshotSection(
    clonedSnapshot,
    "colonoscopy",
    "colonoscopyCanvasData",
    "colonoscopyFindings",
  );

  return clonedSnapshot;
};

export const stripEndoscopyReportDiagramImages = (reportSnapshot: any) => {
  if (!reportSnapshot || typeof reportSnapshot !== "object" || Array.isArray(reportSnapshot)) {
    return reportSnapshot;
  }

  const clonedSnapshot = cloneSerializable(reportSnapshot) as Record<string, any>;

  (
    [
      ["gastroscopy", "gastroscopyCanvasData", "gastroscopyFindings"],
      ["colonoscopy", "colonoscopyCanvasData", "colonoscopyFindings"],
    ] as Array<[EndoscopyTemplateKey, EndoscopyLegacyCanvasKey, EndoscopyLegacyFindingsKey]>
  ).forEach(([templateKey, legacyCanvasKey, legacyFindingsKey]) => {
    const hasTemplateKey = Object.prototype.hasOwnProperty.call(clonedSnapshot, templateKey);
    const hasLegacyCanvasKey = Object.prototype.hasOwnProperty.call(clonedSnapshot, legacyCanvasKey);
    const hasLegacyFindingsKey = Object.prototype.hasOwnProperty.call(clonedSnapshot, legacyFindingsKey);
    const templateState = asRecord(clonedSnapshot[templateKey]);
    const templateDiagram = asRecord(templateState.diagram);
    const templateLegacyCanvasKey = `${templateKey}CanvasData`;
    const legacyFindings = asRecord(clonedSnapshot[legacyFindingsKey]);

    if (hasTemplateKey || Object.keys(templateState).length > 0) {
      clonedSnapshot[templateKey] = {
        ...templateState,
        ...(templateLegacyCanvasKey in templateState ? { [templateLegacyCanvasKey]: "" } : {}),
        diagram: {
          ...templateDiagram,
          canvasImageData: "",
          ...(templateDiagram.drawingImageData !== undefined ? { drawingImageData: "" } : {}),
        },
      };
    }

    if (hasLegacyCanvasKey) {
      clonedSnapshot[legacyCanvasKey] = "";
    }

    if (hasLegacyFindingsKey && Object.keys(legacyFindings).length > 0) {
      clonedSnapshot[legacyFindingsKey] = {
        ...legacyFindings,
        canvasImageData: "",
        ...(legacyFindings.drawingImageData !== undefined ? { drawingImageData: "" } : {}),
        findings: Array.isArray(legacyFindings.findings) ? legacyFindings.findings : [],
      };
    }
  });

  return clonedSnapshot;
};

const UI_LOWERCASE_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "de",
  "for",
  "from",
  "in",
  "nor",
  "of",
  "on",
  "or",
  "per",
  "the",
  "to",
  "via",
  "with",
]);

const UI_UPPERCASE_WORDS = new Set([
  "asa",
  "bbps",
  "bp",
  "co2",
  "ct",
  "d1",
  "d2",
  "ecg",
  "ga",
  "gist",
  "ibd",
  "mri",
  "ovesco",
  "pds",
  "pr",
  "t1",
  "t2",
  "t3",
  "t4",
  "tamis",
  "tapp",
  "tep",
]);

const formatUiCoreWord = (word: string, index: number, total: number) => {
  if (!/[A-Za-z]/.test(word)) {
    return word;
  }

  const lowerWord = word.toLowerCase();

  if (UI_UPPERCASE_WORDS.has(lowerWord)) {
    return lowerWord.toUpperCase();
  }

  if (/[A-Z]/.test(word) && /[a-z]/.test(word) && word !== word.toLowerCase() && word !== word.toUpperCase()) {
    return word;
  }

  if (word.length === 1 && /[A-Za-z]/.test(word)) {
    return word.toUpperCase();
  }

  if (/^[a-z][A-Z0-9]+$/.test(word) || /[A-Z]{2,}/.test(word) || (/\d/.test(word) && /[A-Za-z]/.test(word))) {
    return word;
  }

  if (UI_LOWERCASE_WORDS.has(lowerWord) && index > 0 && index < total - 1) {
    return lowerWord;
  }

  return lowerWord.replace(/^[a-z]/, (match) => match.toUpperCase());
};

const formatUiToken = (token: string, index: number, total: number): string =>
  token
    .split(/([\-–/])/)
    .map((part) => {
      if (!part || /^[\-–/]$/.test(part)) {
        return part;
      }

      const match = part.match(/^([^A-Za-z0-9%]*)([A-Za-z0-9%'.’]+)([^A-Za-z0-9%]*)$/);
      if (!match) {
        return part;
      }

      const [, leading, core, trailing] = match;
      return `${leading}${formatUiCoreWord(core, index, total)}${trailing}`;
    })
    .join("");

export const toUiTitleCase = (value: unknown): string => {
  const input = text(value);
  if (!input) {
    return "";
  }

  const tokens = input.split(/(\s+)/);
  const wordIndexes = tokens.reduce<number[]>((indexes, token, index) => {
    if (token.trim()) {
      indexes.push(index);
    }
    return indexes;
  }, []);

  return tokens
    .map((token, index) => {
      const wordPosition = wordIndexes.indexOf(index);
      if (wordPosition === -1) {
        return token;
      }

      return formatUiToken(token, wordPosition, wordIndexes.length);
    })
    .join("");
};

export const toggleArrayValue = (value: unknown, item: string) => {
  const items = toArray(value);
  return items.includes(item)
    ? items.filter((entry) => entry !== item)
    : [...items, item];
};

export const joinSelections = (value: unknown, otherValue?: unknown) =>
  toArray(value)
    .map((entry) => {
      if (entry === "Other" && hasText(otherValue)) {
        return `Other: ${text(otherValue)}`;
      }

      return entry;
    })
    .filter(Boolean)
    .join(", ");

export const PATHOLOGY_LAB_OPTIONS = [
  "Pathcare",
  "Ampath",
  "NHLS",
  "Lancet",
  "Other",
] as const;

type PathologyLabOption = (typeof PATHOLOGY_LAB_OPTIONS)[number];

const PATHOLOGY_LAB_SET = new Set<string>(PATHOLOGY_LAB_OPTIONS);

export const normalizePathologyLabSelections = (
  selections: unknown,
  legacyLaboratorySentTo?: unknown,
): PathologyLabOption[] => {
  const selected = toArray(selections).filter((value): value is PathologyLabOption =>
    PATHOLOGY_LAB_SET.has(value),
  );

  if (selected.length > 0) {
    return selected;
  }

  const legacyValue = String(legacyLaboratorySentTo || "").trim();
  if (!legacyValue) {
    return [];
  }

  return PATHOLOGY_LAB_SET.has(legacyValue)
    ? [legacyValue as PathologyLabOption]
    : [];
};

export const formatPathologyLaboratorySelection = (
  selections: unknown,
  otherLaboratory?: unknown,
  legacyLaboratorySentTo?: unknown,
) => {
  const normalizedSelections = normalizePathologyLabSelections(
    selections,
    legacyLaboratorySentTo,
  );

  if (normalizedSelections.length > 0) {
    return normalizedSelections
      .map((selection) => {
        if (selection === "Other") {
          const otherText = String(otherLaboratory || "").trim();
          return otherText ? `Other: ${otherText}` : "Other";
        }

        return selection;
      })
      .join(", ");
  }

  return String(legacyLaboratorySentTo || "").trim();
};

export interface DiagramLegendItem {
  color: string;
  label: string;
}

const DEFAULT_LEGEND_COLOR = "#6b7280";
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const normalizeLegendColor = (value: unknown) => {
  const normalized = String(value || "").trim();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : DEFAULT_LEGEND_COLOR;
};

export const normalizeDiagramLegendItems = (value: unknown): DiagramLegendItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        const label = entry.trim();
        if (!label) {
          return null;
        }

        return {
          color: DEFAULT_LEGEND_COLOR,
          label,
        };
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const label = String((entry as { label?: unknown }).label || "").trim();
      if (!label) {
        return null;
      }

      const color = normalizeLegendColor((entry as { color?: unknown }).color);
      return {
        color,
        label,
      };
    })
    .filter((entry): entry is DiagramLegendItem => Boolean(entry));
};

export const filterFilledEntries = <T extends { value?: unknown }>(entries: T[]) =>
  entries.filter((entry) => {
    if (Array.isArray(entry.value)) {
      return entry.value.length > 0;
    }

    return hasText(entry.value) || typeof entry.value === "number";
  });

const PDF_EMPTY_EQUIVALENTS = new Set([
  "",
  "n/a",
  "na",
  "n\\a",
  "_",
  "__",
  "___",
  "____",
  "_____",
]);

const normalizePdfToken = (value: unknown) =>
  String(value === undefined || value === null ? "" : value)
    .trim()
    .toLowerCase();

export const hasPdfDisplayValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some((entry) => hasPdfDisplayValue(entry));
  }

  if (typeof value === "number") {
    return true;
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (value === undefined || value === null) {
    return false;
  }

  const normalized = normalizePdfToken(value);
  if (!normalized) {
    return false;
  }

  if (/^_+$/.test(normalized)) {
    return false;
  }

  return !PDF_EMPTY_EQUIVALENTS.has(normalized);
};

const normalizePdfFieldLabel = (label: unknown) =>
  String(label === undefined || label === null ? "" : label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const isPostPreoperativeAlwaysVisibleField = (label: unknown): boolean => {
  return false;
};

export const shouldRenderPostPreoperativeField = (label: unknown, value: unknown): boolean =>
  hasPdfDisplayValue(value) || isPostPreoperativeAlwaysVisibleField(label);

export const isPreoperativeSectionTitle = (title: unknown): boolean => {
  const normalized = normalizePdfFieldLabel(title);
  if (!normalized) {
    return false;
  }

  return normalized.includes("preoperative") || normalized.includes("perioperative");
};
