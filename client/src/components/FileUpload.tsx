import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MemoryDump } from "@/lib/types";
import { Upload, FileIcon, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: () => void;
  memoryDumps: MemoryDump[];
  onSelectDump: (dump: MemoryDump) => void;
}

export default function FileUpload({ onUploadComplete, memoryDumps, onSelectDump }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    // Validate files
    const validFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.bin')
    );

    if (validFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Only .bin files are supported",
        variant: "destructive"
      });
      return;
    }

    if (validFiles.some(file => file.size > 50 * 1024 * 1024)) {
      toast({
        title: "File too large",
        description: "Files must be smaller than 50MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/memory-dumps/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: `${validFiles.length} file(s) uploaded and processing started`,
      });

      onUploadComplete();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-50" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-30 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-50" />;
      default:
        return <Clock className="w-4 h-4 text-gray-40" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-50';
      case 'processing':
        return 'text-yellow-30';
      case 'error':
        return 'text-red-50';
      default:
        return 'text-gray-40';
    }
  };

  return (
    <section>
      <Card className="bg-gray-90 border-gray-80">
        <CardHeader>
          <CardTitle className="text-gray-10">Binary Memory Dump Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-ibm-blue bg-ibm-blue/10' : 'border-gray-70 hover:border-ibm-blue'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-80 rounded-lg flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-40" />
              </div>
              <div>
                <p className="text-gray-10 font-medium">Drag and drop binary files here, or click to browse</p>
                <p className="text-sm text-gray-40 mt-1">Supports .bin files from MDG and MP memory dumps</p>
              </div>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-50">
                <span className="bg-gray-80 px-2 py-1 rounded">MDG Format</span>
                <span className="bg-gray-80 px-2 py-1 rounded">MP Format</span>
                <span className="bg-gray-80 px-2 py-1 rounded">Max 50MB</span>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".bin"
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-gray-80 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-5 h-5 border-2 border-ibm-blue border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-sm font-medium text-gray-10">Processing binary data...</p>
                  <p className="text-xs text-gray-40">Extracting structured data from memory dumps</p>
                </div>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* File List */}
          {memoryDumps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-10 uppercase tracking-wide">Recent Files</h4>
              {memoryDumps.slice(0, 5).map((dump) => (
                <div 
                  key={dump.id} 
                  className={`flex items-center justify-between bg-gray-80 rounded-lg p-3 cursor-pointer hover:bg-gray-70 transition-colors`}
                  onClick={() => dump.status === 'completed' && onSelectDump(dump)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-ibm-blue rounded flex items-center justify-center">
                      <span className="text-xs text-white font-mono">BIN</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-10">{dump.filename}</p>
                      <p className="text-xs text-gray-40">
                        {dump.fileType} • {new Date(dump.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(dump.status)}
                    <span className={`text-xs ${getStatusColor(dump.status)}`}>
                      {dump.status === 'processing' ? 'Processing' : 
                       dump.status === 'completed' ? 'Completed' :
                       dump.status === 'error' ? 'Error' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
