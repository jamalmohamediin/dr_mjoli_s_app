import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportPreviewProps {
  report: {
    patientInfo: any;
    gastroscopyFindings: any;
    colonoscopyFindings: any;
    media: any[];
    notes: string;
  };
}

export const ReportPreview = ({ report }: ReportPreviewProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  const renderFindings = (findings: any, type: string) => {
    if (!findings?.findings || findings.findings.length === 0) {
      return <p className="text-muted-foreground text-sm">No {type.toLowerCase()} findings documented</p>;
    }

    return (
      <div className="space-y-2">
        {findings.findings.map((finding: any, index: number) => (
          <div key={finding.id} className="flex flex-wrap gap-1 text-sm">
            <Badge 
              variant={finding.type.includes('Normal') ? 'default' : 'destructive'}
              className="text-xs"
            >
              {finding.type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {finding.location}
            </Badge>
            {finding.description && (
              <span className="text-xs text-muted-foreground">
                - {finding.description}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-6 pr-4">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-primary">
            ENDOSCOPY REPORT
          </h3>
          <p className="text-sm text-muted-foreground">
            Generated: {new Date().toLocaleString('en-ZA')}
          </p>
        </div>

        <Separator />

        {/* Patient Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary">PATIENT INFORMATION</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Patient ID:</span>
              <span>{report.patientInfo.patientId || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{report.patientInfo.name || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Age:</span>
              <span>{report.patientInfo.age || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Gender:</span>
              <span className="capitalize">{report.patientInfo.gender || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{formatDate(report.patientInfo.date)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Clinical Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary">CLINICAL INFORMATION</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Procedure:</span>
              <p className="capitalize">{report.patientInfo.procedure || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-medium">Indication:</span>
              <p>{report.patientInfo.indication || 'Not specified'}</p>
            </div>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex justify-between">
                <span className="font-medium">Preparation:</span>
                <span className="capitalize">{report.patientInfo.preparation || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sedation:</span>
                <span>{report.patientInfo.sedation || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Gastroscopy Findings */}
        {(report.patientInfo.procedure === 'gastroscopy' || report.patientInfo.procedure === 'both') && (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">GASTROSCOPY FINDINGS</h4>
              {renderFindings(report.gastroscopyFindings, 'Gastroscopy')}
            </div>
            <Separator />
          </>
        )}

        {/* Colonoscopy Findings */}
        {(report.patientInfo.procedure === 'colonoscopy' || report.patientInfo.procedure === 'both') && (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">COLONOSCOPY FINDINGS</h4>
              {renderFindings(report.colonoscopyFindings, 'Colonoscopy')}
            </div>
            <Separator />
          </>
        )}

        {/* Media */}
        {report.media.length > 0 && (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">ATTACHED MEDIA</h4>
              <div className="grid grid-cols-2 gap-2">
                {report.media.map((item: any, index: number) => (
                  <div key={index} className="p-2 border rounded text-xs text-center">
                    {item.type?.includes('image') ? '📷' : '🎥'} {item.name || `File ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Summary */}
        <div className="space-y-3">
          <h4 className="font-semibold text-primary">CONCLUSION</h4>
          <p className="text-sm text-muted-foreground">
            {report.notes || 'Procedure completed successfully. Detailed findings documented above.'}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Dr. [Physician Name] - Gastroenterologist</p>
          <p>Practice Number: [Practice Number]</p>
          <p>Date of Report: {new Date().toLocaleDateString('en-ZA')}</p>
        </div>
      </div>
    </ScrollArea>
  );
};