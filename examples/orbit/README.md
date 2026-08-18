# Orbit example

Orbit is the reference Subjective C application. Its source is an English product brief in `app.subjective`; the config supplies example data and a starting user context.

From the repository root:

```bash
npm run dev
```

Try these in the runtime inspector:

1. Use **SF lens** to jump between Muni Control, Sutro Fog Observatory, SFO Departures, Ferry Tide Table, Mission After Dark, Golden Gate Load Monitor, Exploratorium Field Lab, Ship Command, BART Platform, Farallon Gravity Array, and Market Street Dream Fold.
2. Switch the user model between novice, returning, and expert.
3. Move novelty from 20% to 90%.
4. Rewrite the intent and press **Compile intent**.
5. Press **Reinterpret** or use the `R` shortcut.
6. Lock a seed, refresh, then unlock it.

Every lens is directly addressable for demos and screenshots:

```text
http://127.0.0.1:4173/?interpretation=mission-neon
http://127.0.0.1:4173/?interpretation=ship-command
http://127.0.0.1:4173/?interpretation=sutro-fog
http://127.0.0.1:4173/?interpretation=gravity-well
http://127.0.0.1:4173/?interpretation=dream-fold
```

Use `[` and `]` to travel backward and forward through the city without opening the inspector.

## Record the X demo

Install the browser once, then render the launch cut:

```bash
npm run browser:install
npm run demo:record
```

This produces a 1920×1080 source recording, an X-ready H.264 MP4 when `ffmpeg` is installed, and a PNG thumbnail in `artifacts/`. The GitHub Actions workflow **Render X demo video** produces the same downloadable assets without local setup.

Open the cinematic surface directly with `?cinema=1`. Choose **Enter reality**, then use the arrow rail, `[` and `]`, or **Autopilot** to travel through the experience. **Open the lab** returns to the complete inspector.

Add `&autoplay=1` to enter automatically and begin the director’s sequence. Its stable automation API is available at `window.SubjectiveC.setInterpretation(id)`, `window.SubjectiveC.setCinemaPhase(phase)`, and `window.SubjectiveC.toggleCinemaAutoplay()`.
