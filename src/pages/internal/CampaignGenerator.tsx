import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Rocket, ArrowRight, ArrowLeft, ChatCircle as MessageCircle, InstagramLogo as Instagram, TrendUp as TrendingUp, Users, Target, ChartBar as BarChart3, CalendarBlank as Calendar, Trash as Trash2, VideoCamera as Video, Image as ImageIcon, FileText, MagnifyingGlass as Search, Funnel as Filter, FloppyDisk as Save, CheckCircle as CheckCircle2, WarningCircle as AlertCircle, PencilSimple as Pencil, X, Check, PaintBucket as Palette, ArrowLineDown as ArrowDownToLine, GitBranch as GitGraph, PlusCircle } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CampaignService, CampaignRule, CampaignStrategy, CAMPAIGN_TEMPLATES } from "@/services/CampaignService";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/integrations/firebase";
import { PROMPTS_LIBRARY, PromoContent } from "./prompts-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// TYPES
type NicheType = "saas" | "ecommerce" | "infoproduct" | "services" | "real_estate";
type ChannelType = "whatsapp" | "social" | "email" | "ads";
type ToneType = "urgent_fomo" | "emotional_founder" | "educational_authority" | "funny_relatable" | "premium_aspirational";
type PurposeType = "marketing_promo" | "educational_tips" | "informative_news" | "curiosities_facts";
type PostType = "flash" | "keyword" | "engagement" | "reply_pack";
type GroupType = "vip_circle" | "health_professionals" | "institutional" | "personal";

interface WizardState {
    step: number;
    niche: NicheType | null;
    channel: ChannelType | null;
    selectedGroups: GroupType[];
    postType: PostType | null;
    tone: ToneType | null;
    purpose: PurposeType | null;
}

interface GeneratedCampaign {
    code: string;
    link: string;
    copy: string;
    isSaved?: boolean; // New flag to track persistence
    metadata: {
        niche: NicheType;
        channel: ChannelType;
        groups?: GroupType[];
        postType?: PostType;
        tone: ToneType;
        purpose: PurposeType;
        createdAt: string;
    };
}

interface CampaignMetrics {
    totalCampaigns: number;
    totalRedemptions: number;
    conversionRate: number;
    topPerformer: string;
}

interface StrategyDay {
    day: string;
    focus: string;
    format: string;
    topic: string;
}

// NEW: Business Context Interface
interface BusinessIdentity {
    productName: string;
    description: string; // What do you sell?
    targetAudience: string;
    painPoint: string; // Primary pain
    benefit: string; // Primary benefit
}

interface BusinessProfile extends BusinessIdentity {
    id: string;
    profileName: string; // e.g. "Horamed", "My Store"
}

// NEW: Strategy Type (Replaces simplistic 'Channel' choice)
type CampaignGoal = "weekly_planner" | "flash_launch" | "engagement_boost" | "authority_building" | "single_post";
const CAMPAIGN_GOALS: Record<CampaignGoal, { label: string; emoji: string; description: string }> = {
    weekly_planner: { label: "Planejamento Semanal", emoji: "📅", description: "Calendário completo para 7 dias" },
    flash_launch: { label: "Lançamento Relâmpago", emoji: "🚀", description: "Vendas agressivas em 48h" },
    engagement_boost: { label: "Explosão de Engajamento", emoji: "💬", description: "Reaquecer a audiência" },
    authority_building: { label: "Construção de Autoridade", emoji: "👑", description: "Posicionamento e branding" },
    single_post: { label: "Post Único / Rápido", emoji: "⚡", description: "Conteúdo imediato" },
};

// CONFIGURATION
const NICHES: Record<NicheType, { label: string; emoji: string; description: string }> = {
    saas: { label: "SaaS / App", emoji: "💻", description: "Softwares e Aplicativos" },
    ecommerce: { label: "E-commerce", emoji: "🛍️", description: "Loja Virtual e Varejo" },
    infoproduct: { label: "Infoproduto", emoji: "📚", description: "Cursos e E-books" },
    services: { label: "Serviços", emoji: "🤝", description: "Consultoria e Atendimentos" },
    real_estate: { label: "Imobiliário", emoji: "🏠", description: "Corretores e Imobiliárias" }
};

const TONES: Record<ToneType, { label: string; emoji: string; description: string }> = {
    urgent_fomo: { label: "Urgência / FOMO", emoji: "🔥", description: "Cria senso de urgência e escassez" },
    emotional_founder: { label: "Emocional / História", emoji: "💙", description: "Conexão pessoal e storytelling" },
    educational_authority: { label: "Educativo / Autoridade", emoji: "🎓", description: "Informativo e profissional" },
    funny_relatable: { label: "Humor / Relatable", emoji: "😄", description: "Descontraído e próximo" },
    premium_aspirational: { label: "Premium / Aspiracional", emoji: "💎", description: "Exclusivo e sofisticado" }
};

const PURPOSES: Record<PurposeType, { label: string; emoji: string; description: string }> = {
    marketing_promo: { label: "Promoção / Marketing", emoji: "🎯", description: "Foco em conversão e vendas" },
    educational_tips: { label: "Dicas / Educação", emoji: "💡", description: "Ensinar e agregar valor" },
    informative_news: { label: "Novidades / Informação", emoji: "📰", description: "Comunicar atualizações" },
    curiosities_facts: { label: "Curiosidades / Fatos", emoji: "🤔", description: "Engajar com conteúdo interessante" }
};

const GROUPS: Record<GroupType, { label: string; emoji: string; description: string }> = {
    vip_circle: { label: "Círculo VIP", emoji: "👨‍👩‍👧‍👦", description: "Família e amigos próximos" },
    health_professionals: { label: "Profissionais de Saúde", emoji: "⚕️", description: "Médicos, enfermeiros, farmacêuticos" },
    institutional: { label: "Institucional / Corporativo", emoji: "🏢", description: "Empresas e organizações" },
    personal: { label: "Pessoal / Individual", emoji: "👤", description: "Contatos individuais" }
};

const POST_TYPES: Record<PostType, { label: string; emoji: string; description: string; vagas: number; dias: number }> = {
    flash: { label: "Flash Semanal", emoji: "⚡", description: "Campanha rápida com urgência", vagas: 50, dias: 14 },
    keyword: { label: "Keyword DM", emoji: "💬", description: "Engajamento via comentários", vagas: 100, dias: 30 },
    engagement: { label: "Engajamento / Discussão", emoji: "🗣️", description: "Perguntas, Enquetes e Polêmicas", vagas: 0, dias: 0 },
    reply_pack: { label: "Pack de Respostas", emoji: "📋", description: "Scripts para responder dúvidas", vagas: 0, dias: 0 }
};

// STRATEGY ENGINE
const generateWeeklyStrategy = (niche: NicheType): StrategyDay[] => {
    const commonPlan = [
        { day: 'Segunda', focus: 'Problema/Dor', format: 'Reels (Vídeo Curto)', topic: 'Identifique o erro nº 1 do seu cliente' },
        { day: 'Terça', focus: 'Solução/Educativo', format: 'Carrossel', topic: '5 Dicas para resolver X' },
        { day: 'Quarta', focus: 'Prova Social', format: 'Foto/Print', topic: 'Depoimento de cliente ou Case' },
        { day: 'Quinta', focus: 'Oferta Indireta', format: 'Stories', topic: 'Bastidores + Link' },
        { day: 'Sexta', focus: 'Oferta Direta (Venda)', format: 'Vídeo/Live', topic: 'Quebra de Objeção + Chamada' },
        { day: 'Sábado', focus: 'Lifestyle/Conexão', format: 'Foto Pessoal', topic: 'Lição aprendida na semana' },
        { day: 'Domingo', focus: 'Engajamento/Relax', format: 'Meme/Enquete', topic: 'Pergunta para a audiência' }
    ];

    // Customize per niche if needed (simplified for now)
    return commonPlan.map(day => {
        if (niche === 'saas' && day.day === 'Segunda') return { ...day, topic: 'O bug/problema que atrapalha o fluxo' };
        if (niche === 'ecommerce' && day.day === 'Sexta') return { ...day, topic: 'Cupom Flash ou Frete Grátis' };
        return day;
    });
};

// MESSAGE GENERATION
const generateCampaignCopy = (
    niche: NicheType,
    goal: CampaignGoal, // Changed from Channel
    business: BusinessIdentity, // Added Business Context
    tone: ToneType,
    link: string
): string => {
    // Context Adapter (Fallback or Mix)
    const ctx = {
        product: business.productName || "Seu Produto",
        pain: business.painPoint || "seus problemas",
        benefit: business.benefit || "a solução ideal",
        action: "clicar no link",
        offer: "Condição Especial"
    };

    let bundle = "";
    bundle += `🎯 ESTRATÉGIA: ${CAMPAIGN_GOALS[goal]?.label.toUpperCase()}\n`;
    bundle += `🗣️ TOM DE VOZ: ${TONES[tone]?.label}\n`;
    bundle += `------------------------------------------\n\n`;

    // 1. WHATSAPP & DIRECT
    bundle += `💬 WHATSAPP & MENSAGENS DIRETAS\n`;
    bundle += `(Dispare para seus grupos e lista de transmissão)\n\n`;
    bundle += `Msg 1 (Aquecimento): "Oi pessoal! Muita gente me pergunta sobre como resolver ${ctx.pain}. Preparei algo especial..."\n`;
    bundle += `Msg 2 (Oferta): "Chegou a hora! O ${ctx.product} está com uma condição única para garantir ${ctx.benefit}. Link: ${link}"\n\n`;

    // 2. SOCIAL MEDIA (Instagram/TikTok)
    bundle += `📸 REDES SOCIAIS (Feed & Stories)\n\n`;
    bundle += `🔥 LEGENDAS: \n`;
    bundle += `Option A (Curta): "Para de sofrer com ${ctx.pain}. Descubra o poder do ${ctx.product}. 👇"\n`;
    bundle += `Option B (Storytelling): "Eu lembro quando ${ctx.pain} era um pesadelo... Isso mudou com o ${ctx.product}. Quer saber como? Comente 'EU QUERO'."\n\n`;

    // 3. VIDEO SCRIPT
    bundle += `🎥 ROTEIRO DE REELS (30s)\n`;
    bundle += `00-03s: Você sabia que ${ctx.pain} tem solução?\n`;
    bundle += `03-15s: Apresento o ${ctx.product}, a chave para ${ctx.benefit}.\n`;
    bundle += `15-30s: Clique no link da bio e confira!\n\n`;

    // 4. EMAIL
    bundle += `📧 EMAIL MARKETING\n`;
    bundle += `Assunto: O fim do ${ctx.pain}?\n`;
    bundle += `Corpo: Olá! Se você busca ${ctx.benefit}, precisa ver isso agora: ${link}\n`;

    return bundle;
};

const generateMagicReply = (inputText: string, tone: ToneType, link: string): string => {
    // ... existing logic (abbreviated for brevity in this rewrite, assuming it works)
    // Actually, keeping the full logic is safer.
    const text = inputText.toLowerCase();
    let response = "";
    if (text.includes("preço") || text.includes("valor")) response = "O valor é super acessível! Custa menos que um café por dia. ☕";
    else if (text.includes("não funciona") || text.includes("erro")) response = "Poxa, sinto muito! 😔 Vamos resolver isso agora. Me chama no direct?";
    else if (text.includes("bom") || text.includes("gostei")) response = "Que demais! 😍 Ficamos felizes que você curtiu.";
    else response = "Obrigado pelo comentário! Se precisar de algo, estamos aqui. 👋";
    return response;
};

export default function CampaignGenerator() {
    const [activeTab, setActiveTab] = useState("overview");

    // NEW: Business Identity State
    const [businessId, setBusinessId] = useState<BusinessIdentity>({
        productName: "", description: "", targetAudience: "", painPoint: "", benefit: ""
    });

    const [wizard, setWizard] = useState<WizardState>({
        step: 0,
        niche: null, channel: null, selectedGroups: [], postType: null, tone: null, purpose: null
    });

    // NEW: Goal Selection (instead of just channel)
    const [campaignGoal, setCampaignGoal] = useState<CampaignGoal | null>(null);
    const [generated, setGenerated] = useState<GeneratedCampaign | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeCampaigns, setActiveCampaigns] = useState<CampaignRule[]>([]);
    const [metrics, setMetrics] = useState<CampaignMetrics>({ totalCampaigns: 0, totalRedemptions: 0, conversionRate: 0, topPerformer: "-" });
    const [strategyPlan, setStrategyPlan] = useState<StrategyDay[]>([]);

    // Edit States
    const [isEditingCopy, setIsEditingCopy] = useState(false);
    const [tempCopy, setTempCopy] = useState("");
    const [isEditingStrategy, setIsEditingStrategy] = useState(false);

    // Content Studio & Reply States
    const [searchTerm, setSearchTerm] = useState("");
    const [replyInput, setReplyInput] = useState("");
    const [replyOutput, setReplyOutput] = useState("");
    const [replyTone, setReplyTone] = useState<ToneType>("educational_authority");

    // Profiles
    const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>("new");

    useEffect(() => {
        loadActiveCampaigns();
        loadMetrics();
        // Load Profiles
        const saved = localStorage.getItem("kamp_profiles");
        if (saved) {
            setProfiles(JSON.parse(saved));
        }
    }, []);

    const handleSaveProfile = () => {
        if (!businessId.productName) {
            toast.error("Preencha o nome do produto primeiro!");
            return;
        }
        const name = prompt("Nome para este Perfil de Conta (ex: Minha Clínica, Loja X):");
        if (!name) return;

        const newProfile: BusinessProfile = {
            ...businessId,
            id: Date.now().toString(),
            profileName: name
        };

        const updated = [...profiles, newProfile];
        setProfiles(updated);
        localStorage.setItem("kamp_profiles", JSON.stringify(updated));
        setSelectedProfileId(newProfile.id);
        toast.success(`Perfil "${name}" salvo com sucesso!`);
    };

    const handleSelectProfile = (id: string) => {
        setSelectedProfileId(id);
        if (id === "new") {
            setBusinessId({ productName: "", description: "", targetAudience: "", painPoint: "", benefit: "" });
        } else {
            const profile = profiles.find(p => p.id === id);
            if (profile) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _, profileName: __, ...identity } = profile;
                setBusinessId(identity);
                toast.dismiss();
                toast.success(`Perfil "${profile.profileName}" carregado!`);
            }
        }
    };

    const loadActiveCampaigns = async () => {
        const campaigns = await CampaignService.listActiveCampaigns();
        setActiveCampaigns(campaigns);
    };

    const loadMetrics = async () => {
        try {
            const campaignsRef = collection(db, "campaigns");
            const q = query(campaignsRef, where("isActive", "==", true));
            const snapshot = await getDocs(q);
            const campaigns = snapshot.docs.map(doc => doc.data() as CampaignRule);
            const totalRedemptions = campaigns.reduce((sum, c) => sum + c.currentRedemptions, 0);
            const totalMax = campaigns.reduce((sum, c) => sum + c.maxRedemptions, 0);
            const topCampaign = [...campaigns].sort((a, b) => b.currentRedemptions - a.currentRedemptions)[0];
            setMetrics({
                totalCampaigns: campaigns.length,
                totalRedemptions,
                conversionRate: totalMax > 0 ? (totalRedemptions / totalMax) * 100 : 0,
                topPerformer: topCampaign?.code || "-"
            });
        } catch (error) {
            console.error("Error loading metrics:", error);
        }
    };

    const startWizard = () => setWizard({ ...wizard, step: 1 });

    // PREDICTIVE ENGINE
    const getRecommendations = (currentNiche: NicheType | null) => {
        if (!currentNiche) return { channel: null, tone: null, purpose: null, postType: null };

        switch (currentNiche) {
            case 'saas': return { channel: 'social', tone: 'educational_authority', purpose: 'educational_tips', postType: 'engagement' };
            case 'ecommerce': return { channel: 'social', tone: 'urgent_fomo', purpose: 'marketing_promo', postType: 'flash' };
            case 'infoproduct': return { channel: 'email', tone: 'emotional_founder', purpose: 'educational_tips', postType: 'keyword' };
            case 'real_estate': return { channel: 'whatsapp', tone: 'premium_aspirational', purpose: 'informative_news', postType: 'flash' };
            case 'services': return { channel: 'whatsapp', tone: 'educational_authority', purpose: 'educational_tips', postType: 'reply_pack' };
            default: return { channel: null, tone: null, purpose: null, postType: null };
        }
    };

    const recommendations = getRecommendations(wizard.niche);

    // Auto-generate strategy when Niche is selected
    useEffect(() => {
        if (wizard.niche) {
            setStrategyPlan(generateWeeklyStrategy(wizard.niche));
        }
    }, [wizard.niche]);

    const handlePreview = async () => {
        setIsGenerating(true);
        // Simulate "Thinking"
        await new Promise(r => setTimeout(r, 1500));

        // GENERATE LOGIC UPDATED FOR 2.0
        // Use CampaignGoal instead of deprecated postType
        let strategy: CampaignStrategy = 'flash'; // Default
        if (campaignGoal === 'weekly_planner') strategy = 'flash';
        if (campaignGoal === 'engagement_boost') strategy = 'engagement';
        if (campaignGoal === 'single_post') strategy = 'flash'; // Fallback

        const code = CampaignService.generateCode(strategy);
        const link = `https://app.horamed.net/auth?campaign=${code}`;

        const copy = generateCampaignCopy(
            wizard.niche!,
            campaignGoal!,
            businessId,
            wizard.tone!,
            link
        );

        setGenerated({
            code, link, copy, isSaved: false,
            metadata: {
                niche: wizard.niche!,
                channel: 'social', // Defaulting for typesafety until fully refactored
                tone: wizard.tone!,
                purpose: 'marketing_promo', // Default
                createdAt: new Date().toISOString()
            }
        });

        setIsGenerating(false);
        setTempCopy(copy);
        setActiveTab("detail_view");
    };

    const handleSaveCopyEdit = () => {
        if (generated) {
            setGenerated({ ...generated, copy: tempCopy });
            setIsEditingCopy(false);
            toast.success("Texto atualizado!");
        }
    };

    // Strategy Editor
    const updateStrategyDay = (index: number, field: keyof StrategyDay, value: string) => {
        const newPlan = [...strategyPlan];
        newPlan[index] = { ...newPlan[index], [field]: value };
        setStrategyPlan(newPlan);
    };

    const handleSaveCampaign = async () => {
        if (!generated) return;

        try {
            const strategy: CampaignStrategy = wizard.channel === "whatsapp"
                ? (wizard.selectedGroups.includes("vip_circle") ? "embaixador" : "whatsapp")
                : (wizard.postType || "engagement");

            const template = CAMPAIGN_TEMPLATES[strategy];
            const newCampaign: CampaignRule = {
                ...template,
                code: generated.code,
                createdAt: generated.metadata.createdAt,
                metadata: {
                    ...generated.metadata,
                    copy: generated.copy // Save the copy text!
                }
            };

            await CampaignService.createCampaign(newCampaign);
            setGenerated({ ...generated, isSaved: true });

            await loadActiveCampaigns();
            toast.success("Campanha salva com sucesso! 💾");
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("Erro ao salvar campanha.");
        }
    };

    const handleEditCampaign = (campaign: CampaignRule) => {
        const meta = campaign.metadata || {};

        // 1. Restore Wizard State
        const newWizardState: WizardState = {
            step: 5, // Jump to end
            niche: (meta.niche as NicheType) || null,
            channel: (meta.channel as ChannelType) || null,
            selectedGroups: (meta.groups as string[]) as GroupType[] || [],
            postType: (meta.postType as PostType) || null,
            tone: (meta.tone as ToneType) || null,
            purpose: (meta.purpose as PurposeType) || null,
        };

        setWizard(newWizardState);

        // 2. Restore Generated Content
        if (meta.copy) {
            setGenerated({
                code: campaign.code,
                link: `https://horamed.com/landing?c=${campaign.code}`,
                copy: meta.copy,
                isSaved: true,
                metadata: {
                    ...newWizardState,
                    createdAt: campaign.createdAt || new Date().toISOString()
                }
            });
            setTempCopy(meta.copy);

            // 3. Navigation
            setActiveTab("detail_view");
            toast.info(`Editando campanha: ${campaign.code}`);
        } else {
            toast.warning("Esta campanha não possui texto salvo para edição. (Campanha antiga?)");
            // Still allow editing settings? Maybe just navigate to wizard
            setActiveTab("create");
            setWizard({ ...newWizardState, step: 1 });
            toast.info("Configurações carregadas. Gere o conteúdo novamente.");
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado!");
    };

    return (
        <div className="min-h-screen bg-gradient-fluid-subtle p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border">
                            <Rocket className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">KAMP <span className="text-primary font-black">AGENCY</span></h1>
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">Marketing Life Manager</p>
                        </div>
                    </div>
                </div>

                {/* HIERARCHY FIXED: 
                    Level 1: Overview (Home), Create (Generator), Tools (Reply)
                    Level 2: Campaign Details (Hidden view active when 'generated' is set)
                */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Only show these tabs when NOT in 'detail' mode, OR show them always but handle 'detail' as a modal/overlay? 
                        User wants clarity. Let's keep them always visible but Detail is a separate state that overrides content if active.
                        Actually, let's use Tabs for the main sections. 'campaign_view' will be a tab without a trigger, programmatically activated.
                    */}
                    <TabsList className="flex flex-wrap justify-center gap-3 bg-transparent p-0 border-0 shadow-none mb-8 h-auto">
                        <TabsTrigger value="overview" className="px-6 py-3 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-50 hover:text-primary transition-all duration-300 min-w-[140px] flex items-center justify-center gap-2 font-medium">
                            <BarChart3 className="w-4 h-4" /> Visão Geral
                        </TabsTrigger>
                        <TabsTrigger value="create" className="px-6 py-3 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-50 hover:text-primary transition-all duration-300 min-w-[140px] flex items-center justify-center gap-2 font-medium">
                            <Rocket className="w-4 h-4" /> Criar Campanha
                        </TabsTrigger>
                        <TabsTrigger value="tools" className="px-6 py-3 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-slate-50 hover:text-primary transition-all duration-300 min-w-[140px] flex items-center justify-center gap-2 font-medium">
                            <MessageCircle className="w-4 h-4" /> Ferramentas
                        </TabsTrigger>
                    </TabsList>

                    {/* 1. VISÃO GERAL (DASHBOARD + LIST) */}
                    <TabsContent value="overview">
                        <div className="space-y-8">
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-6 bg-white/60 border-0 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Target className="w-6 h-6" /></div>
                                    <div><div className="text-muted-foreground text-sm font-medium">Campanhas Ativas</div><div className="text-2xl font-bold text-foreground">{metrics.totalCampaigns}</div></div>
                                </Card>
                                <Card className="p-6 bg-green-100/60 border-0 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
                                    <div><div className="text-muted-foreground text-sm font-medium">Total Resgates</div><div className="text-2xl font-bold text-foreground">{metrics.totalRedemptions}</div></div>
                                </Card>
                                <Card className="p-6 bg-teal-100/60 border-0 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
                                    <div><div className="text-muted-foreground text-sm font-medium">Taxa de Conversão</div><div className="text-2xl font-bold text-foreground">{metrics.conversionRate}%</div></div>
                                </Card>
                            </div>

                            {/* Active Campaigns List */}
                            <Card className="glass-card p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">Minhas Campanhas</h2>
                                    <Button size="sm" variant="outline" onClick={() => { setWizard({ ...wizard, step: 0 }); setActiveTab("create"); }}>Nova Campanha</Button>
                                </div>

                                <div className="space-y-3">
                                    {activeCampaigns.map(c => (
                                        <div key={c.code} className="group flex flex-col md:flex-row justify-between items-center p-4 bg-white hover:bg-slate-50 border rounded-xl shadow-sm transition-all cursor-pointer" onClick={() => handleEditCampaign(c)}>
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="p-3 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                    <FileText className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">{c.code}</div>
                                                    <div className="text-xs text-muted-foreground flex gap-2">
                                                        <span>{new Date(c.createdAt || "").toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{c.description}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-foreground">{c.currentRedemptions}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase">Conv.</div>
                                                </div>
                                                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                                                <Button size="sm" variant="default" className="opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalhes</Button>
                                            </div>
                                        </div>
                                    ))}
                                    {activeCampaigns.length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="text-slate-400" /></div>
                                            <h3 className="text-muted-foreground font-medium">Nenhuma campanha encontrada</h3>
                                            <Button variant="link" onClick={() => setActiveTab("create")}>Criar a primeira</Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* 2. CREATE (WIZARD) */}
                    <TabsContent value="create">
                        <Card className="glass-card p-8 min-h-[550px] overflow-hidden border-white/30 relative">
                            {/* Decorative Blobs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-blob" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10 animate-blob delay-1000" />

                            {/* PROGRESS BAR */}
                            <div className="mb-8 relative z-10">
                                <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                    <span className={wizard.step >= 1 ? "text-primary" : ""}>DNA</span>
                                    <span className={wizard.step >= 2 ? "text-primary" : ""}>Objetivo</span>
                                    <span className={wizard.step >= 3 ? "text-primary" : ""}>Tom de Voz</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-fluid"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(wizard.step / 3) * 100}%` }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    />
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {wizard.step === 0 && (
                                    <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-16">
                                        <div className="w-24 h-24 bg-gradient-fluid rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3 hover:rotate-6 transition-transform duration-500">
                                            <Rocket className="w-12 h-12 text-white" />
                                        </div>
                                        <h2 className="text-4xl font-bold mb-4 tracking-tight text-foreground">Vamos criar sua próxima campanha?</h2>
                                        <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10 leading-relaxed">
                                            O KAMP Agency usa inteligência preditiva para criar pacotes completos de marketing (Copy, Scripts, Emails) adaptados ao seu nicho.
                                        </p>
                                        <Button onClick={startWizard} size="lg" className="btn-fluid px-16 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                                            Começar Agora <ArrowRight className="ml-2 w-6 h-6" />
                                        </Button>
                                    </motion.div>
                                )}

                                {wizard.step === 1 && (
                                    <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-8">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-bold mb-2">DNA do Negócio</h2>
                                            <p className="text-muted-foreground">Configure a identidade fundamental para esta campanha.</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                                            {/* PROFILE MANAGEMENT */}
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                                                <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                                                    <div className="bg-white p-2 rounded-lg border shadow-sm"><Users className="w-5 h-5 text-primary" /></div>
                                                    <div className="space-y-1 w-full">
                                                        <Label htmlFor="profile-select" className="text-xs font-bold uppercase text-muted-foreground">Perfil da Conta</Label>
                                                        <Select value={selectedProfileId} onValueChange={handleSelectProfile}>
                                                            <SelectTrigger id="profile-select" className="bg-white border-slate-200 h-9 text-sm">
                                                                <SelectValue placeholder="Selecione um perfil..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="new"><span className="flex items-center gap-2"><PlusCircle className="w-3 h-3" /> Criar Novo Perfil</span></SelectItem>
                                                                {profiles.map(p => (
                                                                    <SelectItem key={p.id} value={p.id}>{p.profileName}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" onClick={handleSaveProfile} className="w-full md:w-auto whitespace-nowrap bg-white hover:bg-slate-50 border-slate-200 text-muted-foreground hover:text-primary">
                                                    <Save className="w-3 h-3 mr-2" /> Salvar Perfil Atual
                                                </Button>
                                            </div>

                                            {/* NICHE SELECTOR */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                                                {Object.entries(NICHES).map(([key, item]) => (
                                                    <div key={key} onClick={() => {
                                                        setWizard({ ...wizard, niche: key as NicheType });
                                                        // Magic Autofill Logic
                                                        if (!businessId.productName) {
                                                            const suggestions: Record<string, Partial<BusinessIdentity>> = {
                                                                saas: { productName: "App de Gestão", painPoint: "Falta de organização", benefit: "Mais tempo livre", targetAudience: "Pequenos empresários" },
                                                                ecommerce: { productName: "Coleção Verão", painPoint: "Roupas sem estilo", benefit: "Elegância e conforto", targetAudience: "Mulheres modernas" },
                                                                infoproduct: { productName: "Curso de Marketing", painPoint: "Não sabe vender", benefit: "Vendas diárias", targetAudience: "Empreendedores" },
                                                                services: { productName: "Consultoria Financeira", painPoint: "Dívidas acumuladas", benefit: "Liberdade financeira", targetAudience: "Famílias" },
                                                                real_estate: { productName: "Apartamento Centro", painPoint: "Aluguel caro", benefit: "Casa própria", targetAudience: "Casais jovens" }
                                                            };
                                                            setBusinessId({ ...businessId, ...suggestions[key] });
                                                        }
                                                    }}
                                                        className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${wizard.niche === key ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'hover:bg-muted'}`}>
                                                        <div className="text-2xl mb-1">{item.emoji}</div>
                                                        <div className="text-[10px] font-bold uppercase tracking-wide">{item.label}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label>Nome do Produto/Serviço</Label>
                                                        <Input placeholder="Ex: Dr. Consulta, Curso de Inglês..." value={businessId.productName} onChange={e => setBusinessId({ ...businessId, productName: e.target.value })} className="bg-white/50" />
                                                    </div>
                                                    <div>
                                                        <Label>Público Alvo</Label>
                                                        <Input placeholder="Ex: Mães, Empresários..." value={businessId.targetAudience} onChange={e => setBusinessId({ ...businessId, targetAudience: e.target.value })} className="bg-white/50" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label>Maior Dor (Problema)</Label>
                                                    <Input placeholder="Ex: Falta de tempo, dor nas costas..." value={businessId.painPoint} onChange={e => setBusinessId({ ...businessId, painPoint: e.target.value })} className="bg-white/50" />
                                                </div>

                                                <div>
                                                    <Label>Maior Benefício (Solução)</Label>
                                                    <Input placeholder="Ex: Emagrecer em 30 dias, Economizar..." value={businessId.benefit} onChange={e => setBusinessId({ ...businessId, benefit: e.target.value })} className="bg-white/50" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {wizard.step === 2 && (
                                    <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-8">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-bold mb-2">Qual o Objetivo Hoje?</h2>
                                            <p className="text-muted-foreground">Escolha a estratégia para gerar o plano de ação.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {Object.entries(CAMPAIGN_GOALS).map(([key, item]) => (
                                                <motion.div
                                                    whileHover={{ scale: 1.03, y: -5 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    key={key}
                                                    onClick={() => setCampaignGoal(key as CampaignGoal)}
                                                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${campaignGoal === key ? 'border-primary bg-primary/5 shadow-lg ring-1 ring-primary' : 'bg-white/60 border-transparent hover:bg-white hover:shadow-md'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="text-3xl p-3 bg-white rounded-full shadow-sm">{item.emoji}</div>
                                                        {campaignGoal === key && <CheckCircle2 className="text-primary w-6 h-6" />}
                                                    </div>
                                                    <div className="font-bold text-lg mb-2">{item.label}</div>
                                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Dynamic Input for Strategy Context */}
                                        <AnimatePresence>
                                            {campaignGoal === 'flash_launch' && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 mt-6">
                                                        <div className="flex gap-4 items-start">
                                                            <div className="p-3 bg-white rounded-full shadow-sm">💰</div>
                                                            <div className="flex-1 space-y-4">
                                                                <div>
                                                                    <Label className="text-primary font-bold">Qual é a oferta irresistível?</Label>
                                                                    <p className="text-xs text-muted-foreground mb-2">Isso será usado para criar a urgência nos textos.</p>
                                                                    <Input
                                                                        placeholder="Ex: 50% OFF apenas nas próximas 24h..."
                                                                        onChange={(e) => setBusinessId(prev => ({ ...prev, benefit: e.target.value + " (Oferta Flash)" }))}
                                                                        className="bg-white"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}

                                {wizard.step === 3 && (
                                    <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-8">
                                        <div className="text-center">
                                            <h2 className="text-3xl font-bold mb-2">Tom de Voz & Personalidade</h2>
                                            <p className="text-muted-foreground">Como sua marca deve soar?</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                            {Object.entries(TONES).map(([key, item]) => (
                                                <motion.div
                                                    whileHover={{ scale: 1.03 }}
                                                    onClick={() => setWizard({ ...wizard, tone: key as ToneType })}
                                                    key={key}
                                                    className={`p-6 rounded-xl border-2 cursor-pointer text-center space-y-3 transition-all ${wizard.tone === key ? 'border-primary bg-primary/10' : 'bg-white hover:border-slate-300'}`}
                                                >
                                                    <div className="text-4xl">{item.emoji}</div>
                                                    <div className="font-bold">{item.label}</div>
                                                    <div className="text-xs text-muted-foreground">{item.description}</div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}


                                {wizard.step === 4 && (
                                    <motion.div key="stepLast" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-20">
                                        <div className="mb-8">
                                            <div className="inline-block p-6 rounded-full bg-primary/10 mb-4 animate-pulse">
                                                <Rocket className="w-12 h-12 text-primary" />
                                            </div>
                                            <h2 className="text-3xl font-bold mb-2">Tudo pronto!</h2>
                                            <p className="text-muted-foreground">O KAMP Agency vai gerar sua estratégia agora.</p>
                                        </div>
                                        <div className="flex justify-center gap-4">
                                            <Button variant="outline" onClick={() => setWizard({ ...wizard, step: 3 })}>Revisar</Button>
                                            <Button size="lg" onClick={handlePreview} disabled={isGenerating} className="px-12">
                                                {isGenerating ? "Gerando..." : "Gerar Campanha 🚀"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* NAVIGATION BUTTONS */}
                            {(wizard.step > 0 && wizard.step < 4) && (
                                <motion.div className="flex justify-between max-w-2xl mx-auto mt-12 pt-8 border-t">
                                    <Button variant="ghost" className="hover:bg-white/50" onClick={() => setWizard({ ...wizard, step: wizard.step - 1 })}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
                                    <Button className="rounded-xl px-8 shadow-md hover:shadow-lg transition-all" onClick={() => setWizard({ ...wizard, step: wizard.step + 1 })} disabled={
                                        (wizard.step === 1 && (!wizard.niche || !businessId.productName)) ||
                                        (wizard.step === 2 && !campaignGoal) ||
                                        (wizard.step === 3 && !wizard.tone)
                                    }>
                                        Continuar <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </motion.div>
                            )}
                        </Card>
                    </TabsContent>

                    {/* 3. FERRAMENTAS (Replies) */}
                    <TabsContent value="tools">
                        <Card className="glass-card p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5" /> Comentário do Usuário
                                </h3>
                                <textarea value={replyInput} onChange={(e) => setReplyInput(e.target.value)}
                                    className="w-full h-32 p-4 rounded-xl border bg-white/50 focus:ring-2 focus:ring-primary/20 resize-none"
                                    placeholder="Cole aqui a mensagem recebida..." />
                                <div className="space-y-2">
                                    <Label>Tom da Resposta</Label>
                                    <Select value={replyTone} onValueChange={(v: ToneType) => setReplyTone(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TONES).map(([k, t]) => <SelectItem key={k} value={k}>{t.emoji} {t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={() => {
                                    if (!replyInput) return toast.error("Digite algo!");
                                    setReplyOutput(generateMagicReply(replyInput, replyTone, "https://horamed.net"));
                                    toast.success("Gerado!");
                                }} className="w-full btn-fluid">Gerar Resposta</Button>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Rocket className="w-5 h-5 text-green-600" /> Sugestão de Resposta
                                </h3>
                                <div className="h-32 p-4 rounded-xl border bg-white flex items-center justify-center text-sm text-center italic text-muted-foreground">
                                    {replyOutput || "A resposta aparecerá aqui..."}
                                </div>
                                {replyOutput && <Button variant="outline" className="w-full" onClick={() => handleCopy(replyOutput)}>Copiar</Button>}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* HIDDEN VIEW: DETALHES DA CAMPANHA */}
                    {/* This View is activated programmatically and hides the main tabs */}
                    <TabsContent value="detail_view">
                        <div className="mb-6 flex items-center gap-4">
                            <Button variant="ghost" onClick={() => setActiveTab("overview")}><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel</Button>
                            <div className="h-6 w-px bg-slate-300"></div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {generated ? (
                                    <>
                                        <span className="text-muted-foreground font-medium">Campanha:</span>
                                        {businessId.productName || generated.code}
                                        {generated.isSaved && <Badge variant="outline" className="ml-2 border-green-500 text-green-600 bg-green-50"><Check className="w-3 h-3 mr-1" /> Salvo</Badge>}
                                    </>
                                ) : "Detalhes da Campanha"}
                            </h2>
                            <div className="ml-auto">
                                <Button onClick={handleSaveCampaign} disabled={generated?.isSaved} className={generated?.isSaved ? "bg-green-600 hover:bg-green-700" : ""}>
                                    {generated?.isSaved ? <><Check className="w-4 h-4 mr-2" /> Salvo</> : <><Save className="w-4 h-4 mr-2" /> Salvar Campanha</>}
                                </Button>
                            </div>
                        </div>

                        {generated && (
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-5 lg:w-[750px] mb-8">
                                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                                    <TabsTrigger value="schedule">Cronograma</TabsTrigger>
                                    <TabsTrigger value="flows">Fluxos</TabsTrigger>
                                    <TabsTrigger value="copy">Textos</TabsTrigger>
                                    <TabsTrigger value="creative">Criativos</TabsTrigger>
                                </TabsList>

                                {/* VISÃO GERAL */}
                                <TabsContent value="overview">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="p-6 space-y-4 shadow-md bg-gradient-to-br from-white to-primary/5 border-primary/10">
                                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> DNA da Campanha</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between border-b pb-2 border-primary/10">
                                                    <span className="text-muted-foreground">Objetivo</span>
                                                    <span className="font-medium flex items-center gap-2 bg-white px-2 py-0.5 rounded shadow-sm">{CAMPAIGN_GOALS[campaignGoal!]?.emoji} {CAMPAIGN_GOALS[campaignGoal!]?.label}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-2 border-primary/10">
                                                    <span className="text-muted-foreground">Tom de Voz</span>
                                                    <span className="font-medium bg-white px-2 py-0.5 rounded shadow-sm">{TONES[generated.metadata.tone]?.label}</span>
                                                </div>
                                                <div className="pt-2">
                                                    <span className="text-muted-foreground text-xs uppercase tracking-wide">Big Idea</span>
                                                    <p className="font-medium text-lg leading-tight mt-1 text-primary">"{businessId.benefit}"</p>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="p-6 bg-white shadow-md border-primary/10">
                                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-teal-600" /> Tema Visual Sugerido</h3>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`w-16 h-16 rounded-full shadow-inner flex items-center justify-center text-3xl
                                                        ${generated.metadata.tone.includes('premium') ? 'bg-slate-900 text-white' :
                                                        generated.metadata.tone.includes('funny') ? 'bg-yellow-400 text-black' :
                                                            'bg-blue-600 text-white'}`}
                                                >
                                                    🎨
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg">
                                                        {generated.metadata.tone.includes('premium') ? 'Minimalist Luxury' :
                                                            generated.metadata.tone.includes('funny') ? 'Vibrant Pop' :
                                                                'Clean Professional'}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {generated.metadata.tone.includes('premium') ? 'Use preto, dourado e fontes serifadas. Muito espaço em branco.' :
                                                            generated.metadata.tone.includes('funny') ? 'Cores vivas, emojis e fontes bold. Alto contraste.' :
                                                                'Azul, branco e cinza. Fontes sans-serif modernas.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* CRONOGRAMA */}
                                <TabsContent value="schedule">
                                    <Card className="p-6 border-0 shadow-none bg-transparent">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-bold text-xl flex items-center gap-2">📅 Roteiro de 7 Dias</h3>
                                            <Button variant="outline" size="sm"><ArrowDownToLine className="w-4 h-4 mr-2" /> Baixar PDF</Button>
                                        </div>
                                        <div className="space-y-3">
                                            {strategyPlan.map((day, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all group">
                                                    <div className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg text-sm min-w-[90px] text-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                        {day.day}
                                                    </div>
                                                    <div className="h-8 w-px bg-slate-200"></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-slate-800">{day.focus}</span>
                                                            <Badge variant="secondary" className="text-[10px] h-5">{day.format}</Badge>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground italic">"{day.topic}"</div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"><Copy className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </TabsContent>

                                {/* FLUXOS */}
                                <TabsContent value="flows">
                                    <Card className="p-8 bg-slate-50 border-dashed border-2">
                                        <h3 className="font-bold text-lg mb-8 flex items-center gap-2"><GitGraph className="w-5 h-5 text-primary" /> Jornada do Cliente (Suggested Flow)</h3>
                                        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 max-w-4xl mx-auto">
                                            {/* Step 1 */}
                                            <div className="relative z-10 text-center w-full md:w-1/3">
                                                <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-4">
                                                    👋
                                                </div>
                                                <h4 className="font-bold">1. Atração</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Reels & Stories</p>
                                                <div className="bg-white p-3 rounded mt-2 border text-xs text-left shadow-sm">
                                                    "Descubra o erro..."
                                                </div>
                                            </div>

                                            {/* Connector */}
                                            <div className="hidden md:block absolute top-[2rem] left-0 w-full h-1 bg-slate-200 -z-0"></div>

                                            {/* Step 2 */}
                                            <div className="relative z-10 text-center w-full md:w-1/3">
                                                <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-4">
                                                    💬
                                                </div>
                                                <h4 className="font-bold">2. Conexão</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Direct / WhatsApp</p>
                                                <div className="bg-white p-3 rounded mt-2 border text-xs text-left shadow-sm">
                                                    "Oi! Vi que curtiu..."
                                                </div>
                                            </div>

                                            {/* Step 3 */}
                                            <div className="relative z-10 text-center w-full md:w-1/3">
                                                <div className="w-16 h-16 mx-auto bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-4">
                                                    💰
                                                </div>
                                                <h4 className="font-bold">3. Conversão</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Página de Vendas</p>
                                                <div className="bg-white p-3 rounded mt-2 border text-xs text-left shadow-sm">
                                                    "Oferta {businessId.benefit}"
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                {/* COPY */}
                                <TabsContent value="copy">
                                    <Card className="p-0 overflow-hidden bg-white border shadow-sm rounded-xl">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 border-b">
                                            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground"><FileText className="w-4 h-4" /> Scripts Gerados</h3>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleCopy(generated.copy)}>
                                                    <Copy className="w-3 h-3 mr-2" /> Copiar Tudo
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-3">
                                            <div className="col-span-1 border-r bg-slate-50/50 p-4 space-y-2">
                                                <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Índice</div>
                                                <div className="p-2 bg-white border rounded cursor-pointer hover:border-primary text-sm font-medium transition-colors">🎯 Estratégia Geral</div>
                                                <div className="p-2 bg-white border rounded cursor-pointer hover:border-primary text-sm font-medium transition-colors">💬 WhatsApp Scripts</div>
                                                <div className="p-2 bg-white border rounded cursor-pointer hover:border-primary text-sm font-medium transition-colors">📸 Legendas Instagram</div>
                                                <div className="p-2 bg-white border rounded cursor-pointer hover:border-primary text-sm font-medium transition-colors">📧 Email Sequence</div>
                                            </div>
                                            <div className="col-span-2">
                                                <Textarea
                                                    value={generated.copy}
                                                    readOnly
                                                    className="h-full min-h-[500px] font-mono text-sm leading-relaxed p-6 focus-visible:ring-0 border-0 resize-none bg-white"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                </TabsContent>

                                {/* CREATIVE */}
                                <TabsContent value="creative">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="p-6 space-y-4 border-dashed border-2 hover:border-primary/50 transition-colors bg-slate-50/50">
                                            <div className="aspect-video bg-white rounded-xl shadow-sm border flex items-center justify-center overflow-hidden relative group">
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                                <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl drop-shadow-md z-10 w-3/4 leading-tight">{businessId.benefit}</h3>
                                                <ImageIcon className="w-12 h-12 text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-600" /> Capa para Reels/Stories</h4>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    <strong>Visual:</strong> Foto sua em alta resolução, fundo {generated.metadata.tone.includes('premium') ? 'neutro escuro' : 'vibrante'}.<br />
                                                    <strong>Elemento:</strong> Texto grande em destaque, seta apontando para baixo.<br />
                                                    <strong>Emoção:</strong> {generated.metadata.tone.includes('funny') ? 'Surpresa exagerada' : 'Confiança serena'}.
                                                </p>
                                            </div>
                                            <Button className="w-full" variant="outline" disabled>Gerar Variações (IA)</Button>
                                        </Card>

                                        <Card className="p-6 space-y-4 border-dashed border-2 bg-slate-50/50">
                                            <div className="aspect-square bg-slate-900 rounded-xl shadow-sm flex items-center justify-center relative overflow-hidden">
                                                <div className="text-center text-white px-6">
                                                    <div className="text-4xl font-black mb-2 tracking-tighter">STOP!</div>
                                                    <div className="text-sm border-t border-white/30 pt-2 opacity-80">Pare de ignorar {businessId.painPoint}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Roteiro Visual (Hook)</h4>
                                                <ul className="text-sm space-y-2 mt-2 list-none text-muted-foreground">
                                                    <li className="flex gap-2"><span className="font-bold text-primary">0-3s:</span> Texto piscando "PARE AGORA" + Som de freio.</li>
                                                    <li className="flex gap-2"><span className="font-bold text-primary">3-15s:</span> Você entra em cena e fala: "Você ainda está cometendo esse erro..."</li>
                                                    <li className="flex gap-2"><span className="font-bold text-primary">CTA:</span> Aponte para a legenda.</li>
                                                </ul>
                                            </div>
                                        </Card>
                                    </div>
                                </TabsContent>
                            </Tabs>

                        )}
                    </TabsContent>

                    {/* 3. ESTRATÉGIA (MANAGER) */}


                </Tabs>
            </div>
        </div >
    );
}

