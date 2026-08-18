# Orbit example

Orbit is the reference Subjective C application. Its source is an English product brief in `app.subjective`; the config supplies example data and a starting user context.

From the repository root:

```bash
npm run dev
```

Try these in the runtime inspector:

1. Use **SF lens** to jump between Muni Control, Sutro Fog Observatory, SFO Departures, Ferry Tide Table, Mission After Dark, Golden Gate Load Monitor, Exploratorium Field Lab, Ship Command, and BART Platform.
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
```
