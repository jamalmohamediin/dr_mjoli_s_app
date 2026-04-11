type PickerEnabledInput = HTMLInputElement & {
  showPicker?: () => void;
};

export const VISUALLY_HIDDEN_FILE_INPUT_CLASS =
  "absolute -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0";

export const DOCUMENT_UPLOAD_ACCEPT = [
  "image/*",
  "video/*",
  "application/pdf",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
].join(",");

export const openNativeFilePicker = (input: HTMLInputElement | null) => {
  if (!input) {
    return;
  }

  const pickerInput = input as PickerEnabledInput;

  try {
    pickerInput.value = "";
  } catch {
    // Keep going even if the browser blocks resetting the input value.
  }

  if (typeof pickerInput.showPicker === "function") {
    try {
      pickerInput.showPicker();
      return;
    } catch {
      // Fall back to click() below when showPicker is unsupported or blocked.
    }
  }

  pickerInput.click();
};
