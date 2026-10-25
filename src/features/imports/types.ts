export interface ImportSummary {
    teamsCreated: number;
    teamsExisting: number;
    playersCreated: number;
    playersSkipped: number;
}

export interface ImportResult {
    dryRun: boolean;
    summary: ImportSummary;
}

export interface ImportRowError {
    sheet: string;
    row: number;
    field?: string;
    message: string;
}

export interface ImportValidationDetails {
    errors: ImportRowError[];
    truncated: boolean;
}