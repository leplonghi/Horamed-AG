
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle, Smartphone, Watch, Zap } from 'lucide-react';
import { integrationService } from '@/services/IntegrationService';
import { IntegrationProvider, IntegrationStatus } from '@/types/integration-types';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

const IntegrationsHub: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [providers, setProviders] = useState<IntegrationProvider[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const data = await integrationService.getProviders();
            setProviders(data);
        } catch (error) {
            console.error('Failed to load integration providers', error);
            toast({
                title: "Erro ao carregar",
                description: "Não foi possível buscar a lista de integrações.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (id: string) => {
        setProcessingId(id);
        toast({
            title: "Iniciando conexão...",
            description: "Redirecionando para o provedor...",
        });

        try {
            await integrationService.connectProvider(id as any);
            toast({
                title: "Conectado com sucesso!",
                description: "Agora seus dados serão sincronizados automaticamente.",
                variant: "default" // success variant depending on configuration
            });
            await loadProviders();
        } catch (error) {
            toast({
                title: "Falha na conexão",
                description: "Ocorreu um erro ao tentar conectar o serviço.",
                variant: "destructive"
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDisconnect = async (id: string) => {
        setProcessingId(id);
        try {
            await integrationService.disconnectProvider(id as any);
            toast({
                title: "Desconectado",
                description: "O serviço foi desconectado e os dados novos não serão mais importados.",
            });
            await loadProviders();
        } catch (error) {
            toast({
                title: "Erro ao desconectar",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleSync = async (id: string) => {
        setProcessingId(id);
        toast({
            title: "Sincronizando...",
            description: "Buscando dados recentes...",
        });

        try {
            const summary = await integrationService.syncProvider(id as any);
            toast({
                title: "Sincronização concluída",
                description: `Recebidos ${summary.steps} passos e ${summary.sleep_minutes} min de sono.`,
            });
            await loadProviders(); // Update last sync timestamp
        } catch (error) {
            toast({
                title: "Falha na sincronização",
                description: "Não foi possível obter dados recentes.",
                variant: "destructive"
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50/50 dark:bg-black">
            <div className="flex items-center p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Integrações
                    </h1>
                    <p className="text-xs text-muted-foreground">Conecte seus dispositivos e apps</p>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4 pb-24">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Hero Section */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Centralize sua Saúde</h2>
                            <p className="opacity-90 max-w-md mb-6 text-sm leading-relaxed">
                                Conecte seus wearables favoritos para ter uma visão holística do seu bem-estar.
                                O Horamed combina dados de passos, sono e exercícios para te dar insights poderosos.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs border border-white/10">
                                    <Watch className="w-3 h-3 mr-1.5" /> Wearables
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs border border-white/10">
                                    <Smartphone className="w-3 h-3 mr-1.5" /> Apps de Saúde
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs border border-white/10">
                                    <Zap className="w-3 h-3 mr-1.5" /> Insights IA
                                </span>
                            </div>
                        </div>
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-purple-900/20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Providers Grid */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 px-1">Disponíveis para Conexão</h3>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {providers.map(provider => (
                                    <IntegrationCard
                                        key={provider.id}
                                        provider={provider}
                                        onConnect={handleConnect}
                                        onDisconnect={handleDisconnect}
                                        onSync={handleSync}
                                        isLoading={processingId === provider.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-300 text-sm mb-2 flex items-center">
                            <Smartphone className="w-4 h-4 mr-2" />
                            Como funciona a sincronização?
                        </h4>
                        <p className="text-xs text-blue-800/80 dark:text-blue-400/80 leading-relaxed">
                            O Horamed se conecta diretamente à nuvem do fabricante (Google, Apple, Fitbit).
                            Não é necessário manter o app aberto para sincronizar. Os dados são importados automaticamente
                            a cada 6 horas ou quando você solicita manualmente.
                        </p>
                    </div>

                </div>
            </ScrollArea>
        </div>
    );
};

export default IntegrationsHub;
