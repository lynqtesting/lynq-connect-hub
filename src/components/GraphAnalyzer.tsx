import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Wand2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';

interface GraphData {
  type: string;
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  nodes?: Array<{
    id: string;
    label: string;
    color: string;
    x: number;
    y: number;
  }>;
  connections?: Array<{
    from: string;
    to: string;
  }>;
}

interface GraphAnalyzerProps {
  onGraphGenerated: (graphData: GraphData) => void;
}

export const GraphAnalyzer: React.FC<GraphAnalyzerProps> = ({ onGraphGenerated }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
    },
    multiple: false
  });

  const analyzeImage = async () => {
    if (!uploadedImage) {
      toast({
        title: "No Image",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simulate AI analysis - in real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock analysis results based on uploaded screenshot
      const mockGraphData: GraphData = {
        type: "network",
        title: "Key Objections Network Analysis",
        metrics: [
          { label: "Total Objections", value: 2, color: "#ef4444" },
          { label: "Top Concern", value: "Cost", color: "#f59e0b" },
          { label: "Impact Level", value: "High", color: "#3b82f6" }
        ],
        nodes: [
          { id: "learner", label: "LEARNER OBJECTIONS", color: "#8b5cf6", x: 50, y: 20 },
          { id: "cost", label: "COST OBJECTION", color: "#ef4444", x: 20, y: 60 },
          { id: "investment", label: "INVESTMENT ASPECT", color: "#f59e0b", x: 80, y: 60 },
          { id: "premium", label: "Premium Too High", color: "#fca5a5", x: 10, y: 85 },
          { id: "value", label: "Poor Value Perception", color: "#fca5a5", x: 30, y: 85 },
          { id: "health", label: "Health & Wealth Mix", color: "#fde68a", x: 70, y: 85 },
          { id: "performance", label: "Fund Performance", color: "#fde68a", x: 90, y: 85 }
        ],
        connections: [
          { from: "learner", to: "cost" },
          { from: "learner", to: "investment" },
          { from: "cost", to: "premium" },
          { from: "cost", to: "value" },
          { from: "investment", to: "health" },
          { from: "investment", to: "performance" }
        ]
      };

      onGraphGenerated(mockGraphData);
      
      toast({
        title: "Analysis Complete",
        description: "Graph has been analyzed and recreated successfully",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Graph Screenshot Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the screenshot here...</p>
          ) : (
            <div>
              <p className="font-medium">Drop a graph screenshot here, or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          )}
        </div>

        {uploadedImage && (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border">
              <img 
                src={uploadedImage} 
                alt="Uploaded screenshot" 
                className="w-full h-auto max-h-48 object-contain"
              />
            </div>
            
            <Button 
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Graph...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Analyze & Recreate Graph
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};