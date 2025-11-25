import { Plus } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import QuickActionMenu from "./QuickActionMenu";

export default function FloatingActionButton() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setShowMenu(true)}
        className="fixed bottom-24 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: [
            "0 10px 30px -10px hsl(var(--primary) / 0.3)",
            "0 10px 40px -10px hsl(var(--primary) / 0.5)",
            "0 10px 30px -10px hsl(var(--primary) / 0.3)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-label="Adicionar"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
      <QuickActionMenu open={showMenu} onOpenChange={setShowMenu} />
    </>
  );
}
