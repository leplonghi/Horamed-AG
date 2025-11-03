import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useState } from "react";
import UpgradeModal from "./UpgradeModal";

export default function FloatingActionButton() {
  const navigate = useNavigate();
  const { canAddMedication } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleClick = () => {
    if (!canAddMedication) {
      setShowUpgradeModal(true);
      return;
    }
    navigate("/adicionar");
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="lg"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
        aria-label="Adicionar medicamento"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        feature="medication"
      />
    </>
  );
}
