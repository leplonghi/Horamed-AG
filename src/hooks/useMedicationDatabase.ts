import { useState, useEffect } from "react";

interface Medication {
  name: string;
  activeIngredient: string;
  therapeuticClass: string;
}

export function useMedicationDatabase() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMedications() {
      try {
        const response = await fetch('/data/medicamentos.csv');
        const text = await response.text();
        
        const lines = text.split('\n');
        const headers = lines[0].split(';');
        
        const meds: Medication[] = [];
        const uniqueNames = new Set<string>();
        
        for (let i = 1; i < lines.length && i < 5000; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = line.split(';');
          const name = values[1]?.replace(/"/g, '').trim();
          const activeIngredient = values[10]?.replace(/"/g, '').trim();
          const therapeuticClass = values[7]?.replace(/"/g, '').trim();
          
          if (name && !uniqueNames.has(name.toLowerCase())) {
            uniqueNames.add(name.toLowerCase());
            meds.push({
              name,
              activeIngredient: activeIngredient || '',
              therapeuticClass: therapeuticClass || ''
            });
          }
        }
        
        setMedications(meds);
        setLoading(false);
      } catch (err) {
        console.error('Error loading medications:', err);
        setError('Erro ao carregar base de medicamentos');
        setLoading(false);
      }
    }

    loadMedications();
  }, []);

  const searchMedications = (query: string): Medication[] => {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    return medications
      .filter(med => 
        med.name.toLowerCase().includes(searchTerm) ||
        med.activeIngredient.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10);
  };

  return { medications, loading, error, searchMedications };
}
