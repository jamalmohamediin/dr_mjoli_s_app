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
