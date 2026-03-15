import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, "0"));

const parseTimeValue = (value?: string) => {
  const match = String(value || "").match(/^(\d{2}):(\d{2})/);
  return {
    hour: match?.[1] || "",
    minute: match?.[2] || "",
  };
};

const parseDateTimeValue = (value?: string) => {
  const raw = String(value || "");
  const [datePart = "", timePart = ""] = raw.split("T");
  const { hour, minute } = parseTimeValue(timePart);

  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : "",
    time: hour && minute ? `${hour}:${minute}` : "",
  };
};

const formatIsoDateToDisplay = (value?: string) => {
  const raw = String(value || "").trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  const displayMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (displayMatch) {
    return raw;
  }

  return "";
};

const buildDisplayDateValue = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
};

const convertDisplayDateToIso = (value: string) => {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    return "";
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
};

interface Time24HourInputProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  hourAriaLabel?: string;
  minuteAriaLabel?: string;
}

export const Time24HourInput = ({
  value = "",
  onChange,
  className,
  disabled,
  hourAriaLabel = "Hour",
  minuteAriaLabel = "Minute",
}: Time24HourInputProps) => {
  const { hour, minute } = parseTimeValue(value);

  const updateHour = (nextHour: string) => {
    if (!nextHour) {
      onChange("");
      return;
    }

    onChange(`${nextHour}:${minute || "00"}`);
  };

  const updateMinute = (nextMinute: string) => {
    if (!nextMinute) {
      onChange("");
      return;
    }

    onChange(`${hour || "00"}:${nextMinute}`);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <select
        aria-label={hourAriaLabel}
        className="glass-input h-10 min-w-[5.5rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        disabled={disabled}
        onChange={(event) => updateHour(event.target.value)}
        value={hour}
      >
        <option value="">HH</option>
        {HOURS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm font-medium text-gray-600">:</span>
      <select
        aria-label={minuteAriaLabel}
        className="glass-input h-10 min-w-[5.5rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        disabled={disabled}
        onChange={(event) => updateMinute(event.target.value)}
        value={minute}
      >
        <option value="">MM</option>
        {MINUTES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

interface DateDDMMYYYYInputProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export const DateDDMMYYYYInput = ({
  value = "",
  onChange,
  className,
  disabled,
  ariaLabel = "Date",
}: DateDDMMYYYYInputProps) => {
  const [displayValue, setDisplayValue] = React.useState(formatIsoDateToDisplay(value));

  React.useEffect(() => {
    setDisplayValue(formatIsoDateToDisplay(value));
  }, [value]);

  const handleChange = (nextValue: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(nextValue)) {
      setDisplayValue(formatIsoDateToDisplay(nextValue));
      onChange(nextValue);
      return;
    }

    const formattedValue = buildDisplayDateValue(nextValue);
    setDisplayValue(formattedValue);

    if (!formattedValue) {
      onChange("");
      return;
    }

    const isoValue = convertDisplayDateToIso(formattedValue);
    if (isoValue) {
      onChange(isoValue);
    }
  };

  const handleBlur = () => {
    if (!displayValue) {
      return;
    }

    const isoValue = convertDisplayDateToIso(displayValue);
    if (!isoValue) {
      setDisplayValue(formatIsoDateToDisplay(value));
    }
  };

  return (
    <Input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      inputMode="numeric"
      onBlur={handleBlur}
      onChange={(event) => handleChange(event.target.value)}
      placeholder="DD-MM-YYYY"
      value={displayValue}
    />
  );
};

interface DateTime24HourInputProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const DateTime24HourInput = ({
  value = "",
  onChange,
  className,
  disabled,
}: DateTime24HourInputProps) => {
  const { date, time } = parseDateTimeValue(value);

  const updateDate = (nextDate: string) => {
    if (!nextDate) {
      onChange("");
      return;
    }

    onChange(`${nextDate}T${time || "00:00"}`);
  };

  const updateTime = (nextTime: string) => {
    if (!date) {
      return;
    }

    onChange(`${date}T${nextTime || "00:00"}`);
  };

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <Input
        className="w-full"
        disabled={disabled}
        lang="en-GB"
        onChange={(event) => updateDate(event.target.value)}
        type="date"
        value={date}
      />
      <Time24HourInput
        className="w-full"
        disabled={disabled}
        hourAriaLabel="Hour"
        minuteAriaLabel="Minute"
        onChange={updateTime}
        value={time}
      />
    </div>
  );
};

interface DateTimeDDMMYYYY24HourInputProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const DateTimeDDMMYYYY24HourInput = ({
  value = "",
  onChange,
  className,
  disabled,
}: DateTimeDDMMYYYY24HourInputProps) => {
  const { date, time } = parseDateTimeValue(value);

  const updateDate = (nextDate: string) => {
    if (!nextDate) {
      onChange("");
      return;
    }

    onChange(`${nextDate}T${time || "00:00"}`);
  };

  const updateTime = (nextTime: string) => {
    if (!date) {
      return;
    }

    onChange(`${date}T${nextTime || "00:00"}`);
  };

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <DateDDMMYYYYInput
        ariaLabel="Date"
        className="w-full"
        disabled={disabled}
        onChange={updateDate}
        value={date}
      />
      <Time24HourInput
        className="w-full"
        disabled={disabled}
        hourAriaLabel="Hour"
        minuteAriaLabel="Minute"
        onChange={updateTime}
        value={time}
      />
    </div>
  );
};
