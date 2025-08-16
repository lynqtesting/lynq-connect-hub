import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { RealtimeModuleEditor } from '@/components/RealtimeModuleEditor';

const EditModule = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams();

  if (!moduleId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Invalid module ID</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/view-modules')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lynqs
        </Button>

        <RealtimeModuleEditor moduleId={moduleId} />
      </div>
    </div>
  );
};

export default EditModule;