import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import OceanBackground from "@/components/ui/OceanBackground";
import HealthDataTab from "@/components/progress/HealthDataTab";

export default function HealthDashboard() {
  return (
    <div className="min-h-screen bg-background relative">
      <OceanBackground variant="page" />
      <Header />

      <main className="container max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5 page-container relative z-10">
        <HealthDataTab hideLayout={true} />
      </main>

      <Navigation />
    </div>
  );
}
