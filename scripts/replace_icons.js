import fs from 'fs';
import path from 'path';

const iconMap = {
    Accessibility: 'Wheelchair',
    Activity: 'Activity',
    AlertCircle: 'WarningCircle',
    AlertTriangle: 'Warning',
    Archive: 'Archive',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    ArrowUp: 'ArrowUp',
    ArrowUpRight: 'ArrowUpRight',
    Award: 'Medal',
    BarChart3: 'ChartBar',
    BarChart: 'ChartBar',
    Battery: 'BatteryFull',
    BatteryCharging: 'BatteryCharging',
    BatteryWarning: 'BatteryWarning',
    Bell: 'Bell',
    BellOff: 'BellSlash',
    BookOpen: 'BookOpen',
    Box: 'Box',
    Briefcase: 'Briefcase',
    Calendar: 'CalendarBlank',
    CalendarCheck: 'CalendarCheck',
    CalendarClock: 'CalendarSlash',
    CalendarDays: 'Calendar',
    Camera: 'Camera',
    Check: 'Check',
    CheckCircle: 'CheckCircle',
    CheckCircle2: 'CheckCircle',
    CheckSquare: 'CheckSquare',
    ChevronDown: 'CaretDown',
    ChevronLeft: 'CaretLeft',
    ChevronRight: 'CaretRight',
    ChevronUp: 'CaretUp',
    ChevronsUpDown: 'CaretDoubleUpDown',
    Circle: 'Circle',
    Clipboard: 'Clipboard',
    ClipboardCheck: 'ClipboardText',
    ClipboardList: 'ClipboardText',
    Clock: 'Clock',
    Clock3: 'Clock',
    Clock4: 'Clock',
    Clock8: 'Clock',
    Close: 'X',
    Cloud: 'Cloud',
    Copy: 'Copy',
    CreditCard: 'CreditCard',
    Crown: 'Crown',
    Database: 'Database',
    Download: 'Download',
    Droplets: 'Drop',
    Dumbbell: 'Barbell',
    Edit: 'PencilSimple',
    Edit2: 'PencilSimple',
    Edit3: 'PencilSimple',
    ExternalLink: 'ArrowSquareOut',
    Eye: 'Eye',
    EyeOff: 'EyeSlash',
    File: 'File',
    FileClock: 'FileCode',
    FileSignature: 'Signature',
    FileText: 'FileText',
    FileUp: 'FileUpload',
    Filter: 'Funnel',
    Fingerprint: 'Fingerprint',
    Flame: 'Flame',
    FlaskConical: 'Flask',
    Folder: 'Folder',
    FolderOpen: 'FolderOpen',
    Footprints: 'Footprints',
    Gauge: 'Gauge',
    Gift: 'Gift',
    Globe: 'Globe',
    Grid: 'GridFour',
    Hand: 'Hand',
    Heart: 'Heart',
    HeartPulse: 'Heartbeat',
    History: 'ClockCounterClockwise',
    Home: 'House',
    Image: 'Image',
    Info: 'Info',
    Laptop: 'Laptop',
    Laptop2: 'Laptop',
    LayoutDashboard: 'SquaresFour',
    Leaf: 'Leaf',
    Library: 'Books',
    Lightbulb: 'Lightbulb',
    Lightning: 'Lightning',
    Link: 'Link',
    List: 'List',
    Loader2: 'Spinner',
    Lock: 'Lock',
    LogOut: 'SignOut',
    Mail: 'Envelope',
    Map: 'MapTrifold',
    MapPin: 'MapPin',
    Maximize2: 'CornersOut',
    Menu: 'List',
    MessageCircle: 'ChatCircle',
    MessageSquare: 'ChatSquare',
    Mic: 'Microphone',
    MicOff: 'MicrophoneSlash',
    Moon: 'Moon',
    MoreHorizontal: 'DotsThree',
    MoreVertical: 'DotsThreeVertical',
    Package: 'Package',
    Pencil: 'PencilSimple',
    Phone: 'Phone',
    Pill: 'Pill',
    Play: 'Play',
    Plus: 'Plus',
    PlusCircle: 'PlusCircle',
    QrCode: 'QrCode',
    RefreshCw: 'ArrowsClockwise',
    Repeat: 'Repeat',
    Rocket: 'Rocket',
    Save: 'FloppyDisk',
    Search: 'MagnifyingGlass',
    Send: 'PaperPlaneRight',
    Settings: 'Gear',
    Settings2: 'GearSix',
    Share: 'ShareNetwork',
    Share2: 'ShareNetwork',
    Shield: 'Shield',
    ShieldAlert: 'ShieldWarning',
    ShieldCheck: 'ShieldCheck',
    ShoppingBag: 'ShoppingBag',
    ShoppingCart: 'ShoppingCart',
    Smartphone: 'DeviceMobile',
    Sparkles: 'Sparkle',
    Star: 'Star',
    Stethoscope: 'Stethoscope',
    Sun: 'Sun',
    Syringe: 'Syringe',
    Target: 'Target',
    TestTube2: 'TestTube',
    Thermometer: 'Thermometer',
    Time: 'Clock',
    Timer: 'Timer',
    Trash: 'Trash',
    Trash2: 'Trash',
    TrendingDown: 'TrendDown',
    TrendingUp: 'TrendUp',
    Trophy: 'Trophy',
    Unlock: 'LockOpen',
    Upload: 'Upload',
    UploadCloud: 'CloudArrowUp',
    User: 'User',
    UserCheck: 'UserCheck',
    UserCircle: 'UserCircle',
    UserCircle2: 'UserCircle',
    UserMinus: 'UserMinus',
    UserPlus: 'UserPlus',
    Users: 'Users',
    Utensils: 'ForkKnife',
    Video: 'VideoCamera',
    Volume2: 'SpeakerHigh',
    VolumeX: 'SpeakerNone',
    Watch: 'Watch',
    Wifi: 'WifiHigh',
    WifiOff: 'WifiSlash',
    X: 'X',
    XCircle: 'XCircle',
    Zap: 'Lightning',
    ZapOff: 'LightningSlash',
    ZoomIn: 'MagnifyingGlassPlus',
    ZoomOut: 'MagnifyingGlassMinus',
};

const mapIcon = (lucideName) => {
    return iconMap[lucideName] || lucideName;
};

const regex = /import\s+({[^}]+})\s+from\s+['"]lucide-react['"];?/g;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('lucide-react')) {
        return;
    }
    let newContent = content.replace(regex, (match, p1) => {
        // p1 includes the braces sometimes depending on regex capture group, but here it's { ... }
        const itemsStr = p1.replace(/^{|}$/g, ''); // strip braces
        const importItems = itemsStr.split(',').map(item => item.trim()).filter(Boolean);
        const phosphorImports = importItems.map(item => {
            let parts = item.split(/\s+as\s+/);
            const originalName = parts[0];
            const aliasName = parts[1];
            const newName = mapIcon(originalName);

            if (aliasName) {
                return `${newName} as ${aliasName}`;
            } else {
                if (newName === originalName) {
                    return newName;
                } else {
                    return `${newName} as ${originalName}`;
                }
            }
        });

        return `import { ${phosphorImports.join(', ')} } from "@phosphor-icons/react";`;
    });

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

processDirectory(path.join(process.cwd(), 'src'));
console.log("Done");
