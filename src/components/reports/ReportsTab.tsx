import { Button } from "@/components/ui/button";
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
            <p className="text-sm text-gray-600">Active patient summaries currently in the app.</p>
          </CardContent>
        </Card>

        <Card className="shadow-glass-heavy">
          <CardHeader>
            <CardTitle className="text-base">Total Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{activeRecords.length}</p>
            <p className="text-sm text-gray-600">
              Saved template records across all procedures.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glass-heavy">
          <CardHeader>
            <CardTitle className="text-base">Patients With Repeat Visits</CardTitle>
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
          <CardTitle>Operation Counts</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {procedureCounts.map((item) => (
            <button
              key={item.templateType}
              className="rounded-xl border border-white/50 bg-white/60 p-4 text-left transition hover:bg-white/75"
              onClick={() => onOpenProcedureFilter(item.templateType)}
              type="button"
            >
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{item.count}</p>
              <div className="mt-3 inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm">
                View In Patients
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
