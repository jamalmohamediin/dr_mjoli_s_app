import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Camera, Microscope } from "lucide-react";
import { PatientInfoForm } from "@/components/PatientInfoForm";
import { AnatomyDiagram } from "@/components/AnatomyDiagram";
import { ReportPreview } from "@/components/ReportPreview";
import { MediaUpload } from "@/components/MediaUpload";

const Index = () => {
  const [currentReport, setCurrentReport] = useState({
    patientInfo: {} as any,
    gastroscopyFindings: {} as any,
    colonoscopyFindings: {} as any,
    media: [] as any[],
    notes: ""
  });

  const updateReport = (section: keyof typeof currentReport, data: any) => {
    setCurrentReport(prev => ({
      ...prev,
      [section]: section === 'media' ? data : { ...prev[section], ...data }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-medical-blue-light">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Gastroenterology Report System
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive endoscopic procedure documentation
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2">
            <Card className="p-6 shadow-lg border-medical-blue-light">
              <Tabs defaultValue="patient" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="patient" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Patient Info
                  </TabsTrigger>
                  <TabsTrigger value="gastroscopy" className="flex items-center gap-2">
                    <Microscope className="h-4 w-4" />
                    Gastroscopy
                  </TabsTrigger>
                  <TabsTrigger value="colonoscopy" className="flex items-center gap-2">
                    <Microscope className="h-4 w-4" />
                    Colonoscopy
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="patient" className="space-y-6">
                  <PatientInfoForm 
                    onUpdate={(data) => updateReport('patientInfo', data)}
                  />
                </TabsContent>

                <TabsContent value="gastroscopy" className="space-y-6">
                  <AnatomyDiagram 
                    type="gastroscopy"
                    onUpdate={(data) => updateReport('gastroscopyFindings', data)}
                  />
                </TabsContent>

                <TabsContent value="colonoscopy" className="space-y-6">
                  <AnatomyDiagram 
                    type="colonoscopy"
                    onUpdate={(data) => updateReport('colonoscopyFindings', data)}
                  />
                </TabsContent>

                <TabsContent value="media" className="space-y-6">
                  <MediaUpload 
                    onUpdate={(data) => updateReport('media', data)}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Report Preview */}
          <div className="xl:col-span-1">
            <Card className="p-6 shadow-lg border-medical-blue-light sticky top-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-primary">Live Report</h3>
                <Button variant="outline" size="sm">
                  Export PDF
                </Button>
              </div>
              <ReportPreview report={currentReport} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;