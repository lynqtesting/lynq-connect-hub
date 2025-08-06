import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react';

interface AudioOverviewProps {
  englishAudioUrl?: string;
}

export const AudioOverview: React.FC<AudioOverviewProps> = ({ englishAudioUrl }) => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = (audioId: string) => {
    const audio = audioRefs.current[audioId];
    if (!audio) return;

    setIsLoading(true);
    
    if (currentPlaying === audioId) {
      audio.pause();
      setCurrentPlaying(null);
    } else {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach(a => a.pause());
      audio.play().then(() => {
        setCurrentPlaying(audioId);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRefs.current['english-audio'];
    if (!audio || !duration) return;
    
    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipForward = () => {
    const audio = audioRefs.current['english-audio'];
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 10, duration);
  };

  const skipBackward = () => {
    const audio = audioRefs.current['english-audio'];
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 10, 0);
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
                  <p className="text-xs text-muted-foreground mb-4">{currentAudio.description}</p>
                </div>
              </div>
                   
              {/* Audio Controls */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBackward}
                  disabled={!currentPlaying}
                  className="hover-scale"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => togglePlayPause(currentAudio.id)}
                  disabled={isLoading}
                  className="hover-scale rounded-full w-12 h-12"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : currentPlaying === currentAudio.id ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  disabled={!currentPlaying}
                  className="hover-scale"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full"
                  disabled={!duration}
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

            {/* Audio Element */}
            <audio
              ref={el => {
                if (el) {
                  audioRefs.current[currentAudio.id] = el;
                  
                  // Set up event listeners
                  el.onloadedmetadata = () => {
                    setDuration(el.duration);
                  };
                  
                  el.ontimeupdate = () => {
                    setCurrentTime(el.currentTime);
                  };
                  
                  el.onended = () => {
                    setCurrentPlaying(null);
                    setCurrentTime(0);
                  };
                  
                  el.onpause = () => {
                    if (currentPlaying === currentAudio.id) {
                      setCurrentPlaying(null);
                    }
                  };
                }
              }}
              src={currentAudio.url}
              className="hidden"
              preload="metadata"
            />

            {/* Visual Waveform */}
            <div className="mt-6 flex items-center space-x-1 h-8 bg-muted/20 rounded-lg p-2">
              {Array.from({ length: 40 }, (_, i) => {
                const progress = duration > 0 ? currentTime / duration : 0;
                const barProgress = i / 40;
                const isActive = barProgress <= progress;
                
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary' 
                        : currentPlaying === currentAudio.id 
                          ? 'bg-primary/30 animate-pulse' 
                          : 'bg-muted-foreground/20'
                    }`}
                    style={{
                      height: `${Math.random() * 20 + 8}px`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                );
              })}
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