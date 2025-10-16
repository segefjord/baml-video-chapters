export interface AudioData {
  blob: Blob
  file: File
}

export interface AudioChunk {
  audioData: AudioData
  start: number
  end: number
}

export interface ProcessVideoResult {
  preview: AudioData
  chunks: AudioChunk[]
}

/**
 * Extracts audio from a video URL and returns a preview and chunked audio
 * sized to approximately 25 MB segments.
 */
export function processVideo(videoURL: string): Promise<ProcessVideoResult>;
