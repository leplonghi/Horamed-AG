import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Capacitor } from "@capacitor/core";
import {
    Battery,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ExternalLink,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    getAndroidPermissionStatus,
    getManufacturerInstructions,
    requestExactAlarmPermission,
    requestIgnoreBatteryOptimization,
    type AndroidPermissionStatus,
} from "@/utils/androidPermissions";
interface AndroidPermissionsCardProps {
    hideWhenOk?: boolean;
}

export function AndroidPermissionsCard({ hideWhenOk = false }: AndroidPermissionsCardProps) {
    const [status, setStatus] = useState<AndroidPermissionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [showInstructions, setShowInstructions] = useState(false);

    const isAndroid = Capacitor.getPlatform() === "android";

    useEffect(() => {
        if (isAndroid) {
            loadStatus();
        } else {
            setLoading(false);
        }
    }, [isAndroid]);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const permStatus = await getAndroidPermissionStatus();
            setStatus(permStatus);
        } catch (error) {
            console.error("[AndroidPermissions] Error loading status:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestExactAlarm = async () => {
        const granted = await requestExactAlarmPermission();
        if (!granted) {
            // Show instructions
            setShowInstructions(true);
        }
        await loadStatus();
    };

    const handleRequestBatteryOptimization = async () => {
        await requestIgnoreBatteryOptimization();
        setShowInstructions(true);
        await loadStatus();
    };

    if (!isAndroid) {
        return null; // Only show on Android
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

    const instructions = getManufacturerInstructions(status.deviceInfo.manufacturer);
    const hasIssues = !status.canScheduleExactAlarms;

    if (hideWhenOk && !hasIssues) {
        return null;
    }

    return (
        <Card className={`border-2 ${hasIssues ? "border-warning" : "border-green-500"}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Battery className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Permissões Android</CardTitle>
                    </div>
                    {status.canScheduleExactAlarms ? (
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
                    {/* Exact Alarm Permission */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            {status.hasExactAlarmPermission ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                                <span className="text-sm font-medium">Alarmes Exatos</span>
                                <p className="text-xs text-muted-foreground">
                                    Necessário para notificações precisas
                                </p>
                            </div>
                        </div>
                        {!status.hasExactAlarmPermission && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRequestExactAlarm}
                                className="gap-1"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Ativar
                            </Button>
                        )}
                    </div>

                    {/* Battery Optimization */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            {!status.isBatteryOptimized ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            <div>
                                <span className="text-sm font-medium">Otimização de Bateria</span>
                                <p className="text-xs text-muted-foreground">
                                    {status.isBatteryOptimized
                                        ? "App está sendo otimizado (pode atrasar notificações)"
                                        : "App não está sendo otimizado"}
                                </p>
                            </div>
                        </div>
                        {status.isBatteryOptimized && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRequestBatteryOptimization}
                                className="gap-1"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Desativar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Warning Alert */}
                {hasIssues && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            <strong>Atenção:</strong> Notificações podem não funcionar corretamente com o app
                            fechado. Siga as instruções abaixo para garantir o funcionamento.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Device-Specific Instructions */}
                {(hasIssues || showInstructions) && (
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowInstructions(!showInstructions)}
                            className="w-full justify-between"
                        >
                            <span className="font-medium">
                                📱 Instruções para {instructions.title}
                            </span>
                            {showInstructions ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>

                        {showInstructions && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-2">
                                <p className="text-sm font-medium">
                                    Siga estes passos para garantir que as notificações funcionem:
                                </p>
                                <ol className="list-decimal ml-4 space-y-1.5 text-sm">
                                    {instructions.steps.map((step, index) => (
                                        <li key={index} className="text-muted-foreground">
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                        <strong>⚠️ Importante:</strong> Cada fabricante tem configurações diferentes.
                                        Se não encontrar as opções exatas, procure por "Bateria", "Economia de
                                        energia" ou "Gerenciamento de apps" nas configurações.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Success Message */}
                {!hasIssues && (
                    <Alert>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-sm">
                            ✅ Todas as permissões estão configuradas corretamente! As notificações devem
                            funcionar mesmo com o app fechado.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Device Info */}
                <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                        <strong>Dispositivo:</strong> {status.deviceInfo.manufacturer}{" "}
                        {status.deviceInfo.model} (Android {status.deviceInfo.androidVersion})
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
