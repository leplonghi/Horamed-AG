import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, HelpCircle, FolderOpen } from "lucide-react";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentos, useDeletarDocumento } from "@/hooks/useCofre";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { AddDocumentModal } from "@/components/AddDocumentModal";
import { DocumentCard } from "@/components/DocumentCard";
import { CofreHelpDialog } from "@/components/CofreHelpDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Cofre = () => {
  const navigate = useNavigate();
  const { activeProfile } = useUserProfiles();
  const [activeTab, setActiveTab] = useState("todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const categoria = activeTab === "todos" ? undefined : activeTab;
  const { data: documentos = [], isLoading } = useDocumentos({
    profileId: activeProfile?.id,
    categoria,
  });

  const deleteMutation = useDeletarDocumento();

  const handleView = (id: string) => {
    navigate(`/cofre/documento/${id}`);
  };

  const handleShare = (id: string) => {
    navigate(`/compartilhar-documento/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/cofre/documento/${id}`);
  };

  const handleDelete = (id: string) => {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (documentToDelete) {
      await deleteMutation.mutateAsync(documentToDelete);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const getCategoryCount = (slug: string) => {
    if (slug === "todos") return documentos.length;
    return documentos.filter((doc) => doc.categorias_saude?.slug === slug).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Cofre de Saúde</h1>
              <p className="text-muted-foreground max-w-2xl">
                Guarde receitas, exames, vacinas e relatórios em um só lugar.
                O HoraMed identifica automaticamente o tipo e preenche os dados pra você.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHelpDialog(true)}
              className="flex-shrink-0"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Como funciona?
            </Button>
          </div>
        </div>

        {/* Main Action Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowAddModal(true)}
            size="lg"
            className="w-full sm:w-auto h-auto py-6 px-8 text-lg gap-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
          >
            <Plus className="h-6 w-6" />
            Adicionar Documento
          </Button>
        </div>

        {/* Filters Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
            <TabsTrigger value="todos" className="gap-2">
              Todos
              {!isLoading && <span className="text-xs opacity-70">({getCategoryCount("todos")})</span>}
            </TabsTrigger>
            <TabsTrigger value="receitas" className="gap-2">
              Receitas
              {!isLoading && <span className="text-xs opacity-70">({getCategoryCount("receitas")})</span>}
            </TabsTrigger>
            <TabsTrigger value="exames" className="gap-2">
              Exames
              {!isLoading && <span className="text-xs opacity-70">({getCategoryCount("exames")})</span>}
            </TabsTrigger>
            <TabsTrigger value="vacinas" className="gap-2">
              Vacinas
              {!isLoading && <span className="text-xs opacity-70">({getCategoryCount("vacinas")})</span>}
            </TabsTrigger>
            <TabsTrigger value="consultas" className="gap-2">
              Consultas
              {!isLoading && <span className="text-xs opacity-70">({getCategoryCount("consultas")})</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Loading State */}
            {isLoading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && documentos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="p-6 rounded-full bg-muted/50 mb-6">
                  <FolderOpen className="h-16 w-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum documento adicionado ainda</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Envie uma receita, exame ou relatório para começar a organizar seus documentos de saúde.
                </p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Adicionar Documento
                </Button>
              </div>
            )}

            {/* Documents Grid */}
            {!isLoading && documentos.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {documentos.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onView={handleView}
                    onShare={handleShare}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />

      {/* Modals */}
      <AddDocumentModal open={showAddModal} onOpenChange={setShowAddModal} />
      <CofreHelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido permanentemente do seu cofre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Action Button (Mobile) */}
      <Button
        onClick={() => setShowAddModal(true)}
        size="icon"
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Cofre;
