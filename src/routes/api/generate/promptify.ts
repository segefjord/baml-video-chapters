import Groq from 'groq-sdk'
import dedent from 'dedent'

export function promptifySegments(segments: Groq.Audio.TranscriptionSegment[]): string {
  if (segments.length < 1) ""
  const first = segments[0]
  const last = segments[segments.length-1]
  return dedent(`
    Video-part duration: ${Math.round(last.end - first.start)} seconds
    From @T=${first.id} to @T=${last.id}:
    \`\`\`
    ...
    ${segments.map(x=>`@T=${x.id} "${x.text.trim()}"`).join('\n')}
    ...
    \`\`\`
    `).trim()
}