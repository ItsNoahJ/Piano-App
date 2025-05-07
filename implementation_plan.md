# Piano Chord & Scale Teacher - Implementation Plan

## Phase 1: Audio Enhancements & Bug Fixes

### 1.1. Uniform Note Volume
- **Objective:** Ensure all piano notes play at a consistent perceived volume across different octaves.
- **Tasks:**
    1.  **Global Synth Volume:** Set a global volume for the `Tone.PolySynth` instance in `PianoChordTeacher.tsx`.
        - Investigate `synth.volume.value` or similar properties.
    2.  **Consistent Note Velocity:** Ensure `triggerAttackRelease` is called with a consistent velocity parameter for individual notes and chords/scales.
        - The `velocity` parameter in `triggerAttackRelease(notes, duration, time, velocity)` can be a value between 0 and 1. We'll experiment to find a good default.
    3.  **Test:** Play notes across all available octaves (currently 2, 3, and 4) to confirm more uniform loudness.

## Phase 2: Major Feature Expansion - Scales & Modes

### 2.1. Core Music Theory Engine
- **Objective:** Develop the backend logic to define and generate scales and modes.
- **Tasks:**
    1.  **Define Root Notes:**
        - Create an array or object storing all 12 chromatic root notes:
          `['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']`
        - Consider alternate names (e.g., D♭ for C♯) for display if needed later, but for logic, a single representation is simpler.
    2.  **Define Scale/Mode Interval Patterns:**
        - Create a data structure (e.g., an object) mapping mode names to their semitone interval patterns from the root.
        - Example:
          ```javascript
          const scaleIntervals = {
            'Major':     [0, 2, 4, 5, 7, 9, 11], // W-W-H-W-W-W-H
            'Minor':     [0, 2, 3, 5, 7, 8, 10], // W-H-W-W-H-W-W (Natural Minor)
            'Dorian':    [0, 2, 3, 5, 7, 9, 10], // W-H-W-W-W-H-W
            'Phrygian':  [0, 1, 3, 5, 7, 8, 10], // H-W-W-W-H-W-W
            'Lydian':    [0, 2, 4, 6, 7, 9, 11], // W-W-W-H-W-W-H
            'Mixolydian':[0, 2, 4, 5, 7, 9, 10], // W-W-H-W-W-H-W
            'Locrian':   [0, 1, 3, 5, 6, 8, 10], // H-W-W-H-W-W-W
            // Potentially add Harmonic Minor, Melodic Minor, etc. later if desired
          };
          ```
    3.  **Implement Scale Note Generation Logic:**
        - Create a function `getScaleNotes(rootNoteName, octave, modeName)`:
            - Takes a root note name (e.g., "A♭"), an octave number, and a mode name (e.g., "Lydian").
            - Finds the starting MIDI note number for the `rootNoteName` in the specified `octave`.
            - Uses the interval pattern for the `modeName` to calculate the MIDI numbers of all notes in the scale.
            - Converts these MIDI numbers back to note names with octaves (e.g., "A♭4", "B♭4", "C5", ...).
            - Returns an array of these note name strings.

### 2.2. UI/UX Redesign for Scale Selection
- **Objective:** Create an intuitive and non-cluttered UI for selecting root notes and scale types.
- **Tasks:**
    1.  **Component Structure:**
        - Create new React components for selectors if necessary.
    2.  **Root Note Selector:**
        - Implement a dropdown (`<select>`) or a series of styled buttons.
        - Populated with the 12 root notes.
        - State: `selectedRootNote`.
    3.  **Mode/Scale Selector:**
        - Implement a dropdown (`<select>`) or a series of styled buttons.
        - Populated with the available mode names (Major, Minor, Dorian, etc.).
        - State: `selectedMode`.
        - This might be dynamically populated or enabled only after a root note is selected.
    4.  **Information Display Area:**
        - Clearly display the full name of the selected scale (e.g., "A♭ Lydian").
        - List the notes of the selected scale (e.g., "A♭4, B♭4, C5, D5, E♭5, F5, G5").
    5.  **Remove Old Chord Selection Grid:**
        - The current grid of chord buttons will be replaced by this new system.
        - Existing `Chord` type and `chords` array might be deprecated or repurposed if we decide to keep specific chord examples separate from the full scale generation. For now, assume it's replaced for scale learning.

### 2.3. Piano Interaction & Visualization
- **Objective:** Update the interactive piano to highlight and play the selected scales.
- **Tasks:**
    1.  **Highlighting Scale Notes:**
        - Modify `isNoteInSelectedChord` (or rename to `isNoteInSelectedScale`) to check if a piano key's note is part of the currently generated scale notes.
        - Update CSS classes for highlighting these notes on the virtual piano.
    2.  **"Play Scale" Functionality:**
        - Implement a `playScale(scaleNotes: string[])` function.
        - This function will use `synth.triggerAttackRelease()`.
        - **Decision Point (from user):**
            - Option A: Play all notes simultaneously (like a large chord).
            - Option B: Play notes sequentially (arpeggiated or as a scale run). For sequential, `Tone.Transport` or a sequence of `setTimeout` calls with `triggerAttackRelease` for individual notes might be needed. For MVP, simultaneous is simpler.
        - The "Play Scale" button in the UI will trigger this function.
    3.  **Keyboard Input:**
        - The existing keyboard input for playing individual notes should remain functional.

### 2.4. State Management
- **Objective:** Manage the new state variables required for the expanded functionality.
- **Tasks:**
    1.  **New State Variables in `PianoChordTeacher.tsx`:**
        - `selectedRootNote: string | null`
        - `selectedMode: string | null`
        - `currentScaleNotes: string[]` (derived from selectedRootNote, selectedMode, and current octave for piano display)
    2.  **Update `useEffect` Hooks:**
        - Hooks will be needed to re-calculate `currentScaleNotes` when `selectedRootNote` or `selectedMode` (or a potential octave selector for the scale) changes.

## Phase 3: Refinements & Future Considerations (Post-MVP)

### 3.1. Octave Selection for Scales
- Allow the user to select the starting octave for the displayed/played scale.

### 3.2. Displaying Chord Voicings within Scales
- After selecting a scale, offer common chords that can be built from that scale.

### 3.3. More Advanced Music Theory Concepts
- Introduce concepts like inversions, arpeggios, etc.

### 3.4. Visual Polish
- Further refine CSS and overall visual appeal.

### 3.5. Persistence
- Save user's last selected root/mode via `localStorage`.

---

This plan provides a structured approach to achieving the desired enhancements. Each phase and task can be broken down further as development progresses. 