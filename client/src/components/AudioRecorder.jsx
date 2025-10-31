import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const AudioRecorder = ({ onAudioRecorded, onClose, isRecording, onRecordingStateChange }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recordingInterval = useRef(null);
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const audioElement = useRef(null);

  const maxRecordingTime = 300; // 5 minutes in seconds

  useEffect(() => {
    // Initialize waveform with default values
    setWaveformData(Array.from({ length: 40 }, () => Math.random() * 0.5 + 0.1));
    
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Setup audio context for waveform visualization
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      analyser.current.fftSize = 256;
      
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      onRecordingStateChange(true);
      setRecordingTime(0);
      
      // Start recording timer and waveform animation
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
          }
          return newTime;
        });
        
        // Update waveform during recording
        if (analyser.current) {
          const bufferLength = analyser.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.current.getByteFrequencyData(dataArray);
          
          const waveform = [];
          const sampleSize = Math.floor(bufferLength / 40);
          for (let i = 0; i < 40; i++) {
            const start = i * sampleSize;
            const slice = dataArray.slice(start, start + sampleSize);
            const average = slice.reduce((a, b) => a + b, 0) / slice.length;
            waveform.push(average / 255);
          }
          setWaveformData(waveform);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
    
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    
    onRecordingStateChange(false);
  };

  const playRecording = () => {
    if (audioElement.current) {
      if (isPlaying) {
        audioElement.current.pause();
        setIsPlaying(false);
      } else {
        audioElement.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const sendRecording = () => {
    if (audioBlob && audioURL) {
      const duration = formatTime(recordingTime);
      const size = Math.round(audioBlob.size / 1024) + ' KB';
      
      onAudioRecorded({
        audioURL,
        audioBlob,
        duration,
        size
      });
      
      deleteRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 bg-white dark:bg-dark-800">
      {/* Recording Interface */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Voice Message
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
        </span>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center h-16 bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
          <div className="flex items-center space-x-1 flex-1 justify-center">
            {waveformData.map((height, index) => (
              <div
                key={index}
                className={`w-1 bg-primary-500 rounded-full transition-all duration-150 ${
                  isRecording ? 'animate-pulse' : ''
                }`}
                style={{
                  height: `${Math.max(4, height * 40)}px`,
                  opacity: isRecording ? (index % 3 === 0 ? 1 : 0.7) : 0.5
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!audioURL ? (
          // Recording Controls
          <>
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500 transition-colors"
            >
              <span className="text-sm font-medium">Cancel</span>
            </button>
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-4 rounded-full transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 recording-pulse'
                  : 'bg-primary-600 hover:bg-primary-700'
              } text-white shadow-lg hover:shadow-xl`}
            >
              {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            
            <div className="w-16" /> {/* Spacer for symmetry */}
          </>
        ) : (
          // Playback Controls
          <>
            <button
              onClick={deleteRecording}
              className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              title="Delete recording"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <button
              onClick={playRecording}
              className="p-4 rounded-full bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-500 transition-colors"
              title="Play recording"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            
            <button
              onClick={sendRecording}
              className="p-4 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              title="Send recording"
            >
              <Send className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${(recordingTime / maxRecordingTime) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Hidden Audio Element for Playback */}
      {audioURL && (
        <audio
          ref={audioElement}
          src={audioURL}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className="mt-4 text-center">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>Recording in progress...</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;