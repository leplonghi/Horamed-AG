import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import QuickActionMenu from "./QuickActionMenu";

export default function FloatingActionButton() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowMenu(true)}
        size="lg"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40"
        aria-label="Adicionar"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <QuickActionMenu open={showMenu} onOpenChange={setShowMenu} />
    </>
  );
}
