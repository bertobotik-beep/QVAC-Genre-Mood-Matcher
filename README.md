# QVAC Genre Mood Matcher

Describe your current mood and an on-device AI recommends a movie/book GENRE — never specific titles — plus a one-line reason why that genre fits. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:31026

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown. The genre is always chosen from a fixed list server-side (never a free-form title), so no fake or real title can ever be hallucinated into the result.

## License

MIT
