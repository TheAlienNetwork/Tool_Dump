import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { MemoryDump } from "@/lib/types";
import { Upload, FileIcon, AlertCircle, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FileUploadProps {
  onUploadComplete: () => void;
  memoryDumps: MemoryDump[];
  onSelectDump: (dump: MemoryDump | null) => void;
}

export default function FileUpload({ onUploadComplete, memoryDumps, onSelectDump }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

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
    setUploadingFiles(Array.from(validFiles));

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
      console.log('Upload response:', result);

      toast({
        title: "Upload successful",
        description: `${validFiles.length} file(s) are being processed`,
      });

      // Trigger immediate refresh and keep polling
      onUploadComplete();

      // Keep polling every 2 seconds until processing is complete
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/memory-dumps');
          const dumps = await statusResponse.json();
          const processingDumps = dumps.filter((dump: any) => dump.status === 'processing');

          if (processingDumps.length === 0) {
            clearInterval(pollInterval);
            onUploadComplete(); // Final refresh when all done
          }
        } catch (error) {
          console.error('Status poll error:', error);
        }
      }, 2000);

      // Clear polling after 5 minutes max
      setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadingFiles([]);
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

  const handleClearAllDumps = async () => {
    try {
      await apiRequest('DELETE', '/api/memory-dumps/clear-all');

      // Clear all React Query cache
      queryClient.clear();

      toast({
        title: "All dumps cleared",
        description: "All memory dumps and analysis data have been cleared successfully",
      });

      onUploadComplete(); // Refresh the list
      onSelectDump(null); // Clear selected dump
    } catch (error) {
      toast({
        title: "Clear failed",
        description: error instanceof Error ? error.message : "Failed to clear dumps",
        variant: "destructive"
      });
    }
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
                  <p className="text-xs text-gray-40">
                    Large files may take several minutes to process. Please be patient.
                  </p>
                </div>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <div className="mt-2 text-xs text-gray-50">
                <span className="bg-blue-500/20 px-2 py-1 rounded">
                  Processing {uploadingFiles.length} file(s)
                </span>
              </div>
            </div>
          )}

          {/* Currently Processing Files */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Processing Files</h4>
              {uploadingFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-dark-700/50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded flex items-center justify-center">
                      <span className="text-xs text-blue-400 font-mono">BIN</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-xs text-blue-400">Processing</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Memory Dumps */}
          {memoryDumps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-10 uppercase tracking-wide">Recent Memory Dumps</h4>
                <Button 
                  onClick={handleClearAllDumps}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Dump
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {memoryDumps.slice(0, 5).map((dump: any) => (
                  <div 
                    key={dump.id} 
                    className="flex items-center justify-between bg-gray-80 rounded-lg p-3 cursor-pointer hover:bg-gray-70 transition-colors"
                    onClick={() => onSelectDump(dump)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-70 rounded flex items-center justify-center">
                        <FileIcon className="w-4 h-4 text-gray-40" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-10">{dump.filename}</p>
                        <p className="text-xs text-gray-40">
                          {new Date(dump.createdAt).toLocaleDateString()} • {(dump.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(dump.status)}
                      <span className={`text-xs ${getStatusColor(dump.status)}`}>
                        {dump.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}