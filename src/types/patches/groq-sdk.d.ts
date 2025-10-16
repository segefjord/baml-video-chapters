import Groq from 'groq-sdk'

interface TranscriptionBase {
  text: string
  language: string
  duration: number
  segments: TranscriptionSegment[]
}

declare module 'groq-sdk' {
  namespace Groq {
    interface Task {
      task: string
      x_groq: { id: string }
    }
    interface TaskMerged extends Task {
      x_groq: Groq.Task["x_groq"][]
    }
    namespace Audio {
      namespace Transcriptions {
        interface TranscriptionSegment {
          id: number
          start: number
          end: number
          seek: number
          text: string
          tokens: number[]
          temperature: number
          avg_logprob: number
          compression_ratio: number
          no_speech_prob: number
        }
        interface Transcription extends Groq.Task, TranscriptionBase {}
        interface TranscriptionMerged extends Groq.TaskMerged, TranscriptionBase {}
      }
      type Transcription = Transcriptions.Transcription
      type TranscriptionMerged = Transcriptions.TranscriptionMerged
      type TranscriptionSegment = Transcriptions.TranscriptionSegment
    }
  }
}
