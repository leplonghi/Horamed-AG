import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  MagnifyingGlass as Search, 
  TrendDown as TrendingDown, 
  MapPin, 
  ArrowSquareOut as ExternalLink, 
  Truck, 
  ShoppingCart,
  CheckCircle,
  CurrencyCircleDollar
} from "@phosphor-icons/react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const MOCK_PHARMACIES = [
  { name: "Pague Menos", price: 42.90, deliveryTime: "30 min", rating: 4.8, bestPrice: true },
  { name: "Droga Raia", price: 45.50, deliveryTime: "25 min", rating: 4.9, bestPrice: false },
  { name: "Drogasil", price: 48.00, deliveryTime: "20 min", rating: 4.7, bestPrice: false },
  { name: "Ultrafarma", price: 39.90, deliveryTime: "2-3 days", rating: 4.5, bestPrice: false },
];

const Pharmacy = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (!searchTerm) {
      toast.error(t("auth.required_field"));
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-24">
      <Header />
      
      <main className="container mx-auto px-4 pt-28 max-w-lg">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
            {t("pharmacy.featured")}
          </Badge>
          <h1 className="text-4xl font-black tracking-tight mb-3 bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent italic">
            {t("pharmacy.title")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("pharmacy.description")}
          </p>
        </motion.div>

        <Card className="border-none shadow-2xl bg-white/80 dark:bg-white/5 backdrop-blur-xl mb-8 overflow-hidden">
          <CardContent className="p-6">
            <div className="relative group">
              <Input
                placeholder="Qual medicamento você procura?"
                className="h-14 pl-12 pr-4 text-lg border-2 border-muted hover:border-primary focus:border-primary transition-all rounded-2xl bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Button 
              className="w-full mt-4 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  <span>Buscando...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <Search weight="bold" />
                  Buscar Melhores Preços
                </span>
              )}
            </Button>
          </CardContent>
          <div className="bg-primary/5 p-4 flex items-center justify-center gap-2 text-primary text-sm font-medium">
            <TrendingDown weight="bold" />
            {t("pharmacy.savings", { percentage: "35" })}
          </div>
        </Card>

        {showResults ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl">Top Escolhas</h2>
              <Button variant="ghost" size="sm" className="text-primary font-bold">Ver Todas</Button>
            </div>
            
            {MOCK_PHARMACIES.sort((a, b) => a.price - b.price).map((phar, idx) => (
              <motion.div
                key={phar.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`relative border-none overflow-hidden transition-all hover:shadow-xl ${idx === 0 ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900 bg-white dark:bg-slate-900' : 'bg-white/50 dark:bg-slate-900/50'}`}>
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                      Melhor Oferta
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{phar.name}</h3>
                          <div className="flex items-center text-xs text-amber-500 font-bold">
                            ★ {phar.rating}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mb-4">
                          <span className="flex items-center gap-1">
                            <Truck weight="bold" />
                            {phar.deliveryTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin weight="bold" />
                            Aberto agora
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black text-primary">R$ {phar.price.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground line-through">R$ {(phar.price * 1.25).toFixed(2)}</span>
                        </div>
                      </div>
                      <Button className="rounded-xl px-6 h-12 shadow-md">
                        {t("pharmacy.buyNow")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="space-y-6">
             <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <span className="text-lg font-bold">R$</span>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">Sugestão BR</div>
                <div className="text-sm font-black text-blue-600">R$ 24,90</div>
              </div>
              <div className="aspect-square rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <span className="text-lg font-bold">$</span>
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">Sugestão EUA</div>
                <div className="text-sm font-black text-green-600">$ 4.90</div>
              </div>
              <div className="aspect-square rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CurrencyCircleDollar className="w-6 h-6" weight="bold" />
                </div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">Sugestão UAE</div>
                <div className="text-sm font-black text-emerald-600">AED 18</div>
              </div>
            </div>

            <Card className="border-none bg-primary mt-6 text-white overflow-hidden relative">
              <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <CardContent className="p-8 relative z-10 flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                  <ShoppingCart size={32} weight="fill" className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xl leading-tight italic">COMPRE DIRETO<br/>E ECONOMIZE</h3>
                  <p className="text-white/80 text-sm mt-1 font-medium">Melhores preços garantidos.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Pharmacy;
