import { cn } from "@/lib/utils";

/**
 * HORAMED CUSTOM ICON SET - "PREMIUM V2"
 * Estilo: Nanobanana 2 + Duo-tone geométrico.
 * Cores: Suporta currentColor para integração total com o tema do app.
 * Estrutura: Traço principal (2px) + Detalhes de suporte (1.2px) para profundidade.
 */

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    strokeWidth?: number;
}

const BaseIcon = ({ children, size = 24, strokeWidth = 1.8, className, ...props }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("flex-shrink-0 transition-all duration-300", className)}
        {...props}
    >
        {children}
    </svg>
);

// --- NAVEGAÇÃO PRINCIPAL (COM MAIS DETALHE) ---

export const IconToday = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeOpacity="0.4" />
        <circle cx="12" cy="12" r="4" />
        <path d="M9 12h6" strokeOpacity="0.6" strokeWidth="1.2" />
    </BaseIcon>
);

export const IconMedications = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M17 7l-10 10" strokeOpacity="0.5" strokeWidth="1.2" />
        <rect x="5" y="5" width="14" height="14" rx="7" transform="rotate(45 12 12)" />
        <path d="M12 12l2.5-2.5" />
    </BaseIcon>
);

export const IconPill = IconMedications;

export const IconHealth = (props: IconProps) => (
    <BaseIcon {...props}>
        <rect x="3" y="10" width="18" height="10" rx="2" strokeOpacity="0.3" />
        <path d="M3 14h3l2-5 4 10 3-8 2 3h3" />
    </BaseIcon>
);

export const IconWallet = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M20 10V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-4" />
        <path d="M21 10h-4a2 2 0 000 4h4" />
        <circle cx="18" cy="12" r="1" fill="currentColor" />
    </BaseIcon>
);

export const IconProfile = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
        <path d="M20 21a8 8 0 0 0-16 0" />
        <path d="M12 12v3" strokeOpacity="0.4" strokeWidth="1" />
    </BaseIcon>
);

// --- UTILITÁRIOS ---

export const IconBell = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        <circle cx="12" cy="3" r="1" fill="currentColor" />
    </BaseIcon>
);

export const IconCrown = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M2 18h20L20 7l-4 4-4-7-4 7-4-4L2 18z" />
        <path d="M7 14h10" strokeOpacity="0.4" strokeWidth="1" />
    </BaseIcon>
);

export const IconCalendar = (props: IconProps) => (
    <BaseIcon {...props}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeWidth="1.5" />
    </BaseIcon>
);

export const IconHistory = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="9" />
        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" strokeOpacity="0.2" />
    </BaseIcon>
);

export const IconClock = IconHistory;

export const IconAI = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 8v8M8 12h8" />
        <path d="M15 9l-6 6M9 9l6 6" />
        <circle cx="12" cy="12" r="3" />
    </BaseIcon>
);

export const IconPlus = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M12 8v8M8 12h8" />
    </BaseIcon>
);

export const IconArrowLeft = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </BaseIcon>
);

export const IconChevronRight = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M9 18l6-6-6-6" />
    </BaseIcon>
);

export const IconArrowRight = IconChevronRight;

export const IconChevronLeft = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M15 18l-6-6 6-6" />
    </BaseIcon>
);

export const IconChevronUp = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M18 15l-6-6-6 6" />
    </BaseIcon>
);

export const IconChevronDown = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M6 9l6 6 6-6" />
    </BaseIcon>
);

export const IconMapPin = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </BaseIcon>
);

export const IconStethoscope = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3Z" fill="currentColor" />
        <path d="M10 2v2a5 5 0 0 0 10 0V2" />
        <path d="M7 10v4a5 5 0 0 0 10 0v-4" />
        <path d="M12 14v4" />
        <circle cx="12" cy="19" r="2" />
    </BaseIcon>
);

export const IconEmergency = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </BaseIcon>
);

export const IconClose = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
        <path d="M15 9l-6 6M9 9l6 6" />
    </BaseIcon>
);

export const IconCheck = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M20 6L9 17l-5-5" />
    </BaseIcon>
);

export const IconInfo = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
    </BaseIcon>
);

export const IconAlertCircle = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
    </BaseIcon>
);

export const IconSparkles = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M12 3l1.5 4.5 4.5 1.5-4.5 1.5L12 15l-1.5-4.5-4.5-1.5 4.5-1.5L12 3z" />
        <path d="M5 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM19 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" strokeOpacity="0.5" />
    </BaseIcon>
);

export const IconPlansPremium = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M3 7h18" strokeOpacity="0.3" />
        <path d="M3 12h18" strokeOpacity="0.5" />
        <path d="M3 17h12" />
        <rect x="2" y="4" width="20" height="16" rx="3" strokeWidth="1" strokeOpacity="0.2" />
        <circle cx="18" cy="17" r="3" stroke="currentColor" fill="currentColor" fillOpacity="0.1" />
        <path d="M18 15.5v3M16.5 17h3" strokeWidth="1.2" />
        <path d="M7 11l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.8" />
    </BaseIcon>
);

export const IconPlansFree = (props: IconProps) => (
    <BaseIcon {...props}>
        <rect x="3" y="4" width="18" height="16" rx="3" strokeOpacity="0.4" />
        <path d="M7 8h10M7 12h10M7 16h6" strokeWidth="1.2" strokeOpacity="0.6" />
        <path d="M16 16c.5 0 1 .5 1 1s-.5 1-1 1s-1-.5-1-1s.5-1 1-1" fill="currentColor" />
    </BaseIcon>
);

export const IconPlans = IconPlansPremium;

export const IconSearch = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </BaseIcon>
);

export const IconCamera = (props: IconProps) => (
    <BaseIcon {...props}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <circle cx="12" cy="13" r="3" />
        <path d="M13.5 6l-1-2h-3l-1 2" />
    </BaseIcon>
);

export const IconTrash = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
    </BaseIcon>
);

export const IconTrash2 = IconTrash;

export const IconRefresh = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </BaseIcon>
);

export const IconSmile = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01M15 9h.01" strokeWidth="2" />
    </BaseIcon>
);

export const IconMeh = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 15h8" />
        <path d="M9 9h.01M15 9h.01" strokeWidth="2" />
    </BaseIcon>
);

export const IconFrown = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <path d="M9 9h.01M15 9h.01" strokeWidth="2" />
    </BaseIcon>
);

export const IconActivity = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M22 12h-4l-3 9L9 3 l-3 9H2" />
    </BaseIcon>
);

export const IconTestTube = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" />
        <path d="M8.5 2h7" />
        <path d="M14.5 16h-5" strokeOpacity="0.4" strokeWidth="1.2" />
    </BaseIcon>
);

export const IconSyringe = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="m18 2 4 4" strokeOpacity="0.3" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <path d="m9 11 4 4" strokeOpacity="0.5" strokeWidth="1.2" />
        <path d="m5 19-3 3" />
        <path d="m14 4 6 6" strokeOpacity="0.3" strokeWidth="1" />
    </BaseIcon>
);

export const IconMic = (props: IconProps) => (
    <BaseIcon {...props}>
        <rect x="9" y="1" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <path d="M12 17v4M8 23h8" strokeOpacity="0.5" />
    </BaseIcon>
);

export const IconLoader = ({ className, ...props }: IconProps) => (
    <BaseIcon className={cn("animate-spin", className)} {...props}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </BaseIcon>
);

export const IconLoading = IconLoader;

export const IconUsers = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </BaseIcon>
);

export const IconSettings = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </BaseIcon>
);

export const IconGear = IconSettings;

export const IconSignOut = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </BaseIcon>
);

export const IconQuestion = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </BaseIcon>
);

export const IconUser = IconProfile;

export const IconShield = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </BaseIcon>
);

export const IconStar = (props: IconProps) => (
    <BaseIcon {...props}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </BaseIcon>
);

export const IconZap = (props: IconProps) => (
    <BaseIcon {...props}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </BaseIcon>
);

export const IconGift = (props: IconProps) => (
    <BaseIcon {...props}>
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </BaseIcon>
);

export const IconChart = (props: IconProps) => (
    <BaseIcon {...props}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </BaseIcon>
);
export const IconFile = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </BaseIcon>
);

export const IconFileText = IconFile;

export const IconShare = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M4 12V20a2 2 0 0 0 2 2H18a2 2 0 0 0 2-2V12" strokeOpacity="0.3" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v13" />
    </BaseIcon>
);

export const IconShareNetwork = IconShare;

export const IconDownload = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeOpacity="0.3" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </BaseIcon>
);

export const IconUpload = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeOpacity="0.3" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </BaseIcon>
);

export const IconExternalLink = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeOpacity="0.3" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </BaseIcon>
);

export const IconSquareOut = IconExternalLink;

export const IconPencil = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </BaseIcon>
);

export const IconArchive = (props: IconProps) => (
    <BaseIcon {...props}>
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
    </BaseIcon>
);

export const IconTrendingUp = (props: IconProps) => (
    <BaseIcon {...props}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </BaseIcon>
);

export const IconEdit = IconPencil;

export const IconCheckCircle = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </BaseIcon>
);

export const IconBan = (props: IconProps) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </BaseIcon>
);

export const IconHeartPulse = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
        <path d="M3.5 12h2.5l2-5 4 10 3-8 2 3h2.5" strokeOpacity="0.4" strokeWidth="1.2" />
    </BaseIcon>
);
export function IconAlertTriangle(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </BaseIcon>
    );
}

export function IconMicOff(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </BaseIcon>
    );
}

export function IconVolume(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </BaseIcon>
    );
}

export function IconSilverware(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <path d="M3 2v7c0 1.1.9 2 2 2 1.1 0 2-.9 2-2V2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 2v20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </BaseIcon>
    );
}

export function IconProviders(props: IconProps) {
    return (
        <BaseIcon {...props}>
            <path d='M12 2C8.69 2 6 4.69 6 8c0 4.5 6 11 6 11s6-6.5 6-11c0-3.31-2.69-6-6-6z' strokeOpacity='0.35' />
            <path d='M10.5 7.5h3M12 6v3' strokeWidth='1.6' />
            <path d='M3 21h18' strokeOpacity='0.45' />
            <rect x='3.5' y='15' width='5' height='6' rx='0.8' strokeOpacity='0.55' />
            <rect x='15.5' y='15' width='5' height='6' rx='0.8' strokeOpacity='0.55' />
        </BaseIcon>
    );
}
