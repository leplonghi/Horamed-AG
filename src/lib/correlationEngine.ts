// Simple mock database of common medications and their side effects
// In a real production app, this would be an API call to a medical database
const COMMON_MEDICATIONS: Record<string, string[]> = {
    'lisinopril': ['Cough', 'Dizziness', 'Headache', 'Fatigue'],
    'losartan': ['Dizziness', 'Fatigue', 'Low Blood Pressure'],
    'metformin': ['Nausea', 'Stomach ache', 'Diarrhea', 'Loss of appetite'],
    'omeprazole': ['Headache', 'Nausea', 'Diarrhea', 'Stomach ache'],
    'simvastatin': ['Muscle Pain', 'Joint Pain', 'Fatigue', 'Headache'],
    'atorvastatin': ['Muscle Pain', 'Diarrhea', 'Nausea'],
    'amlodipine': ['Swelling', 'Fatigue', 'Palpitations', 'Dizziness'],
    'levothyroxine': ['Palpitations', 'Insomnia', 'Fatigue', 'Hair loss'],
    'albuterol': ['Tremors', 'Palpitations', 'Headache', 'Nervousness'],
    'gabapentin': ['Dizziness', 'Fatigue', 'Tremors', 'Blurred vision'],
};

/**
 * Checks if the reported symptoms correlate with the patient's active medications.
 * Returns a list of neutral observational notes meant for the Doctor.
 */
export function analyzeSymptomCorrelation(
    reportedSymptoms: string[],
    activeMedicationNames: string[]
): string[] {
    const observations: string[] = [];

    // Normalize list
    const activeNormalized = activeMedicationNames.map(m => m.toLowerCase().trim());
    const symptomsNormalized = reportedSymptoms.map(s => s.toLowerCase().trim());

    for (const med of activeNormalized) {
        for (const [key, sideEffects] of Object.entries(COMMON_MEDICATIONS)) {
            if (med.includes(key)) {
                // Compare reported symptoms against known side effects
                const correlated = sideEffects.filter(se =>
                    symptomsNormalized.includes(se.toLowerCase())
                );

                if (correlated.length > 0) {
                    const symptomList = correlated.join(', ');
                    observations.push(
                        `Note: ${symptomList} reported. This is a known potential side effect of ${med}. Mention this during your next visit.`
                    );
                }
            }
        }
    }

    // Remove duplicates
    return Array.from(new Set(observations));
}
