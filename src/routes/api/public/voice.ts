import { createFileRoute } from "@tanstack/react-router";

// Connected demo endpoint. Passcode-gated (cost/abuse protection only). Audio is processed in memory and not stored.
export const Route = createFileRoute("/api/public/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkPasscode, extract, transcribe, validate, VoiceError, MAX_AUDIO_BYTES, MAX_SECONDS } = await import("@/lib/voice/voice.server");
        const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
        try {
          const len = Number(request.headers.get("content-length") ?? "0");
          if (len > MAX_AUDIO_BYTES + 20_000) return json(413, { error: "Recording is too large." });
          if (!(request.headers.get("content-type") ?? "").includes("multipart/form-data")) return json(400, { error: "Malformed request." });
          const form = await request.formData().catch(() => null);
          if (!form) return json(400, { error: "Malformed request." });
          const passcode = form.get("passcode");
          const audio = form.get("audio");
          const seconds = Number(form.get("seconds"));
          if (typeof passcode !== "string" || !passcode || passcode.length > 200) return json(400, { error: "Passcode required." });
          checkPasscode(passcode);
          if (!(audio instanceof Blob) || audio.size === 0) return json(400, { error: "No recording received." });
          if (audio.size > MAX_AUDIO_BYTES) return json(413, { error: "Recording is too large." });
          if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_SECONDS) return json(413, { error: "Recording must be 30 seconds or shorter." });
          const transcript = await transcribe(audio);
          if (!transcript) return json(422, { error: "No speech was recognised. Please try again or use the form." });
          const raw = await extract(transcript);
          const { draft, dropped } = validate(transcript, raw);
          return json(200, { transcript, draft, dropped });
        } catch (e) {
          if (e instanceof VoiceError) return json(e.status, { error: e.message });
          console.error("voice demo failed");
          return json(500, { error: "Voice processing failed." });
        }
      },
    },
  },
});
