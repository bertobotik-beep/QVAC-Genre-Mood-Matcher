# QVAC Genre Mood Matcher

Describe your current mood and an on-device AI recommends a movie/book GENRE — never specific titles — plus a one-line reason why that genre fits. No cloud call, no API key.

## How it works

1. You type a mood description (e.g. `I've had a long stressful week and just want to switch my brain off`) into the input field and submit.
2. The server asks the on-device model to reply on one line in the format `Genre: <genre> | Reason: <sentence>`, restricted to a fixed closed list of genres (Comedy, Romance, Mystery, Thriller, Horror, Fantasy, Science Fiction, Drama, Adventure, Cozy Mystery, Slice of Life, Documentary) — the model is never allowed to name a specific movie, show, or book.
3. `logic.js` parses that line and validates the genre against the fixed list, checks the reason doesn't look like it smuggled in a title (`looksLikeTitle`), and confirms the reason actually engages with your mood.
4. If parsing fails, the genre isn't in the list, the reason is too long, looks like a title, or is off-topic, the app falls back to a deterministic keyword-based genre match (`fallbackGenre`) instead — so a real or fake title can never reach the UI.

### Example

- Input: `I've had a long stressful week and just want to switch my brain off`
- Typical output: Genre `Comedy`, Reason: `"A light, funny genre is perfect for switching off after a stressful week."`

### QVAC functions used

- `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })` — loads the model on-device at startup (`src/gui.js`).
- `completion({ modelId, history, stream: true, completionOpts })` — generates the genre/reason line, streamed via `run.tokenStream` (`src/logic.js`).
- `unloadModel({ modelId })` — releases the model when the server shuts down (`src/gui.js`).

## Run

```bash
npm install
npm start
```

Then open http://localhost:31026

The port can be overridden with the `PORT` environment variable.

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## License

MIT
