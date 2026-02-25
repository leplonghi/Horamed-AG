import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ExternalLink,
    Apple,
} from "lucide-react";

interface IOSPermissionStatus {
    notificationsGranted: boolean;
    backgroundRefreshEnabled: boolean;
    canReceiveNotifications: boolean;
}

export function IOSPermissionsCard() {
    const [status, setStatus] = useState<IOSPermissionStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const isIOS = Capacitor.getPlatform() === "ios";

    useEffect(() => {
        if (isIOS) {
            loadStatus();
        } else {
            setLoading(false);
        }
    }, [isIOS]);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const perms = await PushNotifications.checkPermissions();

            setStatus({
                notificationsGranted: perms.receive === "granted",
                backgroundRefreshEnabled: true, // Assume true, can't check programmatically
                canReceiveNotifications: perms.receive === "granted",
            });
        } catch (error) {
            console.error("[iOS] Error loading permissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPermissions = async () => {
        try {
            const result = await PushNotifications.requestPermissions();
            if (result.receive === "granted") {
                await PushNotifications.register();
            }
            await loadStatus();
        } catch (error) {
            console.error("[iOS] Error requesting permissions:", error);
        }
    };

    const handleOpenSettings = () => {
        // iOS doesn't allow opening Settings programmatically
        // Show instructions instead
        alert(
            "Para ativar notificações:\n\n" +
            "1. Abra o app Ajustes\n" +
            "2. Role para baixo e toque em 'HoraMed'\n" +
            "3. Toque em 'Notificações'\n" +
            "4. Ative 'Permitir Notificações'\n" +
            "5. Ative 'Sons' e 'Avisos'\n\n" +
            "Para Background Refresh:\n" +
            "1. Abra Ajustes > Geral\n" +
            "2. Toque em 'Atualização em Segundo Plano'\n" +
            "3. Ative para 'HoraMed'"
        );
    };

    if (!isIOS) {
        return null; // Only show on iOS
    }

    if (loading) {
        return (
            <Card className="border-2">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!status) {
        return null;
    }

    const hasIssues = !status.canReceiveNotifications;

    return (
        <Card className={`border-2 ${hasIssues ? "border-warning" : "border-green-500"}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Apple className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Permissões iOS</CardTitle>
                    </div>
                    {status.canReceiveNotifications ? (
                        <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Tudo OK
                        </Badge>
                    ) : (
                        <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Ação Necessária
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Summary */}
                <div className="space-y-2">
                    {/* Notifications Permission */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            {status.notificationsGranted ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                                <span className="text-sm font-medium">Notificações</span>
                                <p className="text-xs text-muted-foreground">
                                    Necessário para receber alertas
                                </p>
                            </div>
                        </div>
                        {!status.notificationsGranted && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRequestPermissions}
                                className="gap-1"
                            >
                                <Bell className="h-3 w-3" />
                                Ativar
                            </Button>
                        )}
                    </div>

                    {/* Background Refresh */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                                <span className="text-sm font-medium">Atualização em Segundo Plano</span>
                                <p className="text-xs text-muted-foreground">
                                    Permite notificações com app fechado
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warning Alert */}
                {hasIssues && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            <strong>Atenção:</strong> Notificações não funcionarão sem permissão. Toque em
                            "Ativar" ou siga as instruções abaixo.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Instructions */}
                {hasIssues && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-2">
                        <p className="text-sm font-medium">
                            📱 Como ativar notificações no iOS:
                        </p>
                        <ol className="list-decimal ml-4 space-y-1.5 text-sm text-muted-foreground">
                            <li>Abra o app <strong>Ajustes</strong></li>
                            <li>Role para baixo e toque em <strong>HoraMed</strong></li>
                            <li>Toque em <strong>Notificações</strong></li>
                            <li>Ative <strong>Permitir Notificações</strong></li>
                            <li>Ative <strong>Sons</strong> e <strong>Avisos</strong></li>
                            <li>Escolha o estilo de alerta desejado</li>
                        </ol>
                        <div className="mt-3">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleOpenSettings}
                                className="w-full gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Ver Instruções Completas
                            </Button>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {!hasIssues && (
                    <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-sm">
                            ✅ Todas as permissões estão configuradas! As notificações funcionarão mesmo com o
                            app fechado.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Additional Info */}
                <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                        <strong>💡 Dica:</strong> Para notificações críticas (que tocam mesmo no modo Silencioso),
                        ative "Alertas Críticos" nas configurações de notificação.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
