import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hasText, toArray, toUiTitleCase, toggleArrayValue } from "@/utils/templateDataHelpers";

interface MultiValueTextFieldProps {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}

export const MultiValueTextField = ({
  label,
  values,
  placeholder,
  onChange,
}: MultiValueTextFieldProps) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-gray-700">{toUiTitleCase(label)}</Label>
    {(values.length > 0 ? values : [""]).map((value, index) => (
      <div key={`${label}-${index}`} className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(event) => {
            const nextValues = [...(values.length > 0 ? values : [""])];
            nextValues[index] = event.target.value;
            onChange(nextValues);
          }}
          placeholder={toUiTitleCase(placeholder)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...(values.length > 0 ? values : [""]), ""])}
        >
          +
        </Button>
        {(values.length > 1 || (values.length === 0 && index === 0)) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange(
                (values.length > 0 ? values : [""]).filter((_, itemIndex) => itemIndex !== index) || [""],
              )
            }
          >
            -
          </Button>
        )}
      </div>
    ))}
  </div>
);

interface CheckboxGridProps {
  label: string;
  options: string[];
  values: unknown;
  onChange: (values: string[]) => void;
  columns?: string;
}

export const CheckboxGrid = ({
  label,
  options,
  values,
  onChange,
  columns = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
}: CheckboxGridProps) => {
  const selectedValues = toArray(values);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{toUiTitleCase(label)}</Label>
      <div className={`grid gap-2 ${columns}`}>
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <Checkbox
              checked={selectedValues.includes(option)}
              onCheckedChange={() => onChange(toggleArrayValue(selectedValues, option))}
            />
            <span>{toUiTitleCase(option)}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

interface RadioGridProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  columns?: string;
}

export const RadioGrid = ({
  label,
  options,
  value,
  onChange,
  columns = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
}: RadioGridProps) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-gray-700">{toUiTitleCase(label)}</Label>
    <div className={`grid gap-2 ${columns}`}>
      {options.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm text-gray-700"
        >
          <input
            type="radio"
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <span>{toUiTitleCase(option)}</span>
        </label>
      ))}
    </div>
  </div>
);

interface OptionalOtherInputProps {
  enabled: boolean;
  label?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export const OptionalOtherInput = ({
  enabled,
  label = "Other",
  value,
  placeholder,
  onChange,
}: OptionalOtherInputProps) =>
  enabled ? (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{toUiTitleCase(label)}</Label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={toUiTitleCase(placeholder)}
      />
    </div>
  ) : null;

interface LabeledTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export const LabeledTextarea = ({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: LabeledTextareaProps) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-gray-700">{toUiTitleCase(label)}</Label>
    <Textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={toUiTitleCase(placeholder)}
    />
  </div>
);

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export const LabeledInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: LabeledInputProps) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-gray-700">{toUiTitleCase(label)}</Label>
    <Input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={toUiTitleCase(placeholder)}
    />
  </div>
);

interface SavedValueHintProps {
  label: string;
  value: unknown;
}

export const SavedValueHint = ({ label, value }: SavedValueHintProps) =>
  hasText(value) ? (
    <p className="text-xs text-gray-500">
      {toUiTitleCase(label)}: {String(value)}
    </p>
  ) : null;
