export const asaClassDescriptions: Record<string, string> = {
  'I': 'Normal Healthy Patient',
  'II': 'Mild Systemic Disease',
  'III': 'Severe Systemic Disease Limiting Activity',
  'IV': 'Severe Disease Constant Threat to Life',
  'V': 'Moribund, Not Expected to Survive Without Operation',
  'VI': 'Brain-Dead, Organ Donor'
};

export const getASADescription = (asaClass: string): string => {
  return asaClassDescriptions[asaClass] || '';
};

export const getFullASAText = (asaClass: string): string => {
  const description = getASADescription(asaClass);
  return description ? `ASA ${asaClass} - ${description}` : `ASA ${asaClass}`;
};