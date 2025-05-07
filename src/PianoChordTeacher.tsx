import React, { useState, useEffect } from 'react';
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
    };
  }, [synth]);

  // Piano notes configuration
  const generateNotes = (): Note[] => {
    const notes: Note[] = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyboardKeys = [
      ['s', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o'], // Octave 2 (starting from D)
      ['l', 'p', ';', "'", ']', '\\', 'z', 'x', 'c', 'v', 'b', 'n'], // Octave 3
      ['m', ',', '.', '/', '['] // Octave 4 (partial)
    ];

    // Generate octaves of notes
    for (let octave = 2; octave <= 4; octave++) {
      const keysToUse = keyboardKeys[octave - 2];
      const notesToGenerate = octave === 4 ? 5 : 12; // Only generate 5 notes for octave 4
      
      const startIndex = octave === 2 ? 2 : 0; // Start from D for octave 2 (skipping C, C#)
      
      for (let i = 0; i < notesToGenerate; i++) {
        const noteIndex = startIndex + i >= 12 ? (startIndex + i) % 12 : startIndex + i;
        const isBlack = noteNames[noteIndex].includes('#');
        notes.push({
          note: `${noteNames[noteIndex]}${octave}`,
          key: keysToUse[i],
          isBlack,
          octave,
        });
      }
    }

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
      setActiveNotes((prev) => [...prev, note]);
      
      setTimeout(() => {
        setActiveNotes((prev) => prev.filter((n) => n !== note));
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
      const note = notes.find((n) => n.key === key);
      if (note && !activeNotes.includes(note.note)) {
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
      console.warn("Cannot play scale: Synth not initialized or no scale selected");
      return;
    }
    
    try {
      console.log("Playing scale:", scaleNotes);
      setIsPlaying(true);
      
      // Create the sequence of notes based on selected pattern
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
      
      // Create a sequence for playing notes one after another
      const noteIndex = { current: 0 };
      const highlightedNotes = { current: [] };
      
      // Set up timing with Transport
      Tone.Transport.bpm.value = playbackTempo;
      
      // Schedule each note to play sequentially
      const seq = new Tone.Sequence(
        (time, _) => {
          if (noteIndex.current < notesToPlay.length) {
            const currentNote = notesToPlay[noteIndex.current];
            
            // Clear previous highlighted notes
            setActiveNotes(prev => {
              highlightedNotes.current = [currentNote];
              return [currentNote];
            });
            
            // Play the current note with calculated velocity
            const velocity = getNoteVelocity(currentNote);
            synth.triggerAttackRelease(currentNote, "8n", time, velocity);
            
            noteIndex.current += 1;
          } else {
            // All notes played, clean up
            seq.stop();
            Tone.Transport.stop();
            setActiveNotes([]);
            setIsPlaying(false);
            
            // Reset for next playback
            noteIndex.current = 0;
          }
        },
        ['C4'],
        '8n'
      );
      
      // Start playback
      seq.start(0);
      Tone.Transport.start();
      
      // Set a safety timeout to ensure we don't get stuck in playing state
      const maxDuration = (notesToPlay.length * 60 / playbackTempo) * 1000 + 1000; // calculated from tempo
      setTimeout(() => {
        if (seq) {
          seq.dispose();
        }
        setActiveNotes([]);
        setIsPlaying(false);
      }, maxDuration);
      
    } catch (error) {
      console.error("Error playing scale:", error);
      setIsPlaying(false);
    }
  };

  // Check if a note is in the selected scale
  const isNoteInSelectedScale = (note: string): boolean => {
    return currentScale.includes(note) || (selectedChord?.notes.includes(note) || false);
  };

  // Change the existing function to use the scale check
  const isNoteInSelectedChord = (note: string): boolean => {
    return isNoteInSelectedScale(note);
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
          className={`absolute h-3/5 rounded-b-md z-10 transition-colors pointer-events-auto shadow-md border-x border-b border-gray-800 ${
            isActive
              ? 'bg-indigo-700 border-indigo-900'
              : isInChord
                ? 'bg-indigo-900 border-indigo-950'
                : 'bg-gray-800 hover:bg-gray-700'
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
                  onClick={() => setPlaybackPattern('ascending')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    playbackPattern === 'ascending'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Ascending
                </button>
                <button
                  onClick={() => setPlaybackPattern('descending')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    playbackPattern === 'descending'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Descending
                </button>
                <button
                  onClick={() => setPlaybackPattern('both')}
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
                  onChange={(e) => setPlaybackTempo(parseInt(e.target.value))}
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
                        className={`font-mono px-2 py-1 rounded transition-colors ${
                          isHighlighted 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-indigo-100'
                        }`}
                      >
                        {note}
                      </span>
                    );
                  })}
                </div>
                
                <div className="flex items-center mt-4">
                  <button
                    onClick={() => playScale(currentScale)}
                    disabled={isPlaying || !isToneInitialized}
                    className={`px-4 py-2 rounded-md ${
                      isPlaying || !isToneInitialized
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isPlaying ? 'Playing...' : 'Play Scale'}
                  </button>
                  
                  {isPlaying && (
                    <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-300"
                        style={{ 
                          width: `${
                            activeNotes.length > 0 
                              ? (currentScale.indexOf(activeNotes[0]) + 1) / currentScale.length * 100
                              : 0
                          }%` 
                        }}
                      />
                    </div>
                  )}
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
                    className={`font-mono px-2 py-1 rounded transition-colors ${
                      isHighlighted 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-indigo-100'
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
              
              {isPlaying && (
                <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${activeNotes.length > 0 ? 100 : 0}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Interactive Piano</h2>
          <p className="text-gray-600 mb-4">Click on keys or use your computer keyboard to play notes</p>
        </div>

        <div className="relative h-64 mb-8 overflow-hidden border border-gray-600 rounded-md bg-black shadow-lg">
          {/* Piano container */}
          <div className="relative flex h-full w-full">
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
                          ? 'bg-indigo-100'
                          : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-600">{whiteNote.note}</span>
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

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Keyboard Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {notes.map((note) => (
              <div key={note.note} className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded font-mono text-sm ${note.isBlack ? 'bg-gray-800 text-white' : 'bg-white border border-gray-300'}`}>
                  {note.key}
                </span>
                <span className="text-gray-700">{note.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoChordTeacher;
