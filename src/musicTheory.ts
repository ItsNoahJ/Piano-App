/**
 * Music Theory Engine
 * Handles generation of scales, modes, and related music theory concepts
 */

// Define all 12 root notes in the chromatic scale
export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// For display, we might want to show flat names as well
export const NOTE_ENHARMONICS: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb'
};

// Define scale intervals for each mode/scale type
export const SCALE_INTERVALS: Record<string, number[]> = {
  'Major':      [0, 2, 4, 5, 7, 9, 11], // W-W-H-W-W-W-H
  'Minor':      [0, 2, 3, 5, 7, 8, 10], // W-H-W-W-H-W-W (Natural Minor)
  'Dorian':     [0, 2, 3, 5, 7, 9, 10], // W-H-W-W-W-H-W
  'Phrygian':   [0, 1, 3, 5, 7, 8, 10], // H-W-W-W-H-W-W
  'Lydian':     [0, 2, 4, 6, 7, 9, 11], // W-W-W-H-W-W-H
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10], // W-W-H-W-W-H-W
  'Locrian':    [0, 1, 3, 5, 6, 8, 10], // H-W-W-H-W-W-W
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11], // W-H-W-W-H-WH-H
  'Melodic Minor':  [0, 2, 3, 5, 7, 9, 11], // W-H-W-W-W-W-H
  'Major Pentatonic': [0, 2, 4, 7, 9], // W-W-W♯-W
  'Minor Pentatonic': [0, 3, 5, 7, 10], // W♯-W-W-W♯
  'Blues': [0, 3, 5, 6, 7, 10] // W♯-W-H-H-W♯
};

/**
 * Gets the index of a note in the chromatic scale
 */
const getNoteIndex = (noteName: string): number => {
  // Extract just the note name without the octave
  const note = noteName.replace(/\d+$/, '');
  return ROOT_NOTES.indexOf(note);
};

/**
 * Generates all notes in a scale based on root note, octave, and mode
 */
export const getScaleNotes = (rootNote: string, octave: number, mode: string): string[] => {
  if (!rootNote || !mode || !SCALE_INTERVALS[mode]) {
    console.error(`Invalid scale parameters: ${rootNote} ${octave} ${mode}`);
    return [];
  }
  
  // Find the index of the root note
  const rootIndex = getNoteIndex(rootNote);
  if (rootIndex === -1) {
    console.error(`Invalid root note: ${rootNote}`);
    return [];
  }
  
  // Get the interval pattern for the selected mode
  const intervals = SCALE_INTERVALS[mode];
  
  // Generate the scale notes
  const scaleNotes: string[] = [];
  for (const interval of intervals) {
    // Calculate the note index with wrapping
    const noteIndex = (rootIndex + interval) % 12;
    const note = ROOT_NOTES[noteIndex];
    
    // Calculate octave shift if we wrap around
    const octaveShift = Math.floor((rootIndex + interval) / 12);
    const noteOctave = octave + octaveShift;
    
    scaleNotes.push(`${note}${noteOctave}`);
  }
  
  return scaleNotes;
};

/**
 * Gets all available modes/scale types
 */
export const getAvailableModes = (): string[] => {
  return Object.keys(SCALE_INTERVALS);
};

/**
 * Gets the display name for a note (with potential enharmonic spelling)
 */
export const getNoteDisplayName = (note: string, preferFlats = false): string => {
  // Extract just the note name without the octave
  const noteName = note.replace(/\d+$/, '');
  const octave = note.match(/\d+$/)?.[0] || '';
  
  if (preferFlats && NOTE_ENHARMONICS[noteName]) {
    return `${NOTE_ENHARMONICS[noteName]}${octave}`;
  }
  
  return note;
};

/**
 * Formats a scale name for display
 */
export const formatScaleName = (rootNote: string, mode: string): string => {
  // Handle enharmonic spellings if needed
  const displayRoot = rootNote.replace(/\d+$/, '');
  return `${displayRoot} ${mode}`;
}; 