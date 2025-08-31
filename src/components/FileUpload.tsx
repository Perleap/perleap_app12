import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, File, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  courseId?: string;
  onFileUploaded?: (file: { id: string; name: string; path: string }) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  existingFiles?: Array<{ id: string; file_name: string; file_path: string; file_size?: number }>;
  onFileRemove?: (fileId: string) => void;
}

export const FileUpload = ({
  courseId,
  onFileUploaded,
  accept = "*/*",
  maxSize = 10,
  multiple = true,
  existingFiles = [],
  onFileRemove
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of files) {
        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds ${maxSize}MB limit`,
            variant: "destructive",
          });
          continue;
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = courseId ? `course-files/${courseId}/${fileName}` : `temp-files/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('course-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // If courseId is provided, save file record to database
        let savedFile = null;
        if (courseId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { data, error: dbError } = await supabase
            .from('course_files')
            .insert([{
              course_id: courseId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id
            }])
            .select()
            .single();

          if (dbError) {
            console.error('Database error:', dbError);
            // Clean up uploaded file
            await supabase.storage.from('course-files').remove([filePath]);
            toast({
              title: "Database error",
              description: `Failed to save ${file.name} record`,
              variant: "destructive",
            });
            continue;
          }

          savedFile = data;
        }

        // Notify parent component
        onFileUploaded?.({
          id: savedFile?.id || fileName,
          name: file.name,
          path: filePath
        });

        toast({
          title: "File uploaded",
          description: `${file.name} uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (fileId: string, filePath: string) => {
    try {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from('course-files')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage removal error:', storageError);
      }

      // Remove from database if courseId exists
      if (courseId) {
        const { error: dbError } = await supabase
          .from('course_files')
          .delete()
          .eq('id', fileId);

        if (dbError) {
          console.error('Database removal error:', dbError);
          toast({
            title: "Error",
            description: "Failed to remove file record",
            variant: "destructive",
          });
          return;
        }
      }

      onFileRemove?.(fileId);
      
      toast({
        title: "File removed",
        description: "File removed successfully",
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <CardContent className="p-6">
          <div className="text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Upload files</p>
              <p className="text-xs text-muted-foreground">
                Click to browse or drag and drop files (max {maxSize}MB each)
              </p>
            </div>
            <Button 
              onClick={handleFileSelect}
              disabled={uploading}
              className="mt-4"
              variant="outline"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Attached Files</h4>
          {existingFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(file.id, file.file_path)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
