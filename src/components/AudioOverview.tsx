import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Headphones } from 'lucide-react';

export const AudioOverview: React.FC = () => {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'hindi' | 'english'>('hindi');
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Mock audio data - in real app this would come from admin uploads
  const audioFiles = [
    {
      id: 'hindi-overview',
      language: 'hindi' as const,
      title: 'Hindi Overview',
      description: 'Key objections analysis in Hindi',
      duration: '2:45',
      // Using a placeholder audio URL - replace with actual audio files
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
    },
    {
      id: 'english-overview',
      language: 'english' as const,
      title: 'English Overview',
      description: 'Key objections analysis in English',
      duration: '2:30',
      // Using a placeholder audio URL - replace with actual audio files
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
    }
  ];

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

  const getAudioForLanguage = (language: 'hindi' | 'english') => {
    return audioFiles.find(audio => audio.language === language);
  };

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant={selectedLanguage === 'hindi' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedLanguage('hindi')}
          className="flex-1"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Hindi
        </Button>
        <Button 
          variant={selectedLanguage === 'english' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedLanguage('english')}
          className="flex-1"
        >
          <Headphones className="h-4 w-4 mr-2" />
          English
        </Button>
      </div>

      {/* Audio Player */}
      {(() => {
        const audio = getAudioForLanguage(selectedLanguage);
        if (!audio) return null;

        return (
          <Card className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/40 rounded-xl flex items-center justify-center animate-scale-in">
                    {currentPlaying === audio.id ? (
                      <div className="w-6 h-6 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <Volume2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{audio.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{audio.description}</p>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePlayPause(audio.id)}
                      className="hover-scale"
                    >
                      {currentPlaying === audio.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="text-xs text-muted-foreground">
                      Duration: {audio.duration}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Element */}
              <audio
                ref={el => {
                  if (el) audioRefs.current[audio.id] = el;
                }}
                src={audio.url}
                onEnded={() => setCurrentPlaying(null)}
                className="hidden"
              />

              {/* Visual Waveform Placeholder */}
              <div className="mt-4 flex items-center space-x-1 h-8">
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-gradient-to-t from-primary/30 to-primary rounded-full transition-all duration-300 ${
                      currentPlaying === audio.id ? 'animate-pulse' : ''
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
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3">📝 Audio Highlights</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
              <p><strong>Cost Objection:</strong> "Premium is very high" - major barrier to conversion</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
              <p><strong>Investment Clarity:</strong> Confusion about health and wealth combination needs addressing</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              <p><strong>Action Required:</strong> Immediate intervention needed for high-impact objections</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};