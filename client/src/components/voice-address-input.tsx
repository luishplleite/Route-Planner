import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceAddressInputProps {
  onAddressSubmit: (address: string) => void;
  disabled?: boolean;
}

export function VoiceAddressInput({ onAddressSubmit, disabled }: VoiceAddressInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize SpeechRecognition if available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR'; // Portuguese for Brazilian context implies by R$ currency

      recognitionRef.current.onstart = () => setIsListening(true);
      
      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If we have a final transcript, we could auto-submit or let user confirm
        // For now, we'll let user review in the input
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      recognitionRef.current?.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      onAddressSubmit(transcript);
      setTranscript("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center">
        <Input
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Enter address or tap mic..."
          className="pr-12 h-14 text-lg shadow-sm border-2 focus-visible:ring-primary/20"
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
      </div>
      
      {transcript && !isListening && (
        <Button 
          type="submit" 
          className="w-full mt-3 h-12 text-lg font-semibold shadow-md"
          disabled={disabled}
        >
          Add Stop
        </Button>
      )}
    </form>
  );
}
