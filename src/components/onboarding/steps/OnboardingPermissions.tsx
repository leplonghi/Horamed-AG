import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, ArrowLeft, AlertTriangle, Smartphone, Battery, CheckCircle } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { trackNotificationEvent, NotificationEvents } from "@/hooks/useNotificationMetrics";
import notificationService from "@/services/NotificationService";

interface Props {
  onGranted: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function OnboardingPermissions({ onGranted, onSkip, onBack }: Props) {
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === "android";

  const requestPermission = async () => {
    setRequesting(true);
    
    try {
      await trackNotificationEvent(NotificationEvents.PERMISSION_REQUESTED);
      
      // Initialize notification service
      await notificationService.initialize();
      
      // Request permissions using unified service
      const granted = await notificationService.requestPermissions();
      
      if (granted) {
        setPermissionGranted(true);
        await trackNotificationEvent(NotificationEvents.PERMISSION_GRANTED);
        
        // Schedule all pending doses
        await notificationService.scheduleAllPendingDoses();
        
        toast.success("Notificações e alarmes ativados!", {
          description: "Você receberá lembretes mesmo com o app fechado.",
        });
        
        // Small delay for user feedback
        setTimeout(() => onGranted(), 500);
      } else {
        setDenied(true);
        await trackNotificationEvent(NotificationEvents.PERMISSION_DENIED);
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      setDenied(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-colors ${
          permissionGranted ? "bg-green-500/20" : "bg-primary/10"
        }`}>
          {permissionGranted ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <Bell className="w-10 h-10 text-primary" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {permissionGranted ? "Tudo pronto!" : "Permita notificações"}
        </h1>
        <p className="text-muted-foreground">
          {permissionGranted 
            ? "Agora você será lembrado no horário certo."
            : "O HoraMed usa alarmes para garantir que você não perca o horário."}
        </p>
      </motion.div>

      {/* Why we need permissions */}
      {!permissionGranted && !denied && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <Bell className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Por que precisamos disso?
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>✓ Tocar alarme com app fechado</li>
                <li>✓ Funcionar offline</li>
                <li>✓ Lembrar mesmo em modo avião</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Android-specific info */}
      {isAndroid && !permissionGranted && !denied && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Celulares Android
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Usamos um canal de alarme especial que garante que a notificação toque mesmo em modo de economia de bateria.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Battery className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Após permitir
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Você pode precisar remover restrições de bateria. Vamos te guiar se necessário.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Denied state */}
      {denied && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20"
        >
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Notificações não permitidas
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Sem notificações, você terá que abrir o app para ver seus horários. Você pode permitir depois nas configurações do celular.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 pt-4"
      >
        {!permissionGranted && (
          <Button
            size="lg"
            onClick={requestPermission}
            disabled={requesting}
            className="w-full h-14 text-lg font-semibold"
          >
            <Bell className="w-5 h-5 mr-2" />
            {requesting ? "Solicitando..." : "Permitir notificações"}
          </Button>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          {!permissionGranted && (
            <Button 
              variant="ghost" 
              onClick={onSkip}
              className="flex-1 text-muted-foreground"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Decidir depois
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
