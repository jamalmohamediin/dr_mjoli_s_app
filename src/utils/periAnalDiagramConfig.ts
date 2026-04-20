import sagittalDiagram from "@/assets/peri-anal-sagittal-replacement.png";
import externalDiagram from "@/assets/peri-anal-external-perianal-docx.png";
import lithotomyDiagram from "@/assets/peri-anal-external-replacement.png";
import clockDiagram from "@/assets/peri-anal-anal-clock-docx.png";

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
    label: "Coronal View of the Anus",
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
