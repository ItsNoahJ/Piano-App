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

// Timeline Sequencer types
type SequenceItemType = 'chord' | 'scale';

type SequenceItem = {
  id: string;
  type: SequenceItemType;
  rootNote?: string;
  mode?: string;
  chord?: Chord;
  playbackPattern: PlaybackPattern;
  tempo?: number; // Optional tempo override
};

// Timeline Sequencer Component
const TimelineSequencer: React.FC<{
  timelineItems: Array<SequenceItem | null>;
  isTimelineSequencePlaying: boolean;
  currentTimelineIndex: number | null;
  playEntireTimeline: () => void;
  stopTimelinePlayback: () => void;
  clearAllTimelineItems: () => void;
  removeItemFromTimeline: (index: number) => void;
  addCurrentSelectionToTimeline: (index: number) => void;
  showScalesInterface: boolean;
  selectedRootNote: string | null;
  selectedMode: string | null;
  selectedChord: Chord | null;
  playbackTempo: number;
  isLandscape: boolean;
}> = ({
  timelineItems,
  isTimelineSequencePlaying,
  currentTimelineIndex,
  playEntireTimeline,
  stopTimelinePlayback,
  clearAllTimelineItems,
  removeItemFromTimeline,
  addCurrentSelectionToTimeline,
  showScalesInterface,
  selectedRootNote,
  selectedMode,
  selectedChord,
  playbackTempo,
  isLandscape
}) => {
  return (
    <div className={`${isLandscape ? 'mb-4' : 'mb-8'} p-4 bg-gray-50 rounded-lg shadow-sm timeline-sequencer`}>
      <h2 className={`${isLandscape ? 'text-lg' : 'text-xl'} font-semibold mb-4 text-gray-800`}>Timeline Sequencer</h2>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <p className={`text-gray-600 mb-2 md:mb-0 ${isLandscape ? 'text-sm' : ''}`}>Arrange up to 4 scales or chords to play in sequence</p>
        
        <div className="flex space-x-2">
          <button
            onClick={playEntireTimeline}
            disabled={isTimelineSequencePlaying || timelineItems.every(item => item === null)}
            className={`${isLandscape ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} rounded-md transition-colors flex items-center ${
              isTimelineSequencePlaying || timelineItems.every(item => item === null)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {/* Play icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`${isLandscape ? 'h-4 w-4' : 'h-5 w-5'} mr-1`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Play Sequence
          </button>
          
          <button
            onClick={stopTimelinePlayback}
            disabled={!isTimelineSequencePlaying}
            className={`${isLandscape ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} rounded-md transition-colors flex items-center ${
              !isTimelineSequencePlaying
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {/* Stop icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className={`${isLandscape ? 'h-4 w-4' : 'h-5 w-5'} mr-1`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Stop
          </button>
          
          <button
            onClick={clearAllTimelineItems}
            disabled={isTimelineSequencePlaying || timelineItems.every(item => item === null)}
            className={`${isLandscape ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} rounded-md transition-colors ${
              isTimelineSequencePlaying || timelineItems.every(item => item === null)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Clear All
          </button>
        </div>
      </div>
      
      {/* Timeline Slots - Adjust grid layout based on screen size */}
      <div className={`grid ${isLandscape ? 'grid-cols-2 gap-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'}`}>
        {timelineItems.map((item, index) => (
          <div 
            key={index}
            className={`border rounded-md ${isLandscape ? 'p-2 min-h-[100px]' : 'p-3 min-h-[120px]'} flex flex-col justify-between transition-colors ${
              currentTimelineIndex === index && isTimelineSequencePlaying
                ? 'border-indigo-500 bg-indigo-50'
                : item ? 'border-gray-300 bg-white' : 'border-dashed border-gray-300 bg-white'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-gray-500 font-medium">Slot {index + 1}</div>
              {item ? (
                <button
                  onClick={() => removeItemFromTimeline(index)}
                  disabled={isTimelineSequencePlaying}
                  className={`text-gray-400 hover:text-gray-600 ${isTimelineSequencePlaying ? 'cursor-not-allowed' : ''}`}
                >
                  {/* X icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
            
            {item ? (
              <div className="text-center">
                {item.type === 'scale' && item.rootNote && item.mode ? (
                  <div>
                    <div className="font-medium text-indigo-800">{item.rootNote} {item.mode}</div>
                    <div className="text-sm text-gray-600">{item.playbackPattern}</div>
                    {item.tempo !== playbackTempo && (
                      <div className="text-xs text-gray-500 mt-1">{item.tempo} BPM</div>
                    )}
                  </div>
                ) : item.type === 'chord' && item.chord ? (
                  <div>
                    <div className="font-medium text-indigo-800">{item.chord.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.chord.notes.join(', ')}</div>
                  </div>
                ) : (
                  <div className="text-gray-400">Invalid item</div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <button
                  onClick={() => addCurrentSelectionToTimeline(index)}
                  disabled={isTimelineSequencePlaying || 
                    (showScalesInterface && (!selectedRootNote || !selectedMode)) || 
                    (!showScalesInterface && !selectedChord)}
                  className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center ${
                    isTimelineSequencePlaying || 
                    (showScalesInterface && (!selectedRootNote || !selectedMode)) || 
                    (!showScalesInterface && !selectedChord)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <div className="text-gray-400 text-xs mt-2">Empty</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Keyboard Controls Component
const KeyboardControls: React.FC<{ isLandscape: boolean }> = ({ isLandscape }) => {
  return (
    <div className={`bg-gray-100 p-6 rounded-lg ${isLandscape ? 'mt-4' : 'mt-8'}`}>
      <h3 className={`${isLandscape ? 'text-lg' : 'text-xl'} font-semibold mb-3 text-gray-800`}>Keyboard Controls</h3>
      <p className="text-gray-600 mb-4">Play using your computer keyboard with piano-like layout:</p>
      
      {/* Visual piano keyboard layout */}
      <div className={`flex flex-col items-center ${isLandscape ? 'mb-4' : 'mb-6'}`}>
        {/* Black keys row */}
        <div className={`flex relative mb-2 gap-1 ${isLandscape ? 'scale-90 origin-left' : ''}`}>
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
        <div className={`flex relative mb-6 gap-1 ${isLandscape ? 'scale-90 origin-left' : ''}`}>
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
        <div className={`flex relative gap-1 ${isLandscape ? 'scale-90 origin-left' : ''}`}>
          <span className="text-sm font-medium text-gray-500 absolute -left-16 top-1/2 transform -translate-y-1/2">Home Row:</span>
          <div className="flex">
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">A</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">S</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">D</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">F</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">G</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">H</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">J</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">K</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">L</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">;</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">'</span>
            <span className="w-12 h-12 rounded-md bg-white border border-gray-300 flex items-center justify-center text-lg font-bold mx-1">\</span>
          </div>
        </div>
        
        {/* Notes for white keys */}
        <div className={`flex relative mt-1 gap-1 ${isLandscape ? 'scale-90 origin-left' : ''}`}>
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
      </div>
      
      <p className="text-gray-600 text-center font-medium">White keys on the home row (A-L), black keys on the row above (QWERTY)</p>
    </div>
  );
};

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
  // Add a ref to track chord cleanup timeout
  const chordTimeoutRef = useRef<number | null>(null);

  // Timeline Sequencer state
  const [timelineItems, setTimelineItems] = useState<Array<SequenceItem | null>>([null, null, null, null]); // 4 slots
  const [isTimelineSequencePlaying, setIsTimelineSequencePlaying] = useState(false);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState<number | null>(null);
  const timelineSequenceRef = useRef<any>(null);
  
  // Add state to track aspect ratio
  const [isLandscape, setIsLandscape] = useState(false);

  // Load timeline items from localStorage on initial render
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('pianoTeacherTimelineItems');
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems);
        // Validate the saved items
        if (Array.isArray(parsedItems) && parsedItems.length === 4) {
          setTimelineItems(parsedItems);
          console.log('Loaded timeline items from localStorage');
        }
      }
    } catch (error) {
      console.error('Error loading timeline items from localStorage:', error);
    }
  }, []);

  // Add effect to detect aspect ratio changes
  useEffect(() => {
    const checkAspectRatio = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsLandscape(aspectRatio >= 16/9);
    };
    
    // Check initially
    checkAspectRatio();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkAspectRatio);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkAspectRatio);
    };
  }, []);

  // Save timeline items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pianoTeacherTimelineItems', JSON.stringify(timelineItems));
      console.log('Saved timeline items to localStorage');
    } catch (error) {
      console.error('Error saving timeline items to localStorage:', error);
    }
  }, [timelineItems]);

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
      // Clean up chord timeout
      if (chordTimeoutRef.current !== null) {
        clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = null;
      }
      // Clean up timeline playback
      if (timelineSequenceRef.current) {
        clearTimeout(timelineSequenceRef.current);
        timelineSequenceRef.current = null;
      }
      Tone.Transport.cancel();
      Tone.Transport.stop();
      console.log("Tone.Transport stopped and all sequences cleared on unmount");
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
    { name: 'C Minor', notes: ['C3', 'D#3', 'G3'], description: 'The C minor chord consists of C, Eb (D#), and G notes.' },
    { name: 'F Major', notes: ['F3', 'A3', 'C4'], description: 'The F major chord consists of F, A, and C notes.' },
    { name: 'G Major', notes: ['G3', 'B3', 'D4'], description: 'The G major chord consists of G, B, and D notes.' },
    { name: 'D Major', notes: ['D3', 'F#3', 'A3'], description: 'The D major chord consists of D, F#, and A notes.' },
    { name: 'D Minor', notes: ['D3', 'F3', 'A3'], description: 'The D minor chord consists of D, F, and A notes.' },
    { name: 'E Major', notes: ['E3', 'G#3', 'B3'], description: 'The E major chord consists of E, G#, and B notes.' },
    { name: 'E Minor', notes: ['E3', 'G3', 'B3'], description: 'The E minor chord consists of E, G, and B notes.' },
    { name: 'A Major', notes: ['A3', 'C#4', 'E4'], description: 'The A major chord consists of A, C#, and E notes.' }, 
    { name: 'A Minor', notes: ['A3', 'C4', 'E4'], description: 'The A minor chord consists of A, C, and E notes.' },
    { name: 'B Minor', notes: ['B3', 'D4', 'F#4'], description: 'The B minor chord consists of B, D, and F# notes.' },
    { name: 'G Minor', notes: ['G3', 'A#3', 'D4'], description: 'The G minor chord consists of G, Bb (A#), and D notes.' },
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
      // Validate note format more strictly
      if (!note || typeof note !== 'string') {
        console.error("Invalid note format:", note);
        return;
      }
      
      // If a chord is currently playing, stop it
      if (isPlaying) {
        // Cancel the cleanup timeout for any playing chord
        if (chordTimeoutRef.current !== null) {
          clearTimeout(chordTimeoutRef.current);
          chordTimeoutRef.current = null;
        }
        
        // Release all currently playing notes
        synth.releaseAll();
        setIsPlaying(false);
      }
      
      // More comprehensive note validation
      const notePattern = /^([A-G][b#]?)(\d)$/;
      if (!notePattern.test(note)) {
        console.warn(`Invalid note format: "${note}". Note must be in format like "C4", "F#3", "Eb5".`);
        return; // Don't try to play an invalid note
      }
      
      let formattedNote = note;
      // Convert flat notation (if any) to sharp for Tone.js
      if (note.includes('b')) {
        // Map of flats to their enharmonic sharp equivalents
        const flatToSharp: Record<string, string> = {
          'Bb': 'A#', 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#'
        };
        
        // Extract note name without octave
        const noteName = note.substring(0, note.length - 1);
        const octave = note.substring(note.length - 1);
        
        // Replace with sharp equivalent if it exists
        if (flatToSharp[noteName]) {
          formattedNote = `${flatToSharp[noteName]}${octave}`;
          console.log(`Converted ${note} to ${formattedNote} for Tone.js compatibility`);
        }
      }
      
      // Extract octave number and validate it's in a reasonable range
      const octave = parseInt(formattedNote.slice(-1));
      if (isNaN(octave) || octave < 0 || octave > 8) {
        console.warn(`Octave out of reasonable range: ${octave} in note ${formattedNote}`);
        return; // Don't try to play notes with extreme octaves
      }
      
      console.log("Playing note:", formattedNote);
      const velocity = getNoteVelocity(formattedNote);
      
      // Try to play the note with better error handling
      try {
        synth.triggerAttackRelease(formattedNote, '8n', undefined, velocity);
      } catch (playError) {
        console.error(`Failed to play note ${formattedNote}:`, playError);
        return; // Exit early if note can't be played
      }
      
      // Only update UI if note playback was successful
      setActiveNotes(prev => [...prev, note]); // Keep original note name in activeNotes for UI highlighting
      
      setTimeout(() => {
        setActiveNotes(prev => prev.filter(n => n !== note));
      }, 300);
    } catch (error) {
      console.error("Error playing note:", note, error);
      // Don't update UI state if we hit an error
    }
  };

  // Make sure piano keyboard is updated when switching between chord and scale modes
  useEffect(() => {
    // When switching interfaces, clear active notes
    setActiveNotes([]);
    // Stop any playing chord
    if (synth && isPlaying) {
      synth.releaseAll();
      setIsPlaying(false);
    }
    // Clear chord timeout
    if (chordTimeoutRef.current !== null) {
      clearTimeout(chordTimeoutRef.current);
      chordTimeoutRef.current = null;
    }
  }, [showScalesInterface, synth, isPlaying]);

  // Fix keyboard movement by adding a fixed height to the container
  useEffect(() => {
    // Reset active notes when changing modes, chords, or scales
    return () => {
      setActiveNotes([]);
    };
  }, [selectedChord, selectedRootNote, selectedMode]);

  // Play a chord
  const playChord = (chordNotes: string[]) => {
    if (!synth || !isToneInitialized) {
      console.warn("Synth not initialized or Tone not ready");
      return;
    }
    
    try {
      console.log("Playing chord:", chordNotes);
      
      // Validate input
      if (!Array.isArray(chordNotes)) {
        console.error("Invalid chord notes format - expected array:", chordNotes);
        return;
      }
      
      // Stop any currently playing chord
      if (isPlaying) {
        // Cancel the cleanup timeout for the previous chord
        if (chordTimeoutRef.current !== null) {
          clearTimeout(chordTimeoutRef.current);
          chordTimeoutRef.current = null;
        }
        
        // Stop all currently playing notes
        synth.releaseAll();
        setIsPlaying(false);
      }
      
      setIsPlaying(true);
      
      // Clear any old active notes first
      setActiveNotes([]);
      // Then set the new active notes
      setActiveNotes(chordNotes);
      
      // Make sure we have valid notes before attempting to play
      if (chordNotes.length > 0) {
        // Play chord notes with a slight arpeggio effect
        const noteDelay = 0.05; // seconds between notes (using the faster timing from previous change)
        
        chordNotes.forEach((note, index) => {
          try {
            if (!note || typeof note !== 'string') {
              console.warn(`Skipping invalid note in chord:`, note);
              return;
            }
            
          const velocity = getNoteVelocity(note);
          // Stagger the start times slightly for a more pleasing effect
          const startTime = Tone.now() + (index * noteDelay);
          // All notes sustain to create chord sound
          synth.triggerAttackRelease(note, "2n", startTime, velocity);
          } catch (noteError) {
            console.error(`Error playing note ${note} in chord:`, noteError);
            // Continue with other notes even if one fails
          }
        });
      }
      
      // Store the timeout reference so it can be cancelled if needed
      chordTimeoutRef.current = window.setTimeout(() => {
        setActiveNotes([]);
        setIsPlaying(false);
        chordTimeoutRef.current = null;
      }, 1000); // Using the 1000ms timing from previous change
    } catch (error) {
      console.error("Error playing chord:", error);
      setIsPlaying(false);
      setActiveNotes([]); // Make sure to clear active notes on error
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
    
    // Stop any currently playing chord
    if (isPlaying) {
      // Cancel the cleanup timeout for the previous chord
      if (chordTimeoutRef.current !== null) {
        clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = null;
      }
      
      // Stop all currently playing notes
      synth.releaseAll();
      setIsPlaying(false);
    }

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
          // For 16th notes, divide by 4 (faster playback)
          const noteDelay = (60000 / playbackTempo) / 4;
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

  // Timeline Sequencer Functions
  const generateUniqueId = (): string => {
    return Math.random().toString(36).substring(2, 9);
  };

  const addCurrentSelectionToTimeline = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= timelineItems.length) {
      console.error("Invalid slot index:", slotIndex);
      return;
    }

    let newItem: SequenceItem;

    if (showScalesInterface && selectedRootNote && selectedMode) {
      // Create a scale item
      newItem = {
        id: generateUniqueId(),
        type: 'scale',
        rootNote: selectedRootNote,
        mode: selectedMode,
        playbackPattern: playbackPattern,
        tempo: playbackTempo,
      };
    } else if (!showScalesInterface && selectedChord) {
      // Create a chord item
      newItem = {
        id: generateUniqueId(),
        type: 'chord',
        chord: selectedChord,
        playbackPattern: 'ascending', // Default for chords
        tempo: playbackTempo,
      };
    } else {
      console.warn("Cannot add to timeline: No valid selection");
      return;
    }

    const newTimelineItems = [...timelineItems];
    newTimelineItems[slotIndex] = newItem;
    setTimelineItems(newTimelineItems);
  };

  const removeItemFromTimeline = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= timelineItems.length) {
      console.error("Invalid slot index:", slotIndex);
      return;
    }
    
    // Can't remove items during playback
    if (isTimelineSequencePlaying) {
      return;
    }

    const newTimelineItems = [...timelineItems];
    newTimelineItems[slotIndex] = null;
    setTimelineItems(newTimelineItems);
  };

  const clearAllTimelineItems = () => {
    // Can't clear items during playback
    if (isTimelineSequencePlaying) {
      return;
    }
    
    setTimelineItems([null, null, null, null]);
  };

  const getNotesForSequenceItem = (item: SequenceItem): string[] => {
    try {
      if (item.type === 'scale' && item.rootNote && item.mode) {
        // For scales, generate the notes based on rootNote and mode
        const scaleNotes = getScaleNotes(item.rootNote, startingOctave, item.mode);
        
        // Apply the playback pattern
        let notesToPlay: string[] = [];
        switch (item.playbackPattern) {
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
          default:
            console.warn(`Unknown playback pattern: ${item.playbackPattern}, defaulting to ascending`);
            notesToPlay = [...scaleNotes];
        }
        
        return notesToPlay.filter(note => note && typeof note === 'string');
      } else if (item.type === 'chord' && item.chord) {
        // For chords, just return the chord notes after validation
        return item.chord.notes.filter(note => note && typeof note === 'string');
      }
      
      console.warn("Invalid sequence item format:", item);
      return [];
    } catch (error) {
      console.error("Error getting notes for sequence item:", error);
      return [];
    }
  };

  const playTimelineItem = (item: SequenceItem): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (!synth || !isToneInitialized) {
          console.warn("Cannot play timeline item: Synth not initialized or Tone not ready");
          resolve();
          return;
        }
        
        const notes = getNotesForSequenceItem(item);
        if (notes.length === 0) {
          console.warn("No valid notes to play for timeline item:", item);
          resolve();
          return;
        }
        
        // Set tempo for this item (use item-specific tempo if available)
        const itemTempo = item.tempo || playbackTempo;
        Tone.Transport.bpm.value = itemTempo;
        
        if (item.type === 'chord') {
          // Play chord with slight arpeggio
          const noteDelay = 0.05; // Reduced from 0.1 to 0.05 seconds between notes for faster chord arpeggio
          
          notes.forEach((note, index) => {
            try {
              const velocity = getNoteVelocity(note);
              const startTime = Tone.now() + (index * noteDelay);
              synth.triggerAttackRelease(note, "2n", startTime, velocity);
            } catch (noteError) {
              console.error(`Error playing note ${note} in timeline chord:`, noteError);
            }
          });
          
          // Update UI to show active notes
          setActiveNotes(notes);
          
          // Resolve after chord finishes - shorter wait time for better flow
          setTimeout(() => {
            setActiveNotes([]);
            resolve();
          }, 1000); // Reduced from 1500ms to 1000ms for better flow between items
        } else {
          // Play scale sequentially
          let noteIndex = 0;
          const playNextNote = () => {
            if (noteIndex < notes.length) {
              try {
                const note = notes[noteIndex];
                // Highlight the current note
                setActiveNotes([note]);
                // Play the note
                const velocity = getNoteVelocity(note);
                synth.triggerAttackRelease(note, "8n", undefined, velocity);
                
                // Schedule the next note
                noteIndex++;
                // Calculate next note delay based on tempo - use 16th notes for more fluid playback
                const noteDelay = (60000 / itemTempo) / 4; // Changed from division by 2 (8th notes) to 4 (16th notes)
                setTimeout(playNextNote, noteDelay);
              } catch (noteError) {
                console.error(`Error playing note in timeline scale:`, noteError);
                // Skip to next note
                noteIndex++;
                setTimeout(playNextNote, 50); // Reduced from 100ms to 50ms for error recovery
              }
            } else {
              // Done playing this item
              setActiveNotes([]);
              resolve();
            }
          };
          
          // Start playing the sequence
          playNextNote();
        }
      } catch (error) {
        console.error("Error in playTimelineItem:", error);
        setActiveNotes([]);
        resolve();
      }
    });
  };

  const playEntireTimeline = async () => {
    // Don't start if already playing
    if (isTimelineSequencePlaying) {
      return;
    }
    
    // Filter out empty slots
    const validItems = timelineItems.filter(item => item !== null) as SequenceItem[];
    
    if (validItems.length === 0) {
      console.warn("No valid items in timeline to play");
      return;
    }
    
    try {
      setIsTimelineSequencePlaying(true);
      
      // Play each item in sequence
      for (let i = 0; i < validItems.length; i++) {
        // Update the current item index for UI feedback
        setCurrentTimelineIndex(timelineItems.findIndex(item => item?.id === validItems[i].id));
        
        // Play the current item and wait for it to complete
        await playTimelineItem(validItems[i]);
      }
    } catch (error) {
      console.error("Error playing timeline:", error);
    } finally {
      setIsTimelineSequencePlaying(false);
      setCurrentTimelineIndex(null);
      setActiveNotes([]);
    }
  };

  const stopTimelinePlayback = () => {
    if (!isTimelineSequencePlaying) {
      return;
    }
    
    // Clear any timeout
    if (timelineSequenceRef.current) {
      clearTimeout(timelineSequenceRef.current);
      timelineSequenceRef.current = null;
    }
    
    setIsTimelineSequencePlaying(false);
    setCurrentTimelineIndex(null);
    setActiveNotes([]);
  };

  // Helper function to find the next empty slot in the timeline
  const findNextEmptySlot = (): number => {
    const emptySlotIndex = timelineItems.findIndex(item => item === null);
    return emptySlotIndex >= 0 ? emptySlotIndex : -1; // Return -1 if no empty slot found
  };

  // Helper function to add current selection to the next available slot
  const addToNextEmptySlot = () => {
    const nextEmptySlot = findNextEmptySlot();
    if (nextEmptySlot !== -1) {
      addCurrentSelectionToTimeline(nextEmptySlot);
    } else {
      // Optional: Could display a message to the user that all slots are full
      console.warn("No empty slots available in timeline");
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 ${isLandscape ? 'py-2 px-4' : 'py-8 px-4'}`}>
      <div className={`mx-auto bg-white rounded-lg shadow-lg ${isLandscape ? 'p-5 max-w-full w-[98%]' : 'p-6 max-w-5xl'}`}>
        <h1 className={`${isLandscape ? 'text-2xl mb-4' : 'text-3xl mb-6'} font-bold text-center text-indigo-700`}>Piano Chord & Scale Teacher</h1>

        {/* Feature toggle buttons */}
        <div className={`${isLandscape ? 'mb-4' : 'mb-6'} flex justify-center space-x-4`}>
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

        {/* Responsive layout container - will change direction based on aspect ratio */}
        <div className={`${isLandscape ? 'grid grid-cols-2 gap-10' : 'flex flex-col gap-6'}`}>
          {/* Top section - Chord/Scale selection interface */}
          <div className={`w-full ${isLandscape ? 'pr-2 relative' : ''}`}>
            {/* Position the "Select a Chord to Learn" text outside the transformed container when in landscape mode */}
            {isLandscape && !showScalesInterface && (
              <h2 className="text-xl font-semibold mb-4 text-gray-800 absolute top-0 left-0">Select a Chord to Learn</h2>
            )}

            {/* Container that will be transformed in landscape mode */}
            <div className={`${isLandscape ? 'mt-14 transform translate-y-[5%]' : ''}`}>
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
                  
                  {/* Scale Information Display - always visible in scales mode */}
                  <div className="mb-8 p-4 bg-indigo-50 rounded-lg">
                    {selectedRootNote && selectedMode && currentScale.length > 0 ? (
                      <>
                        <h3 className="text-xl font-semibold text-indigo-700 mb-4">
                          {formatScaleName(selectedRootNote, selectedMode)}
                        </h3>
                        
                        <div className="flex items-center"> {/* Changed to items-center for vertical alignment */}
                          {/* Tempo Control Area - Moved to the left */}
                          <div className="flex-shrink-0 mr-8"> {/* Added mr-8 for spacing */}
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Tempo (BPM):</h3>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="60"
                                max="240"
                                step="10"
                                value={playbackTempo}
                                onChange={(e) => setPlaybackTempo(parseInt(e.target.value))}
                                className="w-36"
                              />
                              <span className="text-gray-700 w-10 text-sm">{playbackTempo}</span>
                            </div>
                          </div>

                          {/* Notes Display Area */}
                          <div className="flex-grow">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-gray-600">Notes:</span>
                              {currentScale.map((note) => {
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
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-indigo-700 mb-4">
                          Select a scale to learn
                        </h3>
                        
                        <div className="flex items-center">
                          {/* Tempo Control Area - Always visible */}
                          <div className="flex-shrink-0 mr-8">
                            <h3 className="text-lg font-medium mb-2 text-gray-700">Tempo (BPM):</h3>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="60"
                                max="240"
                                step="10"
                                value={playbackTempo}
                                onChange={(e) => setPlaybackTempo(parseInt(e.target.value))}
                                className="w-36"
                              />
                              <span className="text-gray-700 w-10 text-sm">{playbackTempo}</span>
                            </div>
                          </div>

                          {/* Placeholder for notes */}
                          <div className="flex-grow">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-gray-600">Notes:</span>
                              <span className="text-gray-500 italic">Complete the steps above to see scale notes</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Add to Timeline Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={addToNextEmptySlot}
                        disabled={isTimelineSequencePlaying || !(selectedRootNote && selectedMode && currentScale.length > 0)}
                        className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                          isTimelineSequencePlaying || !(selectedRootNote && selectedMode && currentScale.length > 0)
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Add to Timeline
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Chord Selection UI - only shown when not in scales mode */}
              {!showScalesInterface && (
                <div className="mb-8">
                  {/* Remove the heading from here in landscape mode since we've positioned it absolutely above */}
                  {!isLandscape && <h2 className="text-xl font-semibold mb-4 text-gray-800">Select a Chord to Learn</h2>}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {chords.map((chord) => (
                      <button
                        key={chord.name}
                        onClick={() => {
                          setSelectedChord(chord);
                          playChord(chord.notes); // Automatically play the chord when selected
                        }}
                        className={`rounded-md text-center transition-colors shadow ${selectedChord?.name === chord.name
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        } py-6 px-4`}
                      >
                        {chord.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Selected Chord Display - only shown when not in scales mode */}
              {!showScalesInterface && (
                <>
                  {/* Add extra vertical space */}
                  <div className="mb-6"></div> {/* Roughly 15% more spacing */}
                
                  <div className="mb-8 p-6 bg-indigo-50 rounded-lg"> {/* Increased padding from p-4 to p-6 for ~15% more height */}
                    {selectedChord ? (
                      <>
                        <h3 className="text-xl font-semibold text-indigo-700">{selectedChord.name}</h3>
                        <p className="text-gray-700 mb-4">{selectedChord.description}</p> {/* Increased from mb-3 to mb-4 */}
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
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-indigo-700">Select a chord above</h3>
                        <p className="text-gray-700 mb-4">Chord information will be displayed here</p>
                        <div className="flex gap-2">
                          <span className="text-gray-600">Notes:</span>
                          <span className="text-gray-500 italic">Select a chord to see its notes</span>
                        </div>
                      </>
                    )}
                        
                    {/* Add to Timeline Button for Chords */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={addToNextEmptySlot}
                        disabled={isTimelineSequencePlaying || !selectedChord}
                        className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                          isTimelineSequencePlaying || !selectedChord
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Add to Timeline
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom section - Interactive Piano, Timeline Sequencer, and Keyboard Controls */}
          <div className={`w-full ${isLandscape ? 'pl-2' : ''}`}>
            <div className="mb-4">
              <h2 className={`${isLandscape ? 'text-lg' : 'text-xl'} font-semibold mb-2 text-gray-800`}>Interactive Piano</h2>
              <p className={`text-gray-600 mb-4 ${isLandscape ? 'text-sm' : ''}`}>Click on keys or use your computer keyboard to play notes</p>
            </div>

            <div className={`relative ${isLandscape ? 'h-40' : 'h-64'} ${isLandscape ? 'mb-4' : 'mb-8'} overflow-hidden border border-gray-600 rounded-md bg-black shadow-lg`}>
              {/* Piano container with fixed dimensions to prevent layout shifts */}
              <div className="relative flex h-full w-full" style={{ minHeight: isLandscape ? "8rem" : "14rem" }}>
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
                        data-note={whiteNote.note}
                      >
                        <span className={`text-xs font-semibold ${isInChord ? 'text-indigo-700' : 'text-gray-600'}`}>
                          {whiteNote.note}
                        </span>
                      </button>
                    </div>
                  );
                })}
                
                {/* Now render all black keys as an overlay */}
                {notes.filter(note => note.isBlack).map(blackKey => {
                  const isActive = activeNotes.includes(blackKey.note);
                  const isInChord = isNoteInSelectedChord(blackKey.note);
                  const octave = parseInt(blackKey.note.slice(-1));
                  const noteLetter = blackKey.note.charAt(0);
                  
                  // Find the corresponding white key for positioning
                  const whiteKeys = notes.filter(note => !note.isBlack);
                  const precedingWhiteKey = whiteKeys.find(
                    note => note.note.charAt(0) === noteLetter && note.note.includes(octave.toString())
                  );
                  
                  if (!precedingWhiteKey) {
                    console.warn(`Could not find preceding white key for ${blackKey.note}`);
                    return null;
                  }
                  
                  // Calculate position
                  const whiteKeyIndex = whiteKeys.indexOf(precedingWhiteKey);
                  const totalWhiteKeys = whiteKeys.length;
                  const position = (whiteKeyIndex / totalWhiteKeys) * 100 + 0.65 * (100 / totalWhiteKeys);
                  
                  return (
                    <button
                      key={blackKey.note}
                      onClick={() => playNote(blackKey.note)}
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
                      data-note={blackKey.note}
                    >
                      <span className="text-xs font-semibold text-white absolute bottom-2 left-0 right-0 text-center">
                        {blackKey.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timeline Sequencer */}
            <TimelineSequencer
              timelineItems={timelineItems}
              isTimelineSequencePlaying={isTimelineSequencePlaying}
              currentTimelineIndex={currentTimelineIndex}
              playEntireTimeline={playEntireTimeline}
              stopTimelinePlayback={stopTimelinePlayback}
              clearAllTimelineItems={clearAllTimelineItems}
              removeItemFromTimeline={removeItemFromTimeline}
              addCurrentSelectionToTimeline={addCurrentSelectionToTimeline}
              showScalesInterface={showScalesInterface}
              selectedRootNote={selectedRootNote}
              selectedMode={selectedMode}
              selectedChord={selectedChord}
              playbackTempo={playbackTempo}
              isLandscape={isLandscape}
            />

            <KeyboardControls isLandscape={isLandscape} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoChordTeacher;
