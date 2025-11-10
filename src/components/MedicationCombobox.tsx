import { useState } from "react";
import { Check, ChevronsUpDown, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMedicationDatabase } from "@/hooks/useMedicationDatabase";
import { Badge } from "@/components/ui/badge";

interface MedicationComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MedicationCombobox({
  value,
  onChange,
  placeholder = "Buscar medicamento..."
}: MedicationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { loading, error, searchMedications } = useMedicationDatabase();

  const results = searchMedications(searchQuery);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Digite o nome do medicamento..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Carregando base de medicamentos...
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : searchQuery ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground mb-2">
                    Medicamento não encontrado na base
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onChange(searchQuery);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Pill className="h-4 w-4 mr-2" />
                    Cadastrar "{searchQuery}"
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Digite para buscar medicamentos
                </div>
              )}
            </CommandEmpty>
            
            {results.length > 0 && (
              <CommandGroup>
                {results.map((med, index) => (
                  <CommandItem
                    key={index}
                    value={med.name}
                    onSelect={() => {
                      onChange(med.name);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex flex-col items-start gap-1 py-3"
                  >
                    <div className="flex items-center w-full">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === med.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{med.name}</div>
                        {med.activeIngredient && (
                          <div className="text-xs text-muted-foreground">
                            Princípio ativo: {med.activeIngredient}
                          </div>
                        )}
                      </div>
                    </div>
                    {med.therapeuticClass && (
                      <Badge variant="secondary" className="ml-6 text-xs">
                        {med.therapeuticClass}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
