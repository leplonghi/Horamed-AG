import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MedicationWizard from "@/components/medication-wizard/MedicationWizard";

/**
 * Opens the unified MedicationWizard as a modal.
 * When closed, navigates back to the previous page.
 */
export default function AddItemRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(true);
  
  const editId = searchParams.get("edit");

  const handleOpenChange = (open: boolean) => {
    setWizardOpen(open);
    if (!open) {
      // Navigate back when wizard closes
      navigate(-1);
    }
  };

  return (
    <MedicationWizard 
      open={wizardOpen} 
      onOpenChange={handleOpenChange}
      editItemId={editId || undefined}
    />
  );
}
