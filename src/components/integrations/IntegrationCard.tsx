
import React from 'react';
import { IntegrationProvider, IntegrationStatus } from '@/types/integration-types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Bluetooth } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntegrationCardProps {
    provider: IntegrationProvider;
    onConnect: (id: string) => void;
    onDisconnect: (id: string) => void;
    onSync: (id: string) => void;
    isLoading?: boolean;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
    provider,
    onConnect,
    onDisconnect,
    onSync,
    isLoading
}) => {
    const isConnected = provider.status === 'connected';

    return (
        <Card className={cn(
            "overflow-hidden transition-all duration-300 hover:shadow-md border-2",
            isConnected ? "border-primary/20 bg-primary/5" : "border-transparent hover:border-gray-200"
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100">
                        {/* Fallback icon if image fails or is not provided */}
                        {provider.icon && !provider.icon.includes('http') ? (
                            <Activity className="h-6 w-6 text-primary" />
                        ) : (
                            <img src={provider.icon} alt={provider.name} className="h-8 w-8 object-contain" onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }} />
                        )}
                        <Activity className="h-6 w-6 text-primary hidden" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold">{provider.name}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                            )} />
                            <span className="text-xs text-muted-foreground font-medium">
                                {isConnected ? 'Conectado' : 'Desconectado'}
                            </span>
                        </div>
                    </div>
                </div>
                {isConnected && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                        Ativo
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                    {provider.description}
                </p>

                {/* Features Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {provider.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs font-normal bg-background/50">
                            {feature}
                        </Badge>
                    ))}
                </div>

                {isConnected && provider.lastSync && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-background/50 p-2 rounded-lg border border-border/50">
                        <RefreshCw className="h-3 w-3" />
                        <span>
                            Sincronizado: {format(new Date(provider.lastSync), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-0 gap-2">
                {isConnected ? (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSync(provider.id)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            <RefreshCw className={cn("mr-2 h-3 w-3", isLoading && "animate-spin")} />
                            Sincronizar
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDisconnect(provider.id)}
                            disabled={isLoading}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            Desconectar
                        </Button>
                    </>
                ) : (
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm"
                        onClick={() => onConnect(provider.id)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            <>
                                <Bluetooth className="mr-2 h-4 w-4" />
                                Conectar Agora
                            </>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};
