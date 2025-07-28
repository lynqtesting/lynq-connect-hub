import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, MessageSquare, Edit, Calendar } from 'lucide-react';

const ModuleDetails = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();

  // Mock data - will be replaced with Supabase data
  const moduleData = {
    id: moduleId,
    name: `Axis Bank Module ${moduleId}`,
    videoUrl: '', // Will be populated from Supabase
    screenshotUrl: '', // Will be populated from Supabase
    pdfUrl: '', // Will be populated from Supabase
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/user-dashboard')}
            className="p-0"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <Logo />
        </div>

        <h2 className="text-xl font-semibold mb-6">Module: {moduleData.name}</h2>

        <div className="space-y-4">
          {/* Video Player Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Training Video</h3>
              <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Video player will be here</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm">Hindi</Button>
                <Button variant="outline" size="sm">English</Button>
              </div>
            </CardContent>
          </Card>

          {/* Screenshot Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Performance Screenshot</h3>
              <div className="bg-muted aspect-video rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Screenshot will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions Section */}
          <div className="space-y-3">
            <Button className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Request New Module
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <Edit className="mr-2 h-4 w-4" />
              Adapt This Module
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Book a Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetails;