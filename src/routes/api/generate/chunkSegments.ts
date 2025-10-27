import Groq from 'groq-sdk'

export default function chunkSegments(
  segments: Groq.Audio.TranscriptionSegment[],
  N=200, overlap=50
): (Groq.Audio.TranscriptionSegment[])[] {
  const segmentChunks = []
  for (let i=0; i<segments.length-N; i+=N) {
    segmentChunks.push(
      segments.slice(i, i+N+overlap)
    )
  }
  const left = (segments.length % N)-overlap
  const lastChunk = segmentChunks.length-1
  segmentChunks[lastChunk] = segmentChunks[lastChunk].concat(
    segments.slice(segments.length-left, segments.length)
  )
  return segmentChunks
}
