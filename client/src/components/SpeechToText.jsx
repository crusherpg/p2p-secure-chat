import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SpeechToText = ({ onResult, isActive, onActiveChange }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      setupRecognition();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const setupRecognition = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 Speech recognition started');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      console.log('🎤 Speech recognition ended');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        onResult?.(finalTranscript.trim());
        setInterimTranscript('');
        
        // Auto-stop after getting final result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, 2000);
      } else {
        setInterimTranscript(interimText);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          toast.error('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          toast.error('Microphone not accessible. Please check permissions.');
          break;
        case 'not-allowed':
          toast.error('Microphone permission denied.');
          break;
        case 'network':
          toast.error('Network error. Please check your connection.');
          break;
        default:
          toast.error('Speech recognition failed. Please try again.');
      }
      
      setIsListening(false);
      onActiveChange?.(false);
    };
  };

  const startListening = async () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not available.');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      onActiveChange?.(true);
      
      // Auto-stop after 30 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        stopListening();
        toast.success('Speech recognition auto-stopped after 30 seconds.');
      }, 30000);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Unable to access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsListening(false);
    onActiveChange?.(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        className="p-1.5 rounded-full text-gray-300 cursor-not-allowed"
        title="Speech recognition not supported"
        disabled
      >
        <AlertCircle className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-1.5 rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 recording-pulse'
            : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/50'
        }`}
        title={isListening ? 'Stop speech recognition' : 'Start speech recognition'}
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Interim Transcript Popup */}
      {(isListening && (interimTranscript || transcript)) && (
        <div className="absolute bottom-full right-0 mb-2 min-w-48 max-w-xs">
          <div className="bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Listening...</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-900 dark:text-white">
              <span className="opacity-100">{transcript}</span>
              <span className="opacity-60 italic">{interimTranscript}</span>
              <span className="animate-pulse ml-1">|</span>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {isListening ? 'Speak clearly...' : 'Processing...'}
            </div>
            
            {/* Pointer arrow */}
            <div className="absolute top-full right-4 -mt-1">
              <div className="w-2 h-2 bg-white dark:bg-dark-700 border-b border-r border-gray-200 dark:border-dark-600 transform rotate-45" />
            </div>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-dark-800 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default SpeechToText;