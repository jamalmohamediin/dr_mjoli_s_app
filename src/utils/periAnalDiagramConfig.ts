import sagittalDiagram from "@/assets/peri-anal-sagittal.jpg";
import externalDiagram from "@/assets/peri-anal-external.jpg";
import lithotomyDiagram from "@/assets/peri-anal-lithotomy.jpg";
import clockDiagram from "@/assets/peri-anal-clock.jpg";

export const PERI_ANAL_DIAGRAM_VARIANTS = [
  {
    key: "sagittalAnalCanal",
    label: "Sagittal Anal Canal Anatomy",
    image: sagittalDiagram,
  },
  {
    key: "externalPerianalSkin",
    label: "External Perianal Skin View",
    image: externalDiagram,
  },
  {
    key: "lithotomyPosition",
    label: "Lithotomy Position View",
    image: lithotomyDiagram,
  },
  {
    key: "analClock",
    label: "Anal Clock Diagram",
    image: clockDiagram,
  },
] as const;

export type PeriAnalDiagramVariantKey = (typeof PERI_ANAL_DIAGRAM_VARIANTS)[number]["key"];

export const DEFAULT_PERI_ANAL_DIAGRAM_VARIANT: PeriAnalDiagramVariantKey =
  PERI_ANAL_DIAGRAM_VARIANTS[0].key;

export const periAnalDiagramImages = Object.fromEntries(
  PERI_ANAL_DIAGRAM_VARIANTS.map((variant) => [variant.key, variant.image]),
) as Record<PeriAnalDiagramVariantKey, string>;

export const periAnalDiagramLabels = Object.fromEntries(
  PERI_ANAL_DIAGRAM_VARIANTS.map((variant) => [variant.key, variant.label]),
) as Record<PeriAnalDiagramVariantKey, string>;

export const createInitialPeriAnalDiagramMarkings = () =>
  Object.fromEntries(
    PERI_ANAL_DIAGRAM_VARIANTS.map((variant) => [variant.key, []]),
  ) as Record<PeriAnalDiagramVariantKey, any[]>;
