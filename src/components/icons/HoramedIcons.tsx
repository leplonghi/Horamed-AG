import React from "react";
import { cn } from "@/lib/utils";
import { 
    Sun, 
    Pill, 
    Pulse, 
    Wallet, 
    User, 
    Bell, 
    Crown, 
    CalendarBlank, 
    ClockCounterClockwise, 
    Clock,
    MagicWand, 
    PlusCircle, 
    ArrowLeft, 
    CaretRight, 
    ArrowRight, 
    CaretLeft, 
    CaretUp, 
    CaretDown, 
    MapPin, 
    Stethoscope, 
    Lightning, 
    XCircle, 
    Check, 
    Info, 
    WarningCircle, 
    Sparkle, 
    CreditCard, 
    Article, 
    MagnifyingGlass, 
    Camera, 
    Trash, 
    ArrowsCounterClockwise, 
    Smiley, 
    SmileyMeh, 
    SmileySad, 
    Flask as TestTube, 
    Syringe, 
    Microphone, 
    CircleNotch, 
    Users, 
    Gear, 
    SignOut, 
    Question, 
    Shield, 
    Star, 
    Gift, 
    ChartBar as Chart, 
    FileText, 
    ShareNetwork, 
    Download, 
    Upload, 
    ArrowSquareOut, 
    Pencil, 
    Archive, 
    ChartLineUp, 
    CheckCircle, 
    Prohibit, 
    Heartbeat, 
    Warning as AlertTriangle, 
    MicrophoneSlash, 
    SpeakerHigh, 
    ForkKnife, 
    AddressBook, 
    FolderOpen, 
    ThermometerHot, 
    Scales,
    IconProps as PhosphorIconProps
} from "@phosphor-icons/react";

/**
 * HORAMED CUSTOM ICON SET - "PREMIUM V2"
 * Estilo: Phosphor Duotone (Global Workflow).
 * Cores: Suporta currentColor para integração total com o tema do app.
 * Estrutura: Agora utilizando @phosphor-icons/react para consistência arquitetural.
 */

export interface IconProps extends PhosphorIconProps {
    className?: string;
}

// Helper to wrap Phosphor icons with our style if needed
const wrapIcon = (IconComponent: React.ElementType) => {
    return ({ className, ...props }: IconProps) => (
        <IconComponent 
            className={cn("flex-shrink-0 transition-all duration-300", className)} 
            {...props} 
        />
    );
};

// --- NAVEGAÇÃO PRINCIPAL ---
export const IconToday = wrapIcon(Sun);
export const IconMedications = wrapIcon(Pill);
export const IconPill = wrapIcon(Pill);
export const IconHealth = wrapIcon(Pulse);
export const IconWallet = wrapIcon(Wallet);
export const IconProfile = wrapIcon(User);

// --- UTILITÁRIOS ---
export const IconBell = wrapIcon(Bell);
export const IconCrown = wrapIcon(Crown);
export const IconCalendar = wrapIcon(CalendarBlank);
export const IconHistory = wrapIcon(ClockCounterClockwise);
export const IconClock = wrapIcon(Clock);
export const IconAI = wrapIcon(MagicWand);
export const IconPlus = wrapIcon(PlusCircle);
export const IconArrowLeft = wrapIcon(ArrowLeft);
export const IconChevronRight = wrapIcon(CaretRight);
export const IconArrowRight = wrapIcon(ArrowRight);
export const IconChevronLeft = wrapIcon(CaretLeft);
export const IconChevronUp = wrapIcon(CaretUp);
export const IconChevronDown = wrapIcon(CaretDown);
export const IconMapPin = wrapIcon(MapPin);
export const IconStethoscope = wrapIcon(Stethoscope);
export const IconEmergency = wrapIcon(Lightning);
export const IconClose = wrapIcon(XCircle);
export const IconCheck = wrapIcon(Check);
export const IconInfo = wrapIcon(Info);
export const IconAlertCircle = wrapIcon(WarningCircle);
export const IconSparkles = wrapIcon(Sparkle);
export const IconPlansPremium = wrapIcon(CreditCard);
export const IconPlansFree = wrapIcon(Article);
export const IconPlans = wrapIcon(CreditCard);
export const IconSearch = wrapIcon(MagnifyingGlass);
export const IconCamera = wrapIcon(Camera);
export const IconTrash = wrapIcon(Trash);
export const IconTrash2 = wrapIcon(Trash);
export const IconRefresh = wrapIcon(ArrowsCounterClockwise);
export const IconSmile = wrapIcon(Smiley);
export const IconMeh = wrapIcon(SmileyMeh);
export const IconFrown = wrapIcon(SmileySad);
export const IconActivity = wrapIcon(Pulse);
export const IconTestTube = wrapIcon(TestTube);
export const IconSyringe = wrapIcon(Syringe);
export const IconMic = wrapIcon(Microphone);
export const IconLoader = wrapIcon(CircleNotch);
export const IconLoading = wrapIcon(CircleNotch);
export const IconUsers = wrapIcon(Users);
export const IconSettings = wrapIcon(Gear);
export const IconGear = wrapIcon(Gear);
export const IconSignOut = wrapIcon(SignOut);
export const IconQuestion = wrapIcon(Question);
export const IconUser = wrapIcon(User);
export const IconShield = wrapIcon(Shield);
export const IconStar = wrapIcon(Star);
export const IconZap = wrapIcon(Lightning);
export const IconGift = wrapIcon(Gift);
export const IconChart = wrapIcon(Chart);
export const IconFile = wrapIcon(FileText);
export const IconFileText = wrapIcon(FileText);
export const IconShare = wrapIcon(ShareNetwork);
export const IconShareNetwork = wrapIcon(ShareNetwork);
export const IconDownload = wrapIcon(Download);
export const IconUpload = wrapIcon(Upload);
export const IconExternalLink = wrapIcon(ArrowSquareOut);
export const IconSquareOut = wrapIcon(ArrowSquareOut);
export const IconPencil = wrapIcon(Pencil);
export const IconArchive = wrapIcon(Archive);
export const IconTrendingUp = wrapIcon(ChartLineUp);
export const IconEdit = wrapIcon(Pencil);
export const IconCheckCircle = wrapIcon(CheckCircle);
export const IconBan = wrapIcon(Prohibit);
export const IconHeartPulse = wrapIcon(Heartbeat);
export const IconAlertTriangle = wrapIcon(AlertTriangle);
export const IconMicOff = wrapIcon(MicrophoneSlash);
export const IconVolume = wrapIcon(SpeakerHigh);
export const IconSilverware = wrapIcon(ForkKnife);
export const IconProviders = wrapIcon(AddressBook);
export const IconFolderOpen = wrapIcon(FolderOpen);
export const IconThermometer = wrapIcon(ThermometerHot);
export const IconWeight = wrapIcon(Scales);

