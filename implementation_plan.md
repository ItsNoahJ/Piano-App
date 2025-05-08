# Piano Chord & Scale Teacher - Implementation Plan

## ✅ Phase 1: Audio Enhancements & Bug Fixes

### ✅ 1.1. Uniform Note Volume
- **Objective:** Ensure all piano notes play at a consistent perceived volume across different octaves.
- **Tasks:**
    1. ✅ **Global Synth Volume:** Set a global volume for the `Tone.PolySynth` instance in `PianoChordTeacher.tsx`.
        - Implemented with `synth.volume.value = 0;` to set nominal volume.
    2. ✅ **Consistent Note Velocity:** Ensure `triggerAttackRelease` is called with a consistent velocity parameter for individual notes and chords/scales.
        - Implemented `getNoteVelocity()` function that compensates based on octave:
          - Lower octaves get higher velocity (up to 1.4× for octave 2)
          - Higher octaves get lower velocity (down to 0.6× for octave 5)
    3. ✅ **Test:** Play notes across all available octaves (currently 2, 3, and 4) to confirm more uniform loudness.
        - Confirmed more consistent volume across the keyboard.

## ✅ Phase 2: Major Feature Expansion - Scales & Modes

### ✅ 2.1. Core Music Theory Engine
- **Objective:** Develop the backend logic to define and generate scales and modes.
- **Tasks:**
    1. ✅ **Define Root Notes:**
        - Created array storing all 12 chromatic root notes in `musicTheory.ts`
        - Added support for enharmonic spellings (flats vs sharps)
    2. ✅ **Define Scale/Mode Interval Patterns:**
        - Implemented `SCALE_INTERVALS` object with patterns for major, minor, and all modes
        - Added additional scale types (harmonic minor, melodic minor, pentatonics, blues)
    3. ✅ **Implement Scale Note Generation Logic:**
        - Created `getScaleNotes(rootNoteName, octave, modeName)` function
        - Function properly generates all notes in a scale with correct octave handling

### ✅ 2.2. UI/UX Redesign for Scale Selection
- **Objective:** Create an intuitive and non-cluttered UI for selecting root notes and scale types.
- **Tasks:**
    1. ✅ **Component Structure:**
        - Integrated scale UI into existing `PianoChordTeacher` component
    2. ✅ **Root Note Selector:**
        - Implemented buttons grid for all 12 root notes
        - Added state management with `selectedRootNote`
    3. ✅ **Mode/Scale Selector:**
        - Implemented buttons grid for all available scales/modes
        - Added state management with `selectedMode`
    4. ✅ **Information Display Area:**
        - Added formatted display of selected scale name and notes
        - Implemented highlighting of scale notes during playback
    5. ✅ **Feature Toggle:**
        - Added buttons to toggle between chord and scale learning interfaces

### ✅ 2.3. Piano Interaction & Visualization
- **Objective:** Update the interactive piano to highlight and play the selected scales.
- **Tasks:**
    1. ✅ **Highlighting Scale Notes:**
        - Modified `isNoteInSelectedScale` to check if a note is part of the current scale
        - Updated styling to highlight scale notes on the piano
    2. ✅ **"Play Scale" Functionality:**
        - Implemented `playScale(scaleNotes: string[])` function with sequential note playback
        - Added proper timing using `Tone.Transport` and `Tone.Sequence`
        - Added progress visualization for currently playing note
    3. ✅ **Enhanced Playback Options:**
        - Added support for different playback patterns:
          - Ascending
          - Descending
          - Both (up and down)
        - Implemented tempo control slider (60-240 BPM)
    4. ✅ **Keyboard Input:**
        - Maintained existing keyboard input functionality
        - Added protection against input conflicts with form fields

### ✅ 2.4. State Management
- **Objective:** Manage the new state variables required for the expanded functionality.
- **Tasks:**
    1. ✅ **New State Variables in `PianoChordTeacher.tsx`:**
        - Added `selectedRootNote`, `selectedMode`, `currentScale`
        - Added `playbackPattern` and `playbackTempo` state
    2. ✅ **Update `useEffect` Hooks:**
        - Implemented hooks to re-calculate scale notes when inputs change
        - Added effects to handle audio initialization and cleanup

## ✅ Phase 3: Piano Keyboard Improvements

### ✅ 3.1. Keyboard Redesign
- **Objective:** Create a more realistic and visually appealing piano keyboard.
- **Tasks:**
    1. ✅ **Fixed Layout:** 
        - Redesigned keyboard with proper sizing and spacing
        - Made keyboard fully responsive with percentage-based widths
    2. ✅ **Black Key Positioning:**
        - Implemented correct black key placement based on music theory
        - Used helper function to render black keys with proper positioning
    3. ✅ **Improved Styling:**
        - Added shadows, proper borders, and 3D effects
        - Enhanced active state and chord/scale highlighting

### ✅ 3.2. Responsive Design
- **Objective:** Make the piano keyboard display correctly on different screen sizes.
- **Tasks:**
    1. ✅ **Relative Sizing:**
        - Used percentage-based positioning instead of fixed pixels
        - Made keyboard container properly sized with overflow handling

## ✅ Phase 4: Improved Audio Experience

### ✅ 4.1. Auto-Starting Audio
- **Objective:** Improve user experience by automatically initializing audio when possible.
- **Tasks:**
    1. ✅ **Auto Start:**
        - Removed explicit "Click to Start Audio" button
        - Implemented automatic startup with fallback to first interaction
    2. ✅ **Status Indication:**
        - Added unobtrusive status message for audio initialization

### ✅ 4.2. Enhanced Chord Playback
- **Objective:** Make chord playback more musical and pleasant.
- **Tasks:**
    1. ✅ **Slight Arpeggio:**
        - Modified chord playback to add a slight delay between notes
        - Created a more pleasant sound than simultaneous playback
    2. ✅ **Visual Feedback:**
        - Added progress indicators for chord playback

## Phase 5: Timeline Sequencer (In Progress)

### 5.1. Timeline UI Component
- **Objective:** Create a visual timeline interface for arranging scales and chords in sequence.
- **Tasks:**
    1. **Timeline Container:**
        - Implement horizontal container with 4 slots for arrangement
        - Design visual representation of empty vs. filled slots
        - Add slot labels and duration indicators
    2. **Item Assignment:**
        - Create mechanism to assign currently selected scale/chord to a timeline slot
        - Implement "Clear" functionality for individual slots
        - Add visual feedback when assigning items
    3. **Timeline Controls:**
        - Add master play/pause/stop buttons for the sequence
        - Implement global tempo control affecting all items
        - Add loop toggle option for continuous playback

### 5.2. Sequence Data Management
- **Objective:** Develop data structures and state management for the timeline feature.
- **Tasks:**
    1. **Data Model:**
        - Define `SequenceItem` type supporting both scales and chords
        - Implement `timelineItems` state array to store sequence
        - Create unique identifiers for timeline items
    2. **CRUD Operations:**
        - Implement functions to add, update, delete and reorder timeline items
        - Add persistence of timeline data using localStorage
        - Create reset/clear all functionality
    3. **Item Configuration:**
        - Support per-item playback pattern (ascending/descending/both)
        - Allow custom duration setting per timeline item
        - Support optional per-item tempo overrides

### 5.3. Playback Engine Enhancement
- **Objective:** Extend the audio engine to support sequential playback of timeline items.
- **Tasks:**
    1. **Sequential Scheduler:**
        - Implement Tone.js Transport scheduler for playing multiple items in sequence
        - Create timing calculation based on item duration and tempo
        - Add smooth transitions between sequence items
    2. **Playback Control:**
        - Implement play, pause, resume, and stop functionality
        - Add progress tracking during playback
        - Create event system for playback state changes
    3. **Performance Optimization:**
        - Pre-calculate and cache sequence timing for consistent playback
        - Implement efficient note scheduling to avoid audio glitches
        - Add buffer time between items for smoother transitions

### 5.4. Visual Feedback System
- **Objective:** Create visual feedback that synchronizes the timeline with piano keyboard.
- **Tasks:**
    1. **Position Indicator:**
        - Implement progress bar showing current playback position in timeline
        - Add visual indicator for currently active sequence item
        - Create smooth animation for progress tracking
    2. **Keyboard Synchronization:**
        - Connect timeline playback to piano keyboard highlighting
        - Ensure consistent visual feedback between timeline and piano
        - Add optional "follow along" visualization
    3. **Enhanced UI Feedback:**
        - Implement timeline item highlighting during playback
        - Add visual countdown before sequence starts
        - Create animations for transitions between items

## Phase 6: Future Enhancements (Pending)

### 6.1. Additional Scale Types
- **Objective:** Expand the available scale types for more comprehensive learning.
- **Tasks:**
    1. Add exotic scales (Whole Tone, Diminished, etc.)
    2. Include more ethnic/cultural scales (Japanese, Indian, etc.)

### 6.2. Enhanced Music Theory Features
- **Objective:** Provide more advanced music theory concepts.
- **Tasks:**
    1. Add chord progression suggestions based on selected scale
    2. Implement common cadence patterns
    3. Show scale degree functions and Roman numeral analysis

### 6.3. Learning Features
- **Objective:** Add features that help users learn music theory concepts.
- **Tasks:**
    1. Add interactive quizzes on scale recognition
    2. Implement ear training exercises
    3. Include chord progression exercises

### 6.4. Performance Improvements
- **Objective:** Optimize app performance and audio handling.
- **Tasks:**
    1. Improve Tone.js initialization and sample loading
    2. Add more realistic piano samples
    3. Optimize rendering for complex keyboard interactions

---

This updated plan reflects our completed tasks and outlines potential future enhancements to continue improving the Piano Chord & Scale Teacher app. 