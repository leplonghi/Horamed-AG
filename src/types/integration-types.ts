
export type IntegrationProviderId = 'google_fit' | 'apple_health' | 'fitbit' | 'garmin' | 'oura';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface IntegrationProvider {
    id: IntegrationProviderId;
    name: string;
    description: string;
    icon: string;
    color: string;
    status: IntegrationStatus;
    lastSync?: string; // ISO date string
    features: string[]; // e.g. ['steps', 'sleep', 'heart_rate']
}

export interface DailyHealthSummary {
    date: string;
    steps: number;
    distance_meters: number;
    calories_burned: number;
    sleep_minutes: number;
    resting_heart_rate: number;
    sources: IntegrationProviderId[];
}
