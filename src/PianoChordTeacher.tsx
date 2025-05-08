import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { 
  ROOT_NOTES, 
  getScaleNotes, 
  getAvailableModes, 
  formatScaleName 
} from './musicTheory';

type Note = {
  note: string;
  key: string;
  isBlack: boolean;
  octave: number;
};

type Chord = {
  name: string;
  notes: string[];
  description: string;
};

// Add this enum for playback patterns
type PlaybackPattern = 'ascending' | 'descending' | 'both';

const PianoChordTeacher = () => {
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [selectedChord, setSelectedChord] = useState<Chord | null>(null);
  const [synth, setSynth] = useState<Tone.PolySynth | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isToneInitialized, setIsToneInitialized] = useState(false);
  
  // New state for scales feature
  const [selectedRootNote, setSelectedRootNote] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [currentScale, setCurrentScale] = useState<string[]>([]);
  const [showScalesInterface, setShowScalesInterface] = useState(false);
  const [startingOctave, setStartingOctave] = useState(3);
  const [playbackPattern, setPlaybackPattern] = useState<PlaybackPattern>('ascending');
  const [playbackTempo, setPlaybackTempo] = useState(120); // Default tempo: 120 BPM
  
  const currentSequenceRef = useRef<Tone.Sequence | null>(null);

  // Available modes for UI
  const availableModes = getAvailableModes();

  // Initialize Tone.js
  useEffect(() => {
    const initTone = async () => {
      try {
        // We'll try to auto-start, but browsers may still require interaction
        await Tone.start().catch(e => console.warn("Auto-start failed, will try on first user interaction:", e));
        console.log("Tone.js started or prepared to start on interaction");
        const newSynth = new Tone.PolySynth(Tone.Synth).toDestination();
        newSynth.volume.value = 0; // Set global synth volume (0 dB is nominal)
        setSynth(newSynth);
        setIsToneInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Tone.js:", error);
      }
    };

    if (!isToneInitialized) {
      initTone();
    }

    // Add a click listener to the document to initialize audio on first interaction
    const handleFirstInteraction = async () => {
      if (!isToneInitialized) {
        try {
          await Tone.start();
          console.log("Audio initialized on user interaction");
          if (!synth) {
            const newSynth = new Tone.PolySynth(Tone.Synth).toDestination();
            setSynth(newSynth);
          }
          setIsToneInitialized(true);
        } catch (err) {
          console.error("Failed to initialize audio on interaction:", err);
        }
      }
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      if (synth) {
        synth.dispose();
      }
    };
  }, [isToneInitialized, synth]);

  // Initialize Tone.js cleanup
  useEffect(() => {
    return () => {
      if (synth) {
        synth.dispose();
        console.log("Synth disposed on unmount");
      }
      // Clean up sequence and transport on unmount
      if (currentSequenceRef.current) {
        currentSequenceRef.current.dispose();
        currentSequenceRef.current = null;
      }
      Tone.Transport.cancel();
      Tone.Transport.stop();
      console.log("Tone.Transport stopped and sequence cleared on unmount");
    };
  }, [synth]);

  // Piano notes configuration
  const generateNotes = (): Note[] => {
    const notes: Note[] = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // New piano-like keyboard mapping
    // Home row (ASDF row): white keys
    // QWERTY row: black keys
    const whiteKeyMap = {
      'a': 'C3', 's': 'D3', 'd': 'E3', 'f': 'F3', 'g': 'G3', 'h': 'A3', 'j': 'B3',
      'k': 'C4', 'l': 'D4', ';': 'E4', "'": 'F4', '\\': 'G4'
    };
    
    const blackKeyMap = {
      'w': 'C#3', 'e': 'D#3', 't': 'F#3', 'y': 'G#3', 'u': 'A#3',
      'o': 'C#4', 'p': 'D#4', ']': 'F#4'
    };

    // Create white key notes
    Object.entries(whiteKeyMap).forEach(([key, noteWithOctave]) => {
      const noteName = noteWithOctave.slice(0, -1); // Remove octave
      const octave = parseInt(noteWithOctave.slice(-1));
      notes.push({
        note: noteWithOctave,
        key: key,
        isBlack: false,
        octave
      });
    });

    // Create black key notes
    Object.entries(blackKeyMap).forEach(([key, noteWithOctave]) => {
      const noteName = noteWithOctave.slice(0, -1); // Remove octave
      const octave = parseInt(noteWithOctave.slice(-1));
      notes.push({
        note: noteWithOctave,
        key: key,
        isBlack: true,
        octave
      });
    });

    return notes;
  };

  const notes = generateNotes();

  // Common piano chords
  const chords: Chord[] = [
    { name: 'C Major', notes: ['C3', 'E3', 'G3'], description: 'The C major chord consists of C, E, and G notes.' },
    { name: 'G Major', notes: ['G3', 'B3', 'D4'], description: 'The G major chord consists of G, B, and D notes.' },
    { name: 'F Major', notes: ['F3', 'A3', 'C4'], description: 'The F major chord consists of F, A, and C notes.' },
    { name: 'A Minor', notes: ['A3', 'C4', 'E4'], description: 'The A minor chord consists of A, C, and E notes.' },
    { name: 'D Minor', notes: ['D3', 'F3', 'A3'], description: 'The D minor chord consists of D, F, and A notes.' },
    { name: 'E Minor', notes: ['E3', 'G3', 'B3'], description: 'The E minor chord consists of E, G, and B notes.' },
    { name: 'C Major (Lower)', notes: ['C2', 'E2', 'G2'], description: 'The C major chord in a lower octave.' },
    { name: 'G Major (Lower)', notes: ['G2', 'B2', 'D3'], description: 'The G major chord in a lower octave.' },
    { name: 'D Major', notes: ['D3', 'F#3', 'A3'], description: 'The D major chord consists of D, F#, and A notes.' },
    { name: 'A Major', notes: ['A3', 'C#4', 'E4'], description: 'The A major chord consists of A, C#, and E notes.' }, 
    { name: 'B Minor', notes: ['B3', 'D4', 'F#4'], description: 'The B minor chord consists of B, D, and F# notes.' },
    { name: 'G Minor', notes: ['G3', 'Bb3', 'D4'], description: 'The G minor chord consists of G, Bb, and D notes.' },
  ];

  // Add this helper function for volume compensation based on note
  const getNoteVelocity = (noteName: string): number => {
    // Extract the octave from the note name (e.g., "C4" -> 4)
    const octave = parseInt(noteName.match(/\d+/)?.[0] || "3");
    
    // Base velocity - will be adjusted based on octave
    const baseVelocity = 0.9;
    
    // Higher octaves need lower velocity, lower octaves need higher velocity
    // These values will need experimentation
    switch (octave) {
      case 2: return baseVelocity * 1.4; // Boost lower octave
      case 3: return baseVelocity * 1.2; // Slightly boost middle-low octave
      case 4: return baseVelocity * 0.8; // Reduce middle-high octave
      case 5: return baseVelocity * 0.6; // Significantly reduce high octave
      default: return baseVelocity;
    }
  };

  // Play a note when a key is pressed
  const playNote = (note: string) => {
    if (!synth || !isToneInitialized) {
      console.warn("Synth not initialized or Tone not ready");
      return;
    }
    
    try {
      console.log("Playing note:", note);
      const velocity = getNoteVelocity(note);
      console.log(`Note ${note} velocity: ${velocity}`);
      synth.triggerAttackRelease(note, '8n', undefined, velocity);
      
      // Create a new array for activeNotes instead of modifying the existing one
      setActiveNotes(prev => [...prev, note]);
      
      setTimeout(() => {
        setActiveNotes(prev => prev.filter(n => n !== note));
      }, 300);
    } catch (error) {
      console.error("Error playing note:", error);
    }
  };

  // Play a chord
  const playChord = (chordNotes: string[]) => {
    if (!synth || !isToneInitialized) {
      console.warn("Synth not initialized or Tone not ready");
      return;
    }
    
    try {
      console.log("Playing chord:", chordNotes);
      setIsPlaying(true);
      
      // Clear any old active notes first
      setActiveNotes([]);
      // Then set the new active notes
      setActiveNotes(chordNotes);
      
      // Make sure we have valid notes before attempting to play
      if (chordNotes.length > 0) {
        // Play chord notes with a slight arpeggio effect
        const noteDelay = 0.1; // seconds between notes
        
        chordNotes.forEach((note, index) => {
          const velocity = getNoteVelocity(note);
          // Stagger the start times slightly for a more pleasing effect
          const startTime = Tone.now() + (index * noteDelay);
          // All notes sustain to create chord sound
          synth.triggerAttackRelease(note, "2n", startTime, velocity);
        });
      }
      
      setTimeout(() => {
        setActiveNotes([]);
        setIsPlaying(false);
      }, 1500);
    } catch (error) {
      console.error("Error playing chord:", error);
      setIsPlaying(false);
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      const note = notes.find((n) => n.key.toLowerCase() === key);
      
      if (note && !activeNotes.includes(note.note)) {
        console.log(`Key pressed: ${key}, playing note: ${note.note}`);
        playNote(note.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notes, activeNotes, isToneInitialized]);

  // Generate scale notes when root note or mode changes
  useEffect(() => {
    if (selectedRootNote && selectedMode) {
      const scaleNotes = getScaleNotes(selectedRootNote, startingOctave, selectedMode);
      setCurrentScale(scaleNotes);
      console.log('Scale notes:', scaleNotes);
    } else {
      setCurrentScale([]);
    }
  }, [selectedRootNote, selectedMode, startingOctave]);

  // Replace the playScale function with this sequential playback implementation
  const playScale = (scaleNotes: string[]) => {
    if (!synth || !isToneInitialized || scaleNotes.length === 0) {
      console.warn("Cannot play scale: Synth not initialized, Tone not ready, or no scale notes provided");
      // Ensure isPlaying is false if we return early
      if (scaleNotes.length === 0 && isPlaying) {
        setIsPlaying(false);
      }
      return;
    }

    // Log for debugging
    console.log("Playing scale:", scaleNotes);

    // Dispose previous sequence and stop transport
    if (currentSequenceRef.current) {
      currentSequenceRef.current.dispose();
      currentSequenceRef.current = null;
    }
    Tone.Transport.cancel(); // Clear any scheduled transport events
    Tone.Transport.stop();   // Stop the transport before starting a new one

    try {
      setIsPlaying(true);
      setActiveNotes([]); // Clear active notes at the beginning

      let notesToPlay: string[] = [];
      switch (playbackPattern) {
        case 'ascending':
          notesToPlay = [...scaleNotes];
          break;
        case 'descending':
          notesToPlay = [...scaleNotes].reverse();
          break;
        case 'both':
          // For both, play ascending then descending but don't repeat the top note
          notesToPlay = [...scaleNotes, ...[...scaleNotes].slice(0, -1).reverse()];
          break;
      }

      // If after pattern logic, notesToPlay is empty (e.g. original scaleNotes was a single note for 'both')
      if (notesToPlay.length === 0) {
        setIsPlaying(false);
        setActiveNotes([]);
        console.warn("No notes to play after applying pattern.");
        return;
      }
      
      // Set the tempo
      Tone.Transport.bpm.value = playbackTempo;

      // Create a simplified sequencer using setTimeout for more reliable playback
      let noteIndex = 0;
      const playNextNote = () => {
        if (noteIndex < notesToPlay.length) {
          const note = notesToPlay[noteIndex];
          // Highlight the current note
          setActiveNotes([note]);
          // Play the note
          const velocity = getNoteVelocity(note);
          synth.triggerAttackRelease(note, "8n", undefined, velocity);
          
          // Schedule the next note
          noteIndex++;
          // Calculate next note delay based on tempo (60000ms / bpm = ms per quarter note)
          // For 8th notes, divide by 2
          const noteDelay = (60000 / playbackTempo) / 2;
          setTimeout(playNextNote, noteDelay);
        } else {
          // Done playing
          setActiveNotes([]);
          setIsPlaying(false);
        }
      };
      
      // Start playing the sequence
      playNextNote();
      
    } catch (error) {
      console.error("Error playing scale:", error);
      setIsPlaying(false);
      setActiveNotes([]); // Ensure notes are cleared on error
    }
  };

  // Check if a note is in the selected scale
  const isNoteInSelectedScale = (note: string): boolean => {
    return currentScale.includes(note);
  };

  // Check if a note is in the selected chord
  const isNoteInSelectedChord = (note: string): boolean => {
    if (showScalesInterface) {
      return isNoteInSelectedScale(note);
    } else {
      return selectedChord?.notes.includes(note) || false;
    }
  };

  // Helper function to render black keys
  const renderBlackKeys = (noteName: string) => {
    const blackKeys = notes.filter(note => note.isBlack && note.note.startsWith(noteName));
    const whiteKeys = notes.filter(note => !note.isBlack);
    const totalWhiteKeys = whiteKeys.length;
    
    return blackKeys.map(blackKey => {
      const octave = parseInt(blackKey.note.slice(-1));
      const isActive = activeNotes.includes(blackKey.note);
      const isInChord = isNoteInSelectedChord(blackKey.note);
      
      // Find position based on preceding white key
      const baseName = noteName.charAt(0); // Get the base note (C from C#)
      const precedingWhiteKey = whiteKeys.find(
        note => note.note.charAt(0) === baseName && parseInt(note.note.slice(-1)) === octave
      );
      
      if (!precedingWhiteKey) return null;
      
      // Calculate position
      const whiteKeyIndex = whiteKeys.indexOf(precedingWhiteKey);
      const position = (whiteKeyIndex / totalWhiteKeys) * 100 + 0.65 * (100 / totalWhiteKeys);
      
      return (
        <button
          key={blackKey.note}
          onClick={(e) => {
            e.stopPropagation();
            playNote(blackKey.note);
          }}
          className={`absolute h-3/5 rounded-b-md z-10 transition-colors pointer-events-auto shadow-md border-x border-b ${
            isActive
              ? 'bg-indigo-700 border-indigo-900'
              : isInChord
                ? 'bg-indigo-800 border-indigo-900 shadow-inner'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-800'
          }`}
          style={{ 
            left: `${position}%`,
            width: `${0.65 * (100 / totalWhiteKeys)}%`,
            top: 0
          }}
        >
          <span className="text-xs font-semibold text-white absolute bottom-2 left-0 right-0 text-center">
            {blackKey.note}
          </span>
        </button>
      );
    });
  };

  // Make sure piano keyboard is updated when switching between chord and scale modes
  useEffect(() => {
    // When switching interfaces, clear active notes
    setActiveNotes([]);
  }, [showScalesInterface]);

  // Fix keyboard movement by adding a fixed height to the container
  useEffect(() => {
    // Reset active notes when changing modes, chords, or scales
    return () => {
      setActiveNotes([]);
    };
  }, [selectedChord, selectedRootNote, selectedMode]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">Piano Chord & Scale Teacher</h1>
        
        {!isToneInitialized && (
          <div className="text-center mb-2 text-sm text-gray-500">
            <p>Audio will start automatically with your first interaction</p>
          </div>
        )}

        {/* Feature toggle buttons */}
        <div className="mb-6 flex justify-center space-x-4">
          <button
            onClick={() => setShowScalesInterface(false)}
            className={`px-5 py-2 rounded-md transition-colors ${!showScalesInterface
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Learn Chords
          </button>
          <button
            onClick={() => setShowScalesInterface(true)}
            className={`px-5 py-2 rounded-md transition-colors ${showScalesInterface
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Learn Scales
          </button>
        </div>

        {/* Scales Interface */}
        {showScalesInterface && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Select a Scale/Mode to Learn</h2>
            
            {/* Root Note Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">1. Choose a Root Note:</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                {ROOT_NOTES.map(note => (
                  <button
                    key={note}
                    onClick={() => setSelectedRootNote(note)}
                    className={`px-3 py-2 rounded-md text-center transition-colors ${
                      selectedRootNote === note
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mode Selection - only enabled if root note is selected */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">2. Choose a Scale/Mode:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {availableModes.map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSelectedMode(mode);
                      if (selectedRootNote) {
                        const scaleNotes = getScaleNotes(selectedRootNote, startingOctave, mode);
                        setCurrentScale(scaleNotes);
                        // Use a small delay to ensure state is updated before playing
                        setTimeout(() => playScale(scaleNotes), 100);
                      }
                    }}
                    disabled={!selectedRootNote}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      !selectedRootNote
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selectedMode === mode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Octave Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">3. Starting Octave:</h3>
              <div className="flex space-x-2">
                {[2, 3, 4].map(octave => (
                  <button
                    key={octave}
                    onClick={() => {
                      setStartingOctave(octave);
                      if (selectedRootNote && selectedMode) {
                        const scaleNotes = getScaleNotes(selectedRootNote, octave, selectedMode);
                        setCurrentScale(scaleNotes);
                        // Use a small delay to ensure state is updated before playing
                        setTimeout(() => playScale(scaleNotes), 100);
                      }
                    }}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      startingOctave === octave
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {octave}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Add Playback Pattern Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">4. Playback Pattern:</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setPlaybackPattern('ascending');
                    if (selectedRootNote && selectedMode && currentScale.length > 0) {
                      // Use a small delay to ensure state is updated before playing
                      setTimeout(() => playScale(currentScale), 100);
                    }
                  }}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    playbackPattern === 'ascending'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Ascending
                </button>
                <button
                  onClick={() => {
                    setPlaybackPattern('descending');
                    if (selectedRootNote && selectedMode && currentScale.length > 0) {
                      // Use a small delay to ensure state is updated before playing
                      setTimeout(() => playScale(currentScale), 100);
                    }
                  }}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    playbackPattern === 'descending'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Descending
                </button>
                <button
                  onClick={() => {
                    setPlaybackPattern('both');
                    if (selectedRootNote && selectedMode && currentScale.length > 0) {
                      // Use a small delay to ensure state is updated before playing
                      setTimeout(() => playScale(currentScale), 100);
                    }
                  }}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    playbackPattern === 'both'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>
            
            {/* Add Tempo Control */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-gray-700">5. Tempo (BPM):</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="60"
                  max="240"
                  step="10"
                  value={playbackTempo}
                  onChange={(e) => {
                    const newTempo = parseInt(e.target.value);
                    setPlaybackTempo(newTempo);
                    // If we have a scale selected, play it with the new tempo after a small delay
                    if (selectedRootNote && selectedMode && currentScale.length > 0 && !isPlaying) {
                      setTimeout(() => playScale(currentScale), 100);
                    }
                  }}
                  className="w-48"
                />
                <span className="text-gray-700 w-12">{playbackTempo}</span>
              </div>
            </div>
            
            {/* Scale Information Display */}
            {selectedRootNote && selectedMode && currentScale.length > 0 && (
              <div className="mb-8 p-4 bg-indigo-50 rounded-lg">
                <h3 className="text-xl font-semibold text-indigo-700">
                  {formatScaleName(selectedRootNote, selectedMode)}
                </h3>
                
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <span className="text-gray-600">Notes:</span>
                  {currentScale.map((note, index) => {
                    const isHighlighted = activeNotes.includes(note);
                    return (
                      <span 
                        key={note} 
                        className={`font-mono px-2 py-1 rounded transition-colors border ${
                          isHighlighted 
                            ? 'bg-indigo-500 text-white border-indigo-500' 
                            : 'bg-indigo-200 text-indigo-700 border-indigo-400'
                        }`}
                      >
                        {note}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing Chord Selection UI - only shown when not in scales mode */}
        {!showScalesInterface && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Select a Chord to Learn</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {chords.map((chord) => (
                <button
                  key={chord.name}
                  onClick={() => {
                    setSelectedChord(chord);
                    playChord(chord.notes); // Automatically play the chord when selected
                  }}
                  className={`p-4 rounded-md text-center transition-colors shadow ${selectedChord?.name === chord.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  {chord.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing Selected Chord Display - only shown when not in scales mode */}
        {!showScalesInterface && selectedChord && (
          <div className="mb-8 p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-xl font-semibold text-indigo-700">{selectedChord.name}</h3>
            <p className="text-gray-700 mb-3">{selectedChord.description}</p>
            <div className="flex gap-2">
              <span className="text-gray-600">Notes:</span>
              {selectedChord.notes.map((note) => {
                const isHighlighted = activeNotes.includes(note);
                return (
                  <span 
                    key={note} 
                    className={`font-mono px-2 py-1 rounded transition-colors border ${
                      isHighlighted 
                        ? 'bg-indigo-500 text-white border-indigo-500' 
                        : 'bg-indigo-200 text-indigo-700 border-indigo-400'
                    }`}
                  >
                    {note}
                  </span>
                );
              })}
            </div>
            
            <div className="flex items-center mt-4">
              <button
                onClick={() => playChord(selectedChord.notes)}
                disabled={isPlaying || !isToneInitialized}
                className={`px-4 py-2 rounded-md ${isPlaying || !isToneInitialized
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isPlaying ? 'Playing...' : 'Play Chord'}
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Interactive Piano</h2>
          <p className="text-gray-600 mb-4">Click on keys or use your computer keyboard to play notes</p>
        </div>

        <div className="relative h-64 mb-8 overflow-hidden border border-gray-600 rounded-md bg-black shadow-lg">
          {/* Piano container with fixed dimensions to prevent layout shifts */}
          <div className="relative flex h-full w-full" style={{ minHeight: "14rem" }}>
            {/* First, render all white keys */}
            {notes.filter(note => !note.isBlack).map((whiteNote, index, whiteKeysArray) => {
              const isActive = activeNotes.includes(whiteNote.note);
              const isInChord = isNoteInSelectedChord(whiteNote.note);
              const totalWhiteKeys = whiteKeysArray.length;
              
              return (
                <div 
                  key={whiteNote.note} 
                  className="h-full" 
                  style={{ width: `${100 / totalWhiteKeys}%` }}
                >
                  <button
                    onClick={() => playNote(whiteNote.note)}
                    className={`h-full w-full border border-gray-500 rounded-b-lg flex items-end justify-center pb-2 transition-colors shadow-inner ${
                      isActive
                        ? 'bg-indigo-300'
                        : isInChord
                          ? 'bg-indigo-200'
                          : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isInChord ? 'text-indigo-700' : 'text-gray-600'}`}>
                      {whiteNote.note}
                    </span>
                  </button>
                </div>
              );
            })}
            
            {/* Now render all black keys as an overlay */}
            {/* C# */}
            {renderBlackKeys('C#')}
            {/* D# */}
            {renderBlackKeys('D#')}
            {/* F# */}
            {renderBlackKeys('F#')}
            {/* G# */}
            {renderBlackKeys('G#')}
            {/* A# */}
            {renderBlackKeys('A#')}
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Keyboard Controls</h3>
          <p className="text-gray-600 mb-4">Play using your computer keyboard with piano-like layout:</p>
          
          {/* Visual piano keyboard layout */}
          <div className="flex flex-col items-center mb-6">
            {/* Black keys row */}
            <div className="flex relative mb-2 gap-1">
              <span className="text-sm font-medium text-gray-500 absolute -left-16 top-1/2 transform -translate-y-1/2">QWERTY Row:</span>
              <div className="flex">
                {/* Empty space for C and D positioning */}
                <div className="w-7"></div>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">W</span>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">E</span>
                <div className="w-7"></div>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">T</span>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">Y</span>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">U</span>
                <div className="w-7"></div>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">O</span>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">P</span>
                <div className="w-7"></div>
                <span className="w-12 h-12 rounded-md bg-gray-800 text-white flex items-center justify-center text-lg font-bold mx-1">]</span>
              </div>
            </div>
            
            {/* Notes for black keys */}
            <div className="flex relative mb-6 gap-1">
              <div className="flex">
                <div className="w-7"></div>
                <span className="w-12 text-center text-sm font-medium mx-1">C#3</span>
                <span className="w-12 text-center text-sm font-medium mx-1">D#3</span>
                <div className="w-7"></div>
                <span className="w-12 text-center text-sm font-medium mx-1">F#3</span>
                <span className="w-12 text-center text-sm font-medium mx-1">G#3</span>
                <span className="w-12 text-center text-sm font-medium mx-1">A#3</span>
                <div className="w-7"></div>
                <span className="w-12 text-center text-sm font-medium mx-1">C#4</span>
                <span className="w-12 text-center text-sm font-medium mx-1">D#4</span>
                <div className="w-7"></div>
                <span className="w-12 text-center text-sm font-medium mx-1">F#4</span>
              </div>
            </div>
            
            {/* White keys row */}
            <div className="flex relative mb-2">
              <span className="text-sm font-medium text-gray-500 absolute -left-16 top-1/2 transform -translate-y-1/2">Home Row:</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">A</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">S</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">D</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">F</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">G</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">H</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">J</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">K</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">L</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">;</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">'</span>
              <span className="w-12 h-12 rounded-md bg-white border-2 border-gray-300 flex items-center justify-center text-lg font-bold mx-1">\</span>
            </div>
            
            {/* Notes for white keys */}
            <div className="flex">
              <span className="w-12 text-center text-sm font-medium mx-1">C3</span>
              <span className="w-12 text-center text-sm font-medium mx-1">D3</span>
              <span className="w-12 text-center text-sm font-medium mx-1">E3</span>
              <span className="w-12 text-center text-sm font-medium mx-1">F3</span>
              <span className="w-12 text-center text-sm font-medium mx-1">G3</span>
              <span className="w-12 text-center text-sm font-medium mx-1">A3</span>
              <span className="w-12 text-center text-sm font-medium mx-1">B3</span>
              <span className="w-12 text-center text-sm font-medium mx-1">C4</span>
              <span className="w-12 text-center text-sm font-medium mx-1">D4</span>
              <span className="w-12 text-center text-sm font-medium mx-1">E4</span>
              <span className="w-12 text-center text-sm font-medium mx-1">F4</span>
              <span className="w-12 text-center text-sm font-medium mx-1">G4</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-center font-medium">White keys on the home row (A-L), black keys on the row above (QWERTY)</p>
        </div>
      </div>
    </div>
  );
};

export default PianoChordTeacher;
