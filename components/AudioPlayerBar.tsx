
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Rewind, FastForward } from 'lucide-react';

interface AudioPlayerBarProps {
  audioSrc: string | null;
  onTimeUpdate: (time: number) => void;
  externalCurrentTime: number | null; // Allow parent to control time
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ audioSrc, onTimeUpdate, externalCurrentTime }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Sync with external time updates (e.g. clicking transcript)
  useEffect(() => {
    if (externalCurrentTime !== null && audioRef.current) {
      if (Math.abs(audioRef.current.currentTime - externalCurrentTime) > 0.5) {
        audioRef.current.currentTime = externalCurrentTime;
      }
    }
  }, [externalCurrentTime]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100);
      onTimeUpdate(current);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (!audioSrc) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4 z-40 animate-slide-up">
      <div className="max-w-7xl mx-auto flex items-center gap-4 sm:gap-6">
        <audio 
          ref={audioRef} 
          src={audioSrc} 
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Play/Pause Button */}
        <button 
          onClick={togglePlay}
          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform active:scale-95 flex-shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />}
        </button>

        {/* Time & Progress */}
        <div className="flex-grow flex flex-col gap-1">
          <div className="flex justify-between text-xs font-mono font-medium text-slate-500">
            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress || 0} 
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500"
          />
        </div>

        {/* Skip Buttons (Hidden on small screens) */}
        <div className="hidden sm:flex items-center gap-2">
           <button 
             onClick={() => { if(audioRef.current) audioRef.current.currentTime -= 10; }}
             className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors"
           >
             <Rewind className="w-5 h-5" />
           </button>
           <button 
             onClick={() => { if(audioRef.current) audioRef.current.currentTime += 10; }}
             className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors"
           >
             <FastForward className="w-5 h-5" />
           </button>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2 w-24">
          <button onClick={toggleMute} className="text-slate-400 hover:text-slate-600">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              if(audioRef.current) audioRef.current.volume = val;
              setIsMuted(val === 0);
            }}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
          />
        </div>
      </div>
    </div>
  );
};
