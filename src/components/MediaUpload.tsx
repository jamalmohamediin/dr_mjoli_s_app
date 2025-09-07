import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Camera, Video, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  onUpdate: (data: any) => void;
}

interface MediaFile {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  preview?: string;
  description?: string;
}

export const MediaUpload = ({ onUpdate }: MediaUploadProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles: MediaFile[] = [];
    
    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image or video file.`,
          variant: "destructive"
        });
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 50MB limit.`,
          variant: "destructive"
        });
        return;
      }

      const mediaFile: MediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        type: file.type,
        size: file.size
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          mediaFile.preview = e.target?.result as string;
          setMediaFiles(prev => [...prev, mediaFile]);
          updateParent([...mediaFiles, mediaFile]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(mediaFile);
      }
    });

    if (newFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...newFiles]);
      updateParent([...mediaFiles, ...newFiles]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateParent = (files: MediaFile[]) => {
    onUpdate(files.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      description: f.description
    })));
  };

  const removeFile = (id: string) => {
    const newFiles = mediaFiles.filter(f => f.id !== id);
    setMediaFiles(newFiles);
    updateParent(newFiles);
  };

  const updateDescription = (id: string, description: string) => {
    const newFiles = mediaFiles.map(f => 
      f.id === id ? { ...f, description } : f
    );
    setMediaFiles(newFiles);
    updateParent(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Camera className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-black mb-4">Media Upload</h3>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center space-y-4">
          <Upload className="h-12 w-12 text-gray-600 mx-auto" />
          <div>
            <h4 className="text-lg font-medium">Upload Images and Videos</h4>
            <p className="text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports: JPEG, PNG, GIF, MP4, AVI, MOV (Max 50MB per file)
            </p>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose Files
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Uploaded Files */}
        {mediaFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold">Uploaded Files ({mediaFiles.length})</h4>
            <div className="space-y-3">
              {mediaFiles.map(file => (
                <Card key={file.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* File Preview */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                          {getFileIcon(file.type)}
                        </div>
                      )}
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {file.type.split('/')[1].toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Description */}
                      <div className="space-y-1">
                        <Label htmlFor={`desc-${file.id}`} className="text-xs">
                          Description (Optional)
                        </Label>
                        <Input
                          id={`desc-${file.id}`}
                          placeholder="Add a description for this file..."
                          value={file.description || ''}
                          onChange={(e) => updateDescription(file.id, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h5 className="font-medium text-sm mb-2">📋 Best Practices:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Capture clear, well-lit images of findings</li>
            <li>• Include multiple angles for complex pathology</li>
            <li>• Add descriptive captions to help with identification</li>
            <li>• Use video for dynamic findings (peristalsis, bleeding)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};