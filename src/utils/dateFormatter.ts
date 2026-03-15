export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Get the day with proper padding
  const day = d.getDate().toString().padStart(2, '0');
  
  // Get the month name in uppercase
  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];
  const month = months[d.getMonth()];
  
  // Get the year
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const dateStr = formatDate(d);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${dateStr} at ${hours}:${minutes}`;
};

export const formatDateWithSuffix = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}${suffix} ${month} ${year} at ${hours}H${minutes}`;
};

// Helper function to get ordinal suffix
const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Convert datetime-local input value to proper Date object
export const getLocalDateTimeValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Format date for display in reports - same format as headers/footers
export const formatReportDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}${suffix} ${month} ${year} at ${hours}H${minutes}`;
};

// Format date only (for date of birth) - no time
export const formatDateOnly = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  
  return `${day}${suffix} ${month} ${year}`;
};

// Format date in dd/mm/yyyy format (for date of birth display)
export const formatDateDDMMYYYY = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const formatDateDDMMYYYYWithDashes = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

export const formatDateTimeDDMMYYYYWithDashes = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(d.getTime())) {
    return '';
  }

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');

  return `${formatDateDDMMYYYYWithDashes(d)} ${hours}:${minutes}`;
};

// Format date for filename (replace invalid filename characters)
export const formatDOBForFilename = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

// Format date and time with colon separator (for PDF signatures)
export const formatDateTimeWithColon = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate();
  const suffix = getOrdinalSuffix(day);
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}${suffix} ${month} ${year} at ${hours}:${minutes}`;
};
