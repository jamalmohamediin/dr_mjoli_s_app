import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientRecord, PatientSummary, TemplateType, getTemplateLabel } from "@/utils/patientRecords";

interface ReportsTabProps {
  patients: PatientSummary[];
  records: PatientRecord[];
  onOpenProcedureFilter: (procedureFilter: string) => void;
}

const TEMPLATE_ORDER: TemplateType[] = [
  "appendectomy",
  "ventralHernia",
  "rectalCancer",
  "smallBowel",
  "cholecystectomy",
  "periAnal",
  "procedure",
];

export const ReportsTab = ({
  patients,
  records,
  onOpenProcedureFilter,
}: ReportsTabProps) => {
  const activePatients = patients.filter((patient) => !patient.deletedAt);
  const activeRecords = records.filter((record) => !record.deletedAt);

  const procedureCounts = TEMPLATE_ORDER.map((templateType) => ({
    templateType,
    label: getTemplateLabel(templateType),
    count: activeRecords.filter((record) => record.templateType === templateType).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="shadow-glass-heavy">
          <CardHeader>
            <CardTitle className="text-base">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{activePatients.length}</p>
            <p className="text-sm text-gray-600">
              Unique patients with at least one active saved record.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glass-heavy">
          <CardHeader>
            <CardTitle className="text-base">Total Saved Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{activeRecords.length}</p>
            <p className="text-sm text-gray-600">
              Saved templates across all procedures and return visits.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glass-heavy">
          <CardHeader>
            <CardTitle className="text-base">Repeat Visit Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">
              {activePatients.filter((patient) => patient.totalRecords > 1).length}
            </p>
            <p className="text-sm text-gray-600">
              Patients who already have more than one saved entry.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-glass-heavy">
        <CardHeader>
          <CardTitle>Operation Counts By Template</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {procedureCounts.map((item) => (
            <button
              key={item.templateType}
              type="button"
              className="rounded-xl border border-white/50 bg-white/60 p-4 text-left transition hover:bg-white/75"
              onClick={() => onOpenProcedureFilter(item.templateType)}
            >
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{item.count}</p>
              <p className="mt-3 text-sm text-gray-600">Open these records in Patients</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
