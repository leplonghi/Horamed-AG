import fs from 'fs';
import path from 'path';

// Bare names (no alias) that don't exist in @phosphor-icons/react
// Maps: old name -> replacement string (can include alias)
const brokenBareIcons = {
    'Activity': 'Heartbeat as Activity',
    'Scale': 'Scales as Scale',
    'Droplet': 'Drop as Droplet',
    'HelpCircle': 'Question as HelpCircle',
    'CaretDoubleUpDown': 'CaretUpDown as ChevronsUpDown',
    'Twitter': 'TwitterLogo as Twitter',
    'Facebook': 'FacebookLogo as Facebook',
    'Ban': 'Prohibit as Ban',
    'BellRing': 'BellRinging as BellRing',
    'RefreshCcw': 'ArrowCounterClockwise as RefreshCcw',
    'ArrowDownToLine': 'ArrowLineDown as ArrowDownToLine',
    'GitGraph': 'GitBranch as GitGraph',
    'ArrowUpDown': 'ArrowsDownUp as ArrowUpDown',
    'SortAsc': 'SortAscending as SortAsc',
    'SortDesc': 'SortDescending as SortDesc',
    'UtensilsCrossed': 'ForkKnife as UtensilsCrossed',
    'Sunrise': 'SunHorizon as Sunrise',
    'Palette': 'PaintBrush as Palette',
    'Smile': 'Smiley as Smile',
    'Instagram': 'InstagramLogo as Instagram',
    'FolderHeart': 'FolderOpen as FolderHeart',
    'BookHeart': 'BookOpen as BookHeart',
    'FileCheck': 'FileText as FileCheck',
    'FileDown': 'FileArrowDown as FileDown',
    'Vibrate': 'DeviceMobileSpeaker as Vibrate',
    'ThumbsUp': 'ThumbsUp',
    'Store': 'Storefront as Store',
    'Plane': 'Airplane as Plane',
    'Apple': 'AppleLogo as Apple',
    'SortAsc': 'SortAscending as SortAsc',
    'SortDesc': 'SortDescending as SortDesc',
    'Palette': 'PaintBrush as Palette',
};

// Names that appear as SOURCE (before "as") and need source replaced
const brokenSourceIcons = {
    'Sunrise': 'SunHorizon',
    'Sunset': 'SunDim',
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(
        /import\s+\{([^}]+)\}\s+from\s+["']@phosphor-icons\/react["'];?/g,
        (match, p1) => {
            const importItems = p1.split(',').map(item => item.trim()).filter(Boolean);
            const hasSunrise = importItems.some(i => /^Sunrise(\s|$)/.test(i));
            const hasSunset = importItems.some(i => /^Sunset(\s|$)/.test(i));

            const newImports = importItems.map(item => {
                const parts = item.split(/\s+as\s+/);
                const sourceName = parts[0].trim();
                const aliasName = parts[1]?.trim();

                // Case 1: bare import that needs fixing
                if (!aliasName && brokenBareIcons[sourceName] !== undefined) {
                    // Special handling for Sunset when both Sunrise+Sunset present
                    if (sourceName === 'Sunset' && hasSunrise) {
                        return 'SunDim as Sunset';
                    }
                    return brokenBareIcons[sourceName];
                }

                // Case 2: source name was broken already has alias
                if (aliasName && brokenSourceIcons[sourceName]) {
                    if (sourceName === 'Sunset' && hasSunrise) {
                        return `SunDim as ${aliasName}`;
                    }
                    return `${brokenSourceIcons[sourceName]} as ${aliasName}`;
                }

                return item;
            });

            return `import { ${newImports.join(', ')} } from "@phosphor-icons/react";`;
        }
    );

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
