export interface ExtractedData {
    date?: Date;
    time?: string;
    doctorName?: string;
    crm?: string;
    patientName?: string;
    medications?: string[];
    examTypes?: string[];
    location?: string;
}

/**
 * Extract structured data from OCR text using Regex patterns for Brazilian documents
 */
export const extractData = (text: string): ExtractedData => {
    const result: ExtractedData = {};

    // Normalize text for easier matching (keep case for names but handle newlines)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const fullText = text;


    // 1. Extract Date (DD/MM/YYYY or DD-MM-YYYY)
    const dateRegex = new RegExp('(\\d{2})[\\/\\-.](\\d{2})[\\/\\-.](\\d{4})');
    const dateMatch = fullText.match(dateRegex);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1; // Month is 0-indexed
        const year = parseInt(dateMatch[3]);

        // Basic validation
        if (day > 0 && day <= 31 && month >= 0 && month <= 11 && year > 2000 && year < 2100) {
            result.date = new Date(year, month, day);
        }
    }

    // 2. Extract Time (HH:MM or HHhMM)
    const timeRegex = /(\d{2})[:h](\d{2})/;
    const timeMatch = fullText.match(timeRegex);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
            result.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
    }


    // 3. Extract CRM (CRM, CRM-UF, CRM/UF)
    // Format: CRM 123456 or CRM-SP 123456
    const crmRegex = new RegExp('CRM(?:-[A-Z]{2})?[\\s.:/]*(\\d{4,8})', 'i');
    const crmMatch = fullText.match(crmRegex);
    if (crmMatch) {
        result.crm = crmMatch[1];
    }


    // 4. Extract Doctor Name
    // Look for lines starting with Dr. or Dra.
    const doctorRegex = /(?:Dr\.|Dra\.|Médico|Médica)[\s:]+([A-Z][a-zà-ÿ]+(?:\s[A-Z][a-zà-ÿ]+)+)/;
    const doctorMatch = fullText.match(doctorRegex);
    if (doctorMatch) {
        result.doctorName = doctorMatch[1].trim();
    }

    // 5. Extract Medications (simple heuristic list)
    // Look for common forms or numbered lists in prescription context
    // This is hard to do with regex alone, but we can try to find lines with mg/ml
    const medicationCandidates: string[] = [];
    lines.forEach(line => {
        // Check if line looks like a medication (has dosage)
        if (/(?:mg|ml|g|mcg|UI)\b/i.test(line) && line.length > 5 && line.length < 50) {
            // Clean up "Dr." lines that might accidentally match if doctor has "mg" in name (unlikely but safe)
            if (!line.includes('Dr.') && !line.includes('CRM')) {
                medicationCandidates.push(line.trim());
            }
        }
    });
    if (medicationCandidates.length > 0) {
        result.medications = medicationCandidates;
    }

    // 6. Extract Exam Types (simple heuristic)
    const commonExams = [
        'Hemograma', 'Glicemia', 'Colesterol', 'Triglicerídeos', 'Ureia', 'Creatinina',
        'Raio-X', 'Ultrassom', 'Ressonância', 'Tomografia', 'Eletrocardiograma',
        'TSH', 'T4', 'Urina', 'Fezes'
    ];

    const foundExams: string[] = [];
    commonExams.forEach(exam => {
        if (new RegExp(exam, 'i').test(fullText)) {
            foundExams.push(exam);
        }
    });
    if (foundExams.length > 0) {
        result.examTypes = foundExams;
    }

    return result;
};
