import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Upload, Trash2, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioFile {
  id: string;
  language: 'hindi' | 'english';
  file: File;
  url: string;
  duration?: number;
}

export const AudioOverview: React.FC = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'hindi' | 'english'>('hindi');
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an audio file",
        variant: "destructive"
      });
      return;
    }

    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    
    const newAudioFile: AudioFile = {
      id,
      language: selectedLanguage,
      file,
      url
    };

    setAudioFiles(prev => {
      // Remove existing file for this language
      const filtered = prev.filter(audio => audio.language !== selectedLanguage);
      return [...filtered, newAudioFile];
    });

    toast({
      title: "Audio Uploaded",
      description: `${selectedLanguage} overview uploaded successfully`,
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePlayPause = (audioId: string) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    if (currentPlaying === audioId) {
      audio.pause();
      setCurrentPlaying(null);
    } else {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach(a => a.pause());
      audio.play();
      setCurrentPlaying(audioId);
    }
  };

  const removeAudioFile = (audioId: string) => {
    const audio = audioRefs.current[audioId];
    if (audio) {
      audio.pause();
      URL.revokeObjectURL(audio.src);
      delete audioRefs.current[audioId];
    }
    
    setAudioFiles(prev => prev.filter(audio => audio.id !== audioId));
    
    if (currentPlaying === audioId) {
      setCurrentPlaying(null);
    }
  };

  const getAudioForLanguage = (language: 'hindi' | 'english') => {
    return audioFiles.find(audio => audio.language === language);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Audio Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection & Upload */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Upload Audio Overview</Label>
            <div className="flex gap-2 mt-2">
              <Button 
                variant={selectedLanguage === 'hindi' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedLanguage('hindi')}
              >
                Hindi
              </Button>
              <Button 
                variant={selectedLanguage === 'english' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedLanguage('english')}
              >
                English
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Audio Players */}
        <div className="space-y-4">
          {(['hindi', 'english'] as const).map(language => {
            const audio = getAudioForLanguage(language);
            if (!audio) return null;

            return (
              <div key={language} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium capitalize">{language} Overview</h4>
                    <p className="text-sm text-muted-foreground">
                      {audio.file.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAudioFile(audio.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePlayPause(audio.id)}
                  >
                    {currentPlaying === audio.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <audio
                    ref={el => {
                      if (el) audioRefs.current[audio.id] = el;
                    }}
                    src={audio.url}
                    onEnded={() => setCurrentPlaying(null)}
                    className="hidden"
                  />
                  
                  <div className="flex-1 text-sm text-muted-foreground">
                    Audio ready to play
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {audioFiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No audio overviews uploaded yet</p>
            <p className="text-sm">Upload Hindi and English audio files above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};