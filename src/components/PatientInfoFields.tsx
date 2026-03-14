import { ChangeEvent, useRef } from "react";
import { Upload, Camera, Loader2, RotateCcw, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ASAClassificationSection } from "@/components/ASAClassificationSection";
import {
  createEmptyPatientStickerPatch,
  formatPatientStickerDate,
  hasExtractedPatientStickerData,
  hasPatientStickerMode,
  normalizePatientInfo,
  normalizePatientStickerPayload,
} from "@/utils/patientSticker";

interface PatientInfoFieldsProps {
  patientInfo?: any;
  onFieldChange: (field: string, value: string) => void;
  onBulkUpdate?: (updates: Record<string, any>) => void;
  currentExtractedPatientInfo?: any;
  onCurrentPatientChange?: (patientInfo: any) => void;
  useDisplayText?: boolean;
}

const createThumbnailDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 320;
        const scale = Math.min(1, maxWidth / image.width);
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Preview context could not be created"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.onerror = () => reject(new Error("Preview image could not be loaded"));
      image.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Sticker image could not be read"));
    reader.readAsDataURL(file);
  });

export const PatientInfoFields = ({
  patientInfo,
  onFieldChange,
  onBulkUpdate,
  currentExtractedPatientInfo,
  onCurrentPatientChange,
}: PatientInfoFieldsProps) => {
  const normalizedInfo = normalizePatientInfo(patientInfo);
  const normalizedCurrentExtractedPatient = normalizePatientInfo(currentExtractedPatientInfo);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const lastSelectedFileRef = useRef<File | null>(null);
  const webhookUrl = import.meta.env.VITE_N8N_PATIENT_STICKER_WEBHOOK_URL;
  const stickerMode = hasPatientStickerMode(normalizedInfo);
  const isExtracting = normalizedInfo.stickerExtractionStatus === "extracting";
  const canAutofillExtractedPatient = hasExtractedPatientStickerData(
    normalizedCurrentExtractedPatient,
  );

  const syncCurrentPatient = (nextInfo: any) => {
    if (onCurrentPatientChange && hasExtractedPatientStickerData(nextInfo)) {
      onCurrentPatientChange(nextInfo);
    }
  };

  const applyUpdates = (updates: Record<string, any>) => {
    const nextInfo = normalizePatientInfo({ ...normalizedInfo, ...updates });

    if (onBulkUpdate) {
      onBulkUpdate(updates);
    } else {
      Object.entries(updates).forEach(([field, value]) => {
        onFieldChange(field, value);
      });
    }

    syncCurrentPatient(nextInfo);
  };

  const handleBaseChange = (field: string, value: string) => {
    const nextInfo = normalizePatientInfo({ ...normalizedInfo, [field]: value });
    onFieldChange(field, value);
    syncCurrentPatient(nextInfo);
  };

  const extractSticker = async (file: File) => {
    if (!webhookUrl) {
      toast.error("Patient sticker webhook URL is not configured.");
      applyUpdates({
        stickerMode: true,
        stickerImageName: file.name,
        stickerExtractionStatus: "error",
        stickerExtractionError: "Missing VITE_N8N_PATIENT_STICKER_WEBHOOK_URL",
      });
      return;
    }

    try {
      const stickerImageData = await createThumbnailDataUrl(file);
      lastSelectedFileRef.current = file;

      applyUpdates({
        stickerMode: true,
        stickerImageName: file.name,
        stickerImageData,
        stickerExtractionStatus: "extracting",
        stickerExtractionError: "",
      });

      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 45000);

      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      window.clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Sticker extraction failed (${response.status})`);
      }

      const payload = await response.json();
      if (payload?.success === false) {
        throw new Error(payload?.error || payload?.message || "Sticker extraction failed");
      }

      const extracted = normalizePatientStickerPayload(payload);
      applyUpdates({
        ...extracted,
        stickerMode: true,
        stickerImageName: file.name,
        stickerImageData,
        stickerExtractionStatus: "success",
        stickerExtractionError: "",
        stickerLastExtractedAt: new Date().toISOString(),
      });

      toast.success("Patient sticker extracted successfully.");
    } catch (error: any) {
      const message =
        error?.name === "AbortError"
          ? "Sticker extraction timed out."
          : error?.message || "Sticker extraction failed.";

      applyUpdates({
        stickerMode: true,
        stickerExtractionStatus: "error",
        stickerExtractionError: message,
      });

      toast.error(message);
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file for the patient sticker.");
      event.target.value = "";
      return;
    }

    await extractSticker(file);
    event.target.value = "";
  };

  const reExtractSticker = async () => {
    if (!lastSelectedFileRef.current) {
      toast.error("Select the sticker image again to re-extract it.");
      return;
    }

    await extractSticker(lastSelectedFileRef.current);
  };

  const clearStickerData = () => {
    applyUpdates(createEmptyPatientStickerPatch());
    lastSelectedFileRef.current = null;
    toast.success("Patient sticker data cleared.");
  };

  const autofillExtractedPatientDetails = () => {
    if (!canAutofillExtractedPatient) {
      toast.error("No extracted patient sticker details are available yet.");
      return;
    }

    applyUpdates({ ...normalizedCurrentExtractedPatient });
    toast.success("Extracted patient sticker details autofilled.");
  };

  const renderFieldRow = (label: string, field: string, input: React.ReactNode) => (
    <div className="grid grid-cols-2 gap-4 items-center" key={field}>
      <Label className="text-gray-800 font-medium">{label}</Label>
      {input}
    </div>
  );

  const renderExpandedFields = () => (
    <>
      <div className="pt-4 border-t space-y-4">
        <h4 className="text-sm font-semibold text-gray-800">Patient Details</h4>
        {renderFieldRow(
          "Patient Name:",
          "name",
          <Input
            value={normalizedInfo.name}
            onChange={(event) => handleBaseChange("name", event.target.value)}
            placeholder="Enter Patient Name"
          />,
        )}
        {renderFieldRow(
          "Patient ID:",
          "patientId",
          <Input
            value={normalizedInfo.patientId}
            onChange={(event) => handleBaseChange("patientId", event.target.value)}
            placeholder="Enter Patient ID"
          />,
        )}
        {renderFieldRow(
          "Gender:",
          "sex",
          <div className="space-y-2">
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={normalizedInfo.sex}
              onChange={(event) => {
                const value = event.target.value;
                handleBaseChange("sex", value);
                if (value !== "other") {
                  handleBaseChange("sexOther", "");
                }
              }}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {normalizedInfo.sex === "other" && (
              <Input
                value={normalizedInfo.sexOther}
                onChange={(event) => handleBaseChange("sexOther", event.target.value)}
                placeholder="Please specify"
              />
            )}
          </div>,
        )}
        {renderFieldRow(
          "Age:",
          "age",
          <Input
            value={normalizedInfo.age}
            onChange={(event) => handleBaseChange("age", event.target.value)}
            placeholder="Enter Age"
          />,
        )}
        {renderFieldRow(
          "Date Of Birth:",
          "dateOfBirth",
          <div className="w-full">
            <Input
              type="date"
              lang="en-GB"
              value={normalizedInfo.dateOfBirth}
              onChange={(event) => handleBaseChange("dateOfBirth", event.target.value)}
            />
            {normalizedInfo.dateOfBirth && (
              <p className="text-xs text-gray-500 mt-1">
                Display format: {formatPatientStickerDate(normalizedInfo.dateOfBirth)}
              </p>
            )}
          </div>,
        )}
        {renderFieldRow(
          "Address:",
          "address",
          <Textarea
            value={normalizedInfo.address}
            onChange={(event) => handleBaseChange("address", event.target.value)}
            placeholder="Enter Address"
            rows={2}
          />,
        )}
      </div>

      <div className="pt-4 border-t space-y-4">
        <h4 className="text-sm font-semibold text-gray-800">Medical Aid Details</h4>
        {renderFieldRow(
          "Medical Aid Name:",
          "medicalAidName",
          <Input
            value={normalizedInfo.medicalAidName}
            onChange={(event) => handleBaseChange("medicalAidName", event.target.value)}
            placeholder="Enter Medical Aid Name"
          />,
        )}
        {renderFieldRow(
          "Medical Aid Number:",
          "medicalAidNumber",
          <Input
            value={normalizedInfo.medicalAidNumber}
            onChange={(event) => handleBaseChange("medicalAidNumber", event.target.value)}
            placeholder="Enter Medical Aid Number"
          />,
        )}
        {renderFieldRow(
          "Main Member:",
          "mainMember",
          <Input
            value={normalizedInfo.mainMember}
            onChange={(event) => handleBaseChange("mainMember", event.target.value)}
            placeholder="Enter Main Member"
          />,
        )}
        {renderFieldRow(
          "Main Member ID:",
          "mainMemberId",
          <Input
            value={normalizedInfo.mainMemberId}
            onChange={(event) => handleBaseChange("mainMemberId", event.target.value)}
            placeholder="Enter Main Member ID"
          />,
        )}
        {renderFieldRow(
          "Authorization:",
          "authorization",
          <Input
            value={normalizedInfo.authorization}
            onChange={(event) => handleBaseChange("authorization", event.target.value)}
            placeholder="Enter Authorization"
          />,
        )}
        {renderFieldRow(
          "Work Number:",
          "workNumber",
          <Input
            value={normalizedInfo.workNumber}
            onChange={(event) => handleBaseChange("workNumber", event.target.value)}
            placeholder="Enter Work Number"
          />,
        )}
        {renderFieldRow(
          "Home Number:",
          "homeNumber",
          <Input
            value={normalizedInfo.homeNumber}
            onChange={(event) => handleBaseChange("homeNumber", event.target.value)}
            placeholder="Enter Home Number"
          />,
        )}
        {renderFieldRow(
          "Depend Code:",
          "dependCode",
          <Input
            value={normalizedInfo.dependCode}
            onChange={(event) => handleBaseChange("dependCode", event.target.value)}
            placeholder="Enter Depend Code"
          />,
        )}
      </div>

      <div className="pt-4 border-t space-y-4">
        <h4 className="text-sm font-semibold text-gray-800">Hospital Details</h4>
        {renderFieldRow(
          "Hospital Name:",
          "hospitalName",
          <Input
            value={normalizedInfo.hospitalName}
            onChange={(event) => handleBaseChange("hospitalName", event.target.value)}
            placeholder="Enter Hospital Name"
          />,
        )}
        {renderFieldRow(
          "Hospital Visit Number:",
          "hospitalVisitNumber",
          <Input
            value={normalizedInfo.hospitalVisitNumber}
            onChange={(event) => handleBaseChange("hospitalVisitNumber", event.target.value)}
            placeholder="Enter Hospital Visit Number"
          />,
        )}
        {renderFieldRow(
          "Doctor's Name:",
          "doctorName",
          <Input
            value={normalizedInfo.doctorName}
            onChange={(event) => handleBaseChange("doctorName", event.target.value)}
            placeholder="Enter Doctor's Name"
          />,
        )}
        {renderFieldRow(
          "Doctor's Practice Number:",
          "doctorPracticeNumber",
          <Input
            value={normalizedInfo.doctorPracticeNumber}
            onChange={(event) => handleBaseChange("doctorPracticeNumber", event.target.value)}
            placeholder="Enter Doctor's Practice Number"
          />,
        )}
        {renderFieldRow(
          "Date:",
          "visitDate",
          <div className="w-full">
            <Input
              type="date"
              lang="en-GB"
              value={normalizedInfo.visitDate}
              onChange={(event) => handleBaseChange("visitDate", event.target.value)}
            />
            {normalizedInfo.visitDate && (
              <p className="text-xs text-gray-500 mt-1">
                Display format: {formatPatientStickerDate(normalizedInfo.visitDate)}
              </p>
            )}
          </div>,
        )}
        {renderFieldRow(
          "Time:",
          "visitTime",
          <Input
            type="time"
            value={normalizedInfo.visitTime}
            onChange={(event) => handleBaseChange("visitTime", event.target.value)}
          />,
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">Patient Sticker Extraction</h4>
            <p className="text-xs text-gray-500 mt-1">
              Upload a patient sticker image or take a photo to autofill the expanded patient details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canAutofillExtractedPatient && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autofillExtractedPatientDetails}
                disabled={isExtracting}
              >
                Autofill Extracted Patient Sticker Details
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isExtracting}
            >
              <Upload className="h-4 w-4 mr-2" />
              {stickerMode ? "Replace" : "Upload Image"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isExtracting}
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            {stickerMode && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={reExtractSticker}
                  disabled={isExtracting}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-extract
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearStickerData}
                  disabled={isExtracting}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Sticker Data
                </Button>
              </>
            )}
          </div>
        </div>

        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelection}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelection}
        />

        {(normalizedInfo.stickerImageName || normalizedInfo.stickerExtractionError || normalizedInfo.stickerImageData) && (
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            {normalizedInfo.stickerImageData && (
              <img
                src={normalizedInfo.stickerImageData}
                alt="Patient sticker preview"
                className="w-24 h-24 object-cover rounded border"
              />
            )}
            <div className="space-y-1 text-sm">
              {normalizedInfo.stickerImageName && (
                <p className="text-gray-700">
                  <span className="font-medium">Image:</span> {normalizedInfo.stickerImageName}
                </p>
              )}
              {normalizedInfo.stickerExtractionStatus === "extracting" && (
                <p className="text-blue-600 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting sticker details...
                </p>
              )}
              {normalizedInfo.stickerExtractionStatus === "success" && (
                <p className="text-green-600">Sticker details extracted successfully.</p>
              )}
              {normalizedInfo.stickerExtractionError && (
                <p className="text-red-600">{normalizedInfo.stickerExtractionError}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {stickerMode ? (
        renderExpandedFields()
      ) : (
        <>
          {renderFieldRow(
            "Patient Name:",
            "name",
            <Input
              value={normalizedInfo.name}
              onChange={(event) => handleBaseChange("name", event.target.value)}
              placeholder="Enter Patient Name"
            />,
          )}
          {renderFieldRow(
            "Patient ID:",
            "patientId",
            <Input
              value={normalizedInfo.patientId}
              onChange={(event) => handleBaseChange("patientId", event.target.value)}
              placeholder="Enter Patient ID"
            />,
          )}
          {renderFieldRow(
            "Date Of Birth (dd/mm/yyyy):",
            "dateOfBirth",
            <div className="w-full">
              <Input
                type="date"
                lang="en-GB"
                value={normalizedInfo.dateOfBirth}
                onChange={(event) => handleBaseChange("dateOfBirth", event.target.value)}
              />
              {normalizedInfo.dateOfBirth && (
                <p className="text-xs text-gray-500 mt-1">
                  Display format: {formatPatientStickerDate(normalizedInfo.dateOfBirth)}
                </p>
              )}
            </div>,
          )}
          {renderFieldRow(
            "Age:",
            "age",
            <Input
              className="bg-gray-100"
              value={normalizedInfo.age}
              onChange={(event) => handleBaseChange("age", event.target.value)}
              placeholder="Calculated from the Date Of Birth"
              readOnly
            />,
          )}
          {renderFieldRow(
            "Sex:",
            "sex",
            <div className="space-y-2">
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={normalizedInfo.sex}
                onChange={(event) => {
                  const value = event.target.value;
                  handleBaseChange("sex", value);
                  if (value !== "other") {
                    handleBaseChange("sexOther", "");
                  }
                }}
              >
                <option value="">Select Sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {normalizedInfo.sex === "other" && (
                <Input
                  value={normalizedInfo.sexOther}
                  onChange={(event) => handleBaseChange("sexOther", event.target.value)}
                  placeholder="Please Specify"
                />
              )}
            </div>,
          )}
        </>
      )}

      {renderFieldRow(
        "Weight:",
        "weight",
        <Input
          value={normalizedInfo.weight}
          onChange={(event) => handleBaseChange("weight", event.target.value)}
          placeholder="Enter Weight (Kg)"
        />,
      )}
      {renderFieldRow(
        "Height:",
        "height",
        <Input
          value={normalizedInfo.height}
          onChange={(event) => handleBaseChange("height", event.target.value)}
          placeholder="Enter Height (Cm)"
        />,
      )}
      {renderFieldRow(
        "BMI:",
        "bmi",
        <Input
          className="bg-gray-100"
          value={normalizedInfo.bmi}
          placeholder="Calculated from Height and Weight"
          readOnly
        />,
      )}

      <ASAClassificationSection
        selectedASA={normalizedInfo.asaScore}
        onASAChange={(value) => handleBaseChange("asaScore", value)}
        notes={normalizedInfo.asaNotes}
        onNotesChange={(value) => handleBaseChange("asaNotes", value)}
        showNotes={true}
      />
    </div>
  );
};
