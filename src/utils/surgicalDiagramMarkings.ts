export interface SurgicalDiagramMarkingMetrics {
  scale: number;
  portFontSize: number;
  portHalfLength: number;
  portLabelOffset: number;
  portLineWidth: number;
  stomaRadius: number;
  ileostomyLineWidth: number;
  colostomyLineWidth: number;
  ileostomyDash: [number, number];
  incisionLineWidth: number;
  incisionDash: [number, number];
}

export const getSurgicalDiagramMarkingMetrics = (
  markingScale = 1,
): SurgicalDiagramMarkingMetrics => {
  const scale = Number.isFinite(markingScale) && markingScale > 0 ? markingScale : 1;

  return {
    scale,
    portFontSize: Math.max(12, Math.round(11 * scale)),
    portHalfLength: 11 * scale,
    portLabelOffset: 4 * scale,
    portLineWidth: Math.max(3, 2.5 * scale),
    stomaRadius: 18 * scale,
    ileostomyLineWidth: Math.max(3, 2.25 * scale),
    colostomyLineWidth: Math.max(5, 4.25 * scale),
    ileostomyDash: [6 * scale, 4 * scale],
    incisionLineWidth: Math.max(3, 2.25 * scale),
    incisionDash: [10 * scale, 7 * scale],
  };
};
