import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioOverviewProps {
  englishAudioUrl?: string;
}

export const AudioOverview: React.FC<AudioOverviewProps> = ({ englishAudioUrl }) => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Audio data based on provided URL
  const audioData = {
    english: {
      id: 'english-audio', 
      title: 'Insurance Product Overview',
      description: 'Comprehensive review of insurance products and key insights in English',
      duration: '7:56',
      url: englishAudioUrl || null
    }
  };

  if (!englishAudioUrl) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No audio overview available for this module.</p>
        </CardContent>
      </Card>
    );
  }

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

  const getAudioForLanguage = () => {
    return audioData.english;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Audio Player */}
      {(() => {
        const currentAudio = getAudioForLanguage();

        return (
          <Card className="animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-xl flex items-center justify-center animate-scale-in">
                    {currentPlaying === currentAudio.id ? (
                      <div className="w-6 h-6 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <Volume2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{currentAudio.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{currentAudio.description}</p>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePlayPause(currentAudio.id)}
                      className="hover-scale"
                    >
                      {currentPlaying === currentAudio.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      Duration: {currentAudio.duration}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Element */}
              <audio
                ref={el => {
                  if (el) audioRefs.current[currentAudio.id] = el;
                }}
                src={currentAudio.url}
                onEnded={() => setCurrentPlaying(null)}
                className="hidden"
              />

              {/* Visual Waveform Placeholder */}
              <div className="mt-4 flex items-center space-x-1 h-8">
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-gradient-to-t from-primary/30 to-primary rounded-full transition-all duration-300 ${
                      currentPlaying === currentAudio.id ? 'animate-pulse' : ''
                    }`}
                    style={{
                      height: `${Math.random() * 24 + 8}px`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Key Points from Audio */}
      <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-6">
          <h4 className="font-semibold text-base flex items-center gap-2 mb-4">
            🎯 Audio Highlights
          </h4>
          <div className="space-y-3">
            <Badge 
              variant="destructive" 
              className="w-full justify-start p-4 text-left hover-scale"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Primary Cost Barrier</div>
                  <div className="text-xs opacity-90 mt-1">"Premium is very high" - major barrier to conversion</div>
                </div>
              </div>
            </Badge>
            
            <Badge 
              variant="secondary" 
              className="w-full justify-start p-4 text-left hover-scale"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Investment Clarity Needed</div>
                  <div className="text-xs opacity-90 mt-1">Confusion about "health and wealth" combo requires addressing</div>
                </div>
              </div>
            </Badge>
            
            <Badge 
              variant="outline" 
              className="w-full justify-start p-4 text-left hover-scale"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Performance Concerns</div>
                  <div className="text-xs opacity-90 mt-1">Fund performance and ULIP component worries</div>
                </div>
              </div>
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};