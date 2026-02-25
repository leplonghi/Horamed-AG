export type DocumentType =
    | 'medical_exam_request' // Pedido de exame
    | 'prescription'         // Receita médica
    | 'consultation_guide'   // Guia de consulta
    | 'exam_result'          // Resultado de exame
    | 'vaccine_card'         // Carteirinha de vacinação
    | 'unknown';             // Desconhecido

export interface ClassificationResult {
    type: DocumentType;
    confidence: number;
    reason: string;
}

const KEYWORDS = {
    medical_exam_request: [
        'solicitação', 'pedido', 'exame', 'hemograma', 'raio-x', 'ultrassonografia',
        'ressonância', 'tomografia', 'análises clínicas', 'laboratório', 'solicito',
        'ao laboratório'
    ],
    prescription: [
        'receita', 'receituário', 'prescrição', 'uso contínuo', 'uso oral',
        'uso tópico', 'posologia', 'tomar', 'comprimido', 'mg', 'ml', 'gotas'
    ],
    consultation_guide: [
        'guia', 'consulta', 'encaminhamento', 'agendamento', 'marcada',
        'comparecer', 'retorno', 'especialidade', 'crm'
    ],
    exam_result: [
        'laudo', 'resultado', 'conclusão', 'diagnóstico', 'referência',
        'analisado', 'método', 'coleta'
    ],
    vaccine_card: [
        'vacina', 'imunização', 'dose', 'lote', 'validade', 'campanha',
        'aplicação', 'vacinação'
    ]
};

/**
 * Classify the document type based on extracted text using keyword frequency analysis
 */
export const classifyDocument = (text: string): ClassificationResult => {
    const normalizedText = text.toLowerCase();

    let bestMatch: DocumentType = 'unknown';
    let maxScore = 0;
    let totalScore = 0;

    const scores: Record<string, number> = {};

    // Calculate scores for each category
    Object.entries(KEYWORDS).forEach(([type, keywords]) => {
        let score = 0;
        keywords.forEach(keyword => {
            // Count occurrences of keyword
            const regex = new RegExp(keyword, 'g');
            const count = (normalizedText.match(regex) || []).length;
            score += count;
        });

        // Weight specific keywords higher
        if (type === 'medical_exam_request' && (normalizedText.includes('solicito') || normalizedText.includes('pedido de exame'))) {
            score += 3;
        }
        if (type === 'prescription' && (normalizedText.includes('receituário') || normalizedText.includes('uso oral'))) {
            score += 3;
        }

        scores[type] = score;
        totalScore += score;

        if (score > maxScore) {
            maxScore = score;
            bestMatch = type as DocumentType;
        }
    });

    // Determine confidence
    let confidence = 0;
    if (totalScore > 0) {
        confidence = Math.min((maxScore / (totalScore * 0.5)) * 100, 100); // Heuristic
    }

    // Threshold for unknown
    if (maxScore < 2) {
        return {
            type: 'unknown',
            confidence: 0,
            reason: 'Poucas palavras-chave identificadas'
        };
    }

    return {
        type: bestMatch,
        confidence: Math.round(confidence),
        reason: `Baseado nas palavras-chave encontradas (Score: ${maxScore})`
    };
};
