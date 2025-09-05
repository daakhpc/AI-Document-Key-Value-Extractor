export type AppStep = 'upload' | 'configure' | 'extract' | 'extracting' | 'done';

// FIX: Add FileStatus type for use in UploadedFile. This type was missing but is used by the FileProgressList component.
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface UploadedFile {
    id: string;
    file: File;
    // FIX: Add optional status and error fields to support the FileProgressList component.
    // They are optional to avoid breaking other components that create UploadedFile objects.
    status?: FileStatus;
    error?: string | null;
}

export interface TableRow {
    [key: string]: string | number | undefined;
}