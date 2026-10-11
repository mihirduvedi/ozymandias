# Desert air

dhallcomposer, “Looping Gentle Wind Ambience on an Open Desert Plain.wav,”
July 24, 2023. The creator made this air texture by gently blowing past a
microphone, then adding reverb and stereo delay. It is a designed sound effect,
not a field recording of a real desert.

Source: https://freesound.org/people/dhallcomposer/sounds/697217/
License: CC0, https://creativecommons.org/publicdomain/zero/1.0/
Public high-quality preview: https://cdn.freesound.org/previews/697/697217_7678208-hq.mp3

The 41-second source is filtered to remove rumble and the low, resonant sound
of blowing into a microphone. Slow compression softens the gusts. Six passages
with small tempo variations are joined with twelve-second crossfades into a
roughly three-minute bed. A limiter caps peaks without automatic gain boosting.

Reproduce the asset with:

    python3 scripts/prepare-quiet-air.py source.mp3 public/world/audio/quiet-desert-air.mp3

Web Audio mixes the asset at 0.35 gain, with a six-second opening fade and
long overlapping passages. The camera and visual wind do not boost its volume.
Sound starts only when selected and fades away when a reading is paused.

The earlier Atacama recording by Félix Blume is retained as an unused source
asset. It is not loaded by the app. Its source is Freesound 156414, under CC0:
https://freesound.org/people/felix.blume/sounds/156414/
