
import { IntegrationProvider, IntegrationProviderId, DailyHealthSummary } from '@/types/integration-types';
import { Capacitor } from '@capacitor/core';

// Mock data service for integrations
class IntegrationService {
    private _providers: IntegrationProvider[] = [
        {
            id: 'google_fit',
            name: 'Google Fit / Health Connect',
            description: 'Sincronize passos, distância e calorias do seu dispositivo Android.',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Google_Fit_icon.svg/1024px-Google_Fit_icon.svg.png',
            color: '#EA4335',
            status: 'disconnected', // Default state
            features: ['Passos', 'Distância', 'Calorias']
        },
        {
            id: 'apple_health',
            name: 'Apple Saúde',
            description: 'Conecte seus dados de saúde do iPhone e Apple Watch.',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Apple_Health_icon.svg/1024px-Apple_Health_icon.svg.png',
            color: '#FF2D55',
            status: 'disconnected',
            features: ['Passos', 'Sono', 'Batimentos', 'Ciclo']
        },
        {
            id: 'fitbit',
            name: 'Fitbit',
            description: 'Importe dados detalhados de sono e atividade do seu Fitbit.',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Fitbit_logo_2016.svg/2560px-Fitbit_logo_2016.svg.png',
            color: '#00B0B9',
            status: 'disconnected',
            features: ['Sono Avançado', 'Atividade', 'Peso']
        },
        {
            id: 'garmin',
            name: 'Garmin',
            description: 'Sincronize dados de exercícios e saúde do seu Garmin Connect.',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Garmin_logo.svg/2560px-Garmin_logo.svg.png',
            color: '#007CC3',
            status: 'disconnected',
            features: ['Corrida', 'Ciclismo', 'Stress']
        },
        {
            id: 'oura',
            name: 'Oura Ring',
            description: 'Dados precisos de recuperação e prontidão do seu anel Oura.',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Oura_Ring_Logo.png/640px-Oura_Ring_Logo.png',
            color: '#000000',
            status: 'disconnected',
            features: ['Sono', 'Recuperação', 'Temperatura']
        }
    ];

    // Simulando persistência local
    getProviders(): Promise<IntegrationProvider[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const stored = localStorage.getItem('horamed_integrations');
                if (stored) {
                    const storedProviders = JSON.parse(stored);
                    // Merge stored status with static definition to keep icons/names updated
                    const merged = this._providers.map(p => {
                        const found = storedProviders.find((s: IntegrationProvider) => s.id === p.id);
                        return found ? { ...p, status: found.status, lastSync: found.lastSync } : p;
                    });
                    resolve(merged);
                } else {
                    resolve(this._providers);
                }
            }, 500); // Simulate network delay
        });
    }

    async connectProvider(providerId: IntegrationProviderId): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const run = async () => {
                try {
                // Feature removida: não integramos mais o '@capgo/capacitor-health' nativamente
                // para evitar requerimentos de declaração de health tags na Play Store.
                
                setTimeout(() => {
                    // Update local storage
                    const stored = localStorage.getItem('horamed_integrations');
                    let currentStatus = stored ? JSON.parse(stored) : [];

                    // Remove existing if any
                    currentStatus = currentStatus.filter((p: IntegrationProvider) => p.id !== providerId);

                    // Add new connected state
                    currentStatus.push({
                        id: providerId,
                        status: 'connected',
                        lastSync: new Date().toISOString()
                    });

                    localStorage.setItem('horamed_integrations', JSON.stringify(currentStatus));
                    resolve(true);
                }, 800); // Simulate auth redirect/popup
                } catch (err) {
                    console.error('Error connecting provider:', err);
                    reject(err);
                }
            };
            run();
        });
    }

    async disconnectProvider(providerId: IntegrationProviderId): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const stored = localStorage.getItem('horamed_integrations');
                if (stored) {
                    let currentStatus = JSON.parse(stored);
                    currentStatus = currentStatus.filter((p: IntegrationProvider) => p.id !== providerId);
                    localStorage.setItem('horamed_integrations', JSON.stringify(currentStatus));
                }
                resolve(true);
            }, 500);
        });
    }

    async syncProvider(providerId: IntegrationProviderId): Promise<DailyHealthSummary> {
        return new Promise((resolve, reject) => {
            const run = async () => {
                try {
                const steps = Math.floor(Math.random() * 5000) + 3000;
                const distance = Math.floor(Math.random() * 3000) + 1000;
                const calories = Math.floor(Math.random() * 300) + 200;
                const heartRate = 60 + Math.floor(Math.random() * 10);
                
                // Mocks are locally generated for now as the @capgo/capacitor-health integration 
                // was removed to comply with standard Play Store policies without Health Declarations.


                setTimeout(() => {
                    // Update last sync
                    const stored = localStorage.getItem('horamed_integrations');
                    if (stored) {
                        const currentStatus = JSON.parse(stored);
                        const index = currentStatus.findIndex((p: IntegrationProvider) => p.id === providerId);
                        if (index >= 0) {
                            currentStatus[index].lastSync = new Date().toISOString();
                            localStorage.setItem('horamed_integrations', JSON.stringify(currentStatus));
                        }
                    }

                    resolve({
                        date: new Date().toISOString().split('T')[0],
                        steps: steps,
                        distance_meters: distance,
                        calories_burned: calories,
                        sleep_minutes: 420 + Math.floor(Math.random() * 60), // Not natively requested in this scope to keep simple
                        resting_heart_rate: heartRate,
                        sources: [providerId]
                    });
                }, 1000); // Simulate processing
            } catch (err) {
                console.error('Failed to sync health data', err);
                reject(err);
            }
        };
        run();
        });
    }
}

export const integrationService = new IntegrationService();
