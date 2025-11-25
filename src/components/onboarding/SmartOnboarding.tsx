import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingStep1 from "./OnboardingStep1";
import OnboardingStep2 from "./OnboardingStep2";
import OnboardingStep3 from "./OnboardingStep3";
import OnboardingStep4 from "./OnboardingStep4";
import { useNavigate } from "react-router-dom";

interface OnboardingData {
  userType: string;
  medicationCount: string;
  mainConcern: string;
}

export default function SmartOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    userType: "",
    medicationCount: "",
    mainConcern: "",
  });
  const navigate = useNavigate();

  const totalSteps = 4;

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    navigate("/hoje");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.userType !== "";
      case 2:
        return data.medicationCount !== "";
      case 3:
        return data.mainConcern !== "";
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <OnboardingStep1
                  value={data.userType}
                  onChange={(value) => updateData("userType", value)}
                />
              )}
              {currentStep === 2 && (
                <OnboardingStep2
                  value={data.medicationCount}
                  onChange={(value) => updateData("medicationCount", value)}
                />
              )}
              {currentStep === 3 && (
                <OnboardingStep3
                  value={data.mainConcern}
                  onChange={(value) => updateData("mainConcern", value)}
                />
              )}
              {currentStep === 4 && (
                <OnboardingStep4 onComplete={handleComplete} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 flex items-center justify-between max-w-2xl mx-auto w-full">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${
                i + 1 === currentStep
                  ? "bg-primary w-8"
                  : i + 1 < currentStep
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} className="gap-2">
            Começar
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
