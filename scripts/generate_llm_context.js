
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = 'PROJECT_CONTEXT.md';
const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORE_DIRS = ['node_modules', 'dist', '.git', '.lovable', 'android', 'ios', 'coverage', 'migration-data', '.agent', 'public', 'assets', 'screenshots'];
const IGNORE_FILES = [
    'package-lock.json',
    'bun.lockb',
    '.DS_Store',
    'lint_report.txt',
    'PROJECT_CONTEXT.md',
    'README.md',
    'generate_llm_context.js',
    'firebase-service-account.json', // CRITICAL: Exclude secrets
    'google-services.json',
    'serviceAccountKey.json'
];
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.html', '.css'];

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                getFiles(filePath, fileList);
            }
        } else {
            // Exclude .env files explicitely if they happen to match somehow, and strictly check ignores
            if (file.startsWith('.env')) return;

            if (!IGNORE_FILES.includes(file) && ALLOWED_EXTENSIONS.includes(path.extname(file))) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

function generateContext() {
    console.log('Generating context file (SECURE MODE)...');
    const files = getFiles(ROOT_DIR);
    let content = '# Project Context\n\n';

    // Add file tree
    content += '## File Structure\n```\n';
    files.forEach(file => {
        content += path.relative(ROOT_DIR, file) + '\n';
    });
    content += '```\n\n';

    // Add file contents
    let totalSize = 0;
    files.forEach(file => {
        const relativePath = path.relative(ROOT_DIR, file);

        // Skip very large files or minified ones crudely
        if (fs.statSync(file).size > 100 * 1024) { // 100KB limit per file
            content += `\n# File: ${relativePath} (SKIPPED - TOO LARGE)\n\n`;
            return;
        }

        const fileContent = fs.readFileSync(file, 'utf8');
        content += `\n# File: ${relativePath}\n\`\`\`${path.extname(file).substring(1)}\n${fileContent}\n\`\`\`\n`;
        totalSize += fileContent.length;
    });

    fs.writeFileSync(path.join(ROOT_DIR, OUTPUT_FILE), content);
    console.log(`\nSuccess! Context file generated at: ${path.join(ROOT_DIR, OUTPUT_FILE)}`);
    console.log(`Total size: ${(fs.statSync(path.join(ROOT_DIR, OUTPUT_FILE)).size / 1024 / 1024).toFixed(2)} MB`);
}

generateContext();
