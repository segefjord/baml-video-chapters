import type { AudioChunk } from '$lib/ffmpeg'
import Groq from 'groq-sdk'

export default function (
  whisperResults: Groq.Audio.Transcription[],
  audioChunks: AudioChunk[]
): Groq.Audio.TranscriptionMerged {

  const mergedWhisperResults: Groq.Audio.TranscriptionMerged = {
    ...whisperResults[0],
    x_groq: [whisperResults[0].x_groq]
  }

  for (let i=1; i<whisperResults.length; i++) {
    const chunk = audioChunks[i]
    const result = whisperResults[i]
    const previous = whisperResults[i-1]
    const lastId = previous.segments[previous.segments.length-1].id

    mergedWhisperResults.x_groq.push(result.x_groq)
    mergedWhisperResults.duration += result.duration
    mergedWhisperResults.text += result.text

    for(const segment of result.segments) {
      segment.id += lastId+1
      segment.start += chunk.start
      segment.end += chunk.start
      mergedWhisperResults.segments.push(segment)
    }
  }

  return mergedWhisperResults
  
}