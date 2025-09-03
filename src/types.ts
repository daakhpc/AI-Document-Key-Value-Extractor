export interface KeyValuePair {
    key: string;
    value: string;
}

export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface UploadedFile {
    id: string;
    file: File;
    status: FileStatus;
    data: KeyValuePair[] | null;
    error: string | null;
}