import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MedicationWizard from "./medication-wizard/MedicationWizard";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Floating Action Button that opens the unified medication wizard
 * Replaces scattered "Add Medication" entry points
 */
export default function FloatingAddButton() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <Button
        onClick={() => setWizardOpen(true)}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        size="lg"
        data-testid="floating-add-button"
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-6 shadow-2xl z-40 hover:scale-105 transition-all duration-300 rounded-full group"
        style={{
          width: isExpanded ? 'auto' : '4rem',
          paddingLeft: isExpanded ? '1.5rem' : '1rem',
          paddingRight: isExpanded ? '1.5rem' : '1rem',
        }}
        aria-label={t('meds.addMedication')}
      >
        <Plus className="h-6 w-6 flex-shrink-0" />
        <span
          className={`ml-2 whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'
            } md:max-w-0 md:opacity-0 md:group-hover:max-w-[200px] md:group-hover:opacity-100`}
        >
          {t('meds.addMedication')}
        </span>
      </Button>

      <MedicationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
