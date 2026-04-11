import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Camera, FileText, Image, Video, File, Download, Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DOCUMENT_UPLOAD_ACCEPT,
  openNativeFilePicker,
  VISUALLY_HIDDEN_FILE_INPUT_CLASS,
} from "@/utils/fileInputs";

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: Date;
}

interface DocumentUploadProps {
  onUpdate: (documents: UploadedDocument[]) => void;
}

export const DocumentUpload = ({ onUpdate }: DocumentUploadProps) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [viewingDocument, setViewingDocument] = useState<UploadedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const appendDocuments = (newDocuments: UploadedDocument[]) => {
    setDocuments((prev) => {
      const updatedDocuments = [...prev, ...newDocuments];
      onUpdate(updatedDocuments);
      return updatedDocuments;
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDocument: UploadedDocument = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          url: e.target?.result as string,
          uploadDate: new Date()
        };

        appendDocuments([newDocument]);
      };
      reader.readAsDataURL(file);
    });

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const removeDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    onUpdate(updatedDocuments);
  };

  const downloadDocument = (document: UploadedDocument) => {
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewDocument = (document: UploadedDocument) => {
    setViewingDocument(document);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => openNativeFilePicker(fileInputRef.current)}
          className="glass-button flex items-center gap-2 text-xs"
        >
          <Upload className="h-3 w-3" />
          Upload Documents & Media
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => openNativeFilePicker(cameraInputRef.current)}
          className="glass-button flex items-center gap-2 text-xs"
        >
          <Camera className="h-3 w-3" />
          Take Photo
        </Button>
        
        {documents.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setViewingDocument(documents[0])}
            className="glass-button flex items-center gap-2 text-xs"
          >
            <Eye className="h-3 w-3" />
            View Documents & Media
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={DOCUMENT_UPLOAD_ACCEPT}
        onChange={handleFileSelect}
        className={VISUALLY_HIDDEN_FILE_INPUT_CLASS}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className={VISUALLY_HIDDEN_FILE_INPUT_CLASS}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Documents List */}
      {documents.length > 0 && (
        <Card className="glass-card-light">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-black mb-3">Uploaded Documents & Media ({documents.length})</h4>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-black truncate">{doc.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {doc.type.split('/')[0] || 'file'}
                        </Badge>
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{doc.uploadDate.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewDocument(doc)}
                      className="text-xs"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc)}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl max-w-6xl max-h-[90vh] w-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {getFileIcon(viewingDocument.type)}
                <div>
                  <h3 className="font-semibold text-black">{viewingDocument.name}</h3>
                  <p className="text-sm text-gray-600">
                    {viewingDocument.type} • {formatFileSize(viewingDocument.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadDocument(viewingDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingDocument(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {viewingDocument.type.startsWith('image/') ? (
                <img
                  src={viewingDocument.url}
                  alt={viewingDocument.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : viewingDocument.type.startsWith('video/') ? (
                <video
                  src={viewingDocument.url}
                  controls
                  className="max-w-full h-auto mx-auto"
                />
              ) : viewingDocument.type.includes('pdf') ? (
                <iframe
                  src={viewingDocument.url}
                  className="w-full h-96"
                  title={viewingDocument.name}
                />
              ) : (
                <div className="text-center py-8">
                  <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Preview not available for this file type.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Use the download button to view the file externally.
                  </p>
                </div>
              )}
            </div>
            
            {/* Navigation between documents */}
            {documents.length > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentIndex = documents.findIndex(d => d.id === viewingDocument.id);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : documents.length - 1;
                    setViewingDocument(documents[prevIndex]);
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  {documents.findIndex(d => d.id === viewingDocument.id) + 1} of {documents.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentIndex = documents.findIndex(d => d.id === viewingDocument.id);
                    const nextIndex = currentIndex < documents.length - 1 ? currentIndex + 1 : 0;
                    setViewingDocument(documents[nextIndex]);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
