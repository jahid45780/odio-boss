'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiErrorMessage } from '@/lib/api';
import { SafeImage } from '@/components/ui/safe-image';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  folder?: string;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  multiple = false,
  folder = 'soniq',
  label = 'Upload Image',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('folder', folder);
      Array.from(fileList).forEach((file) => formData.append('files', file));

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrls = (res.data.data.files as Array<{ url: string }>).map((f) => f.url);
      if (multiple) {
        onChange([...value, ...uploadedUrls]);
      } else {
        onChange(uploadedUrls.slice(0, 1));
      }
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center gap-2 rounded-theme-control border border-dashed border-line-strong bg-surface-secondary px-4 text-xs font-medium text-ink-primary hover:border-accent-primary transition-colors cursor-pointer"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin text-accent-primary" /> : <Upload className="h-4 w-4 text-accent-primary" />}
          {uploading ? 'Uploading...' : label}
        </button>
        <span className="text-xs text-ink-secondary">JPEG, PNG, WebP · Max 5MB</span>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, idx) => (
            <div
              key={url + idx}
              className="relative h-20 w-24 overflow-hidden rounded-theme-control border border-line-strong bg-surface-elevated"
            >
              <SafeImage src={url} alt={`Uploaded ${idx + 1}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                aria-label="Remove image"
                className="absolute right-1 top-1 rounded-full bg-black/80 p-1 text-white hover:text-red-400 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
