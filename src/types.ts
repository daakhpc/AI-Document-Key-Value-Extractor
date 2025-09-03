
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface UploadedFile {
    id: string;
    file: File;
    status: FileStatus;
    data: Record<string, string>[] | null;
    error: string | null;
}
