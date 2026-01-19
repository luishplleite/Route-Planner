import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

interface VoiceAddressInputProps {
  onAddressSubmit: (address: string, coordinates?: [number, number]) => void;
  disabled?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || (window as any).VITE_MAPBOX_TOKEN || "";

export function VoiceAddressInput({ onAddressSubmit, disabled }: VoiceAddressInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onstart = () => setIsListening(true);
      
      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setQuery(text);
        handleSearch(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(searchQuery)}&limit=5&country=br&language=pt&access_token=${MAPBOX_TOKEN}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      const mapped = (data.features || []).map((f: any) => ({
        id: f.id,
        place_name: f.properties.full_address || f.properties.name_preferred || f.properties.name || f.place_name,
        center: f.geometry.coordinates
      }));
      setSuggestions(mapped);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleSearch(value);
    }, 400);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setQuery("");
      recognitionRef.current?.start();
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    setQuery(s.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onAddressSubmit(s.place_name, s.center);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (suggestions.length > 0) {
        selectSuggestion(suggestions[0]);
      } else {
        onAddressSubmit(query);
        setQuery("");
      }
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </div>
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Digite o endereço ou use o microfone..."
          className="pl-10 pr-12 h-14 text-lg shadow-sm border-2 focus-visible:ring-primary/20"
          disabled={disabled}
        />
        <Button
          type="button"
          size="icon"
          variant={isListening ? "destructive" : "secondary"}
          className={cn(
            "absolute right-2 h-10 w-10 rounded-full transition-all duration-200",
            isListening && "animate-pulse ring-4 ring-red-100"
          )}
          onClick={toggleListening}
          disabled={!recognitionRef.current || disabled}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
      </form>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {suggestions.map((s) => (
            <button
              key={s.id}
              className="w-full text-left p-4 hover:bg-slate-50 flex items-start gap-3 border-b last:border-0 transition-colors"
              onClick={() => selectSuggestion(s)}
            >
              <MapPin className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <span className="text-sm font-medium text-slate-700">{s.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
