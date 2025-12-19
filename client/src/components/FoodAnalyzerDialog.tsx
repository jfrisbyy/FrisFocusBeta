import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Apple, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AnalysisResult {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  items: FoodItem[];
  confidence: "high" | "medium" | "low";
  notes?: string;
}

interface FoodAnalyzerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FoodAnalyzerDialog({ open, onOpenChange }: FoodAnalyzerDialogProps) {
  const { toast } = useToast();
  const [imageData, setImageData] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImageData(base64);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageData) return;

    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/food/analyze", {
        image: imageData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze food");
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Invalid response from analyzer");
      }
      
      setResult(data);
      
      toast({
        title: "Analysis complete",
        description: `Found ${data.items.length} food item${data.items.length !== 1 ? "s" : ""}`,
      });
    } catch (error: any) {
      console.error("Error analyzing food:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setImageData(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleClose = () => {
    handleClear();
    onOpenChange(false);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Food Analyzer
          </DialogTitle>
          <DialogDescription>
            Take a photo of your meal to estimate calories and macros
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!imageData ? (
            <div className="space-y-3">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-camera-capture"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
              
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full"
                size="lg"
                data-testid="button-take-photo"
              >
                <Camera className="mr-2 h-5 w-5" />
                Take Photo
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                size="lg"
                data-testid="button-upload-photo"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload from Gallery
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={imageData}
                  alt="Food to analyze"
                  className="w-full rounded-md object-cover max-h-64"
                  data-testid="img-food-preview"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleClear}
                  data-testid="button-clear-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!result && (
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full"
                  size="lg"
                  data-testid="button-analyze"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Apple className="mr-2 h-5 w-5" />
                      Analyze Food
                    </>
                  )}
                </Button>
              )}

              {result && (
                <div className="space-y-4" data-testid="section-results">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold font-mono" data-testid="text-total-calories">
                            {result.totalCalories}
                          </div>
                          <div className="text-sm text-muted-foreground">Calories</div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Protein</span>
                            <span className="font-mono font-medium" data-testid="text-total-protein">{result.totalProtein}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Carbs</span>
                            <span className="font-mono font-medium" data-testid="text-total-carbs">{result.totalCarbs}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fat</span>
                            <span className="font-mono font-medium" data-testid="text-total-fat">{result.totalFat}g</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t text-xs text-center">
                        <span className="text-muted-foreground">Confidence: </span>
                        <span className={getConfidenceColor(result.confidence)}>
                          {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {result.items.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Food Items</div>
                      {result.items.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="py-3 px-4">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="font-medium" data-testid={`text-item-name-${index}`}>
                                  {item.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.portion}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-medium" data-testid={`text-item-calories-${index}`}>
                                  {item.calories} cal
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {result.notes && (
                    <div className="text-sm text-muted-foreground italic">
                      {result.notes}
                    </div>
                  )}

                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="w-full"
                    data-testid="button-analyze-another"
                  >
                    Analyze Another
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
