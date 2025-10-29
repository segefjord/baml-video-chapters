// import { FFmpeg, type FileData } from '@ffmpeg/ffmpeg'
// import { fetchFile, toBlobURL } from '@ffmpewg/util'

import { type FileData } from '@ffmpeg/ffmpeg'
// @ts-ignore
const { FFmpeg } = await import('/@ffmpeg/ffmpeg');
// @ts-ignore
const { fetchFile, toBlobURL } = await import('/@ffmpeg/util');

import mime from 'mime'

export interface AudioData {
  blob: Blob
  file: File
}

export interface AudioChunk {
  audio: AudioData
  start: number
  end: number
}

export interface ProcessVideoResult {
  preview: AudioData
  chunks: AudioChunk[]
  metadata: {
    duration: number
  }
}


function returnAudio(data: FileData, container: string): AudioData {
  const mime_type: BlobPropertyBag = { type: mime.getType(container) ?? undefined }
  const blob = new Blob([data as BlobPart], mime_type)
  const file = new File([blob], `audio.${container}`, mime_type)

  let mbSize = ((data.length) / 1024) / 1024
  console.log(`Audio chunk: ${(mbSize).toFixed(2)} MB`, 'URL ->\n', URL.createObjectURL(blob))

  return {
    blob, file
  }
}


// const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm'
const baseURL = '/ffmpeg'

export async function processVideo(videoURL: string): Promise<ProcessVideoResult> {
  const ffmpeg = new FFmpeg()

  let logging = false
  let duration: any = null
  let audioCodec: any = null
  ffmpeg.on('log', ({ message }: {message: string}) => {
    if(logging) console.log(message)
    if (!duration && message.includes('Duration')) duration = message
    if (!audioCodec && message.includes('Audio')) audioCodec = message
  })

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.min.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
  })
  await ffmpeg.writeFile('video', await fetchFile(videoURL))
  await ffmpeg.exec([
    '-i', 'video',
  ])
  let [hours, minutes, seconds] = duration.split(',')[0].split('Duration')[1].split(':').filter(Boolean).map((x: string) => parseFloat(x.trim()))
  duration = (hours*60*60) + (minutes*60) + seconds/60 // seconds duration
  
  audioCodec = audioCodec?.split('Audio: ')[1].split(' ')[0]
  if(!audioCodec?.split) throw new Error("No audio found")
  let container = ({
    aac: 'm4a',
    mp4a: 'm4a',
    alac: 'm4a',
    mp3: 'mp3',
    pcm_s16le: 'wav',
    pcm_s24le: 'wav',
    flac: 'flac',
    opus: 'opus',
    vorbis: 'ogg',
    ac3: 'ac3',
    eac3: 'ac3',
  } as Record<string, string>)[audioCodec as string]


  await ffmpeg.exec([
    '-i', 'video', // input
    '-vn', // strip video
    '-c', 'copy',
    `output.${container}`
  ])

  // console.log(container, mime.getType(container))

  let data = await ffmpeg.readFile(`output.${container}`)
  const fullAudio = returnAudio(data, container)
  
  let mbSize = ((data.length) / 1024) / 1024

  const SIZE_LIMIT = 25 // MB

  if (mbSize < SIZE_LIMIT) {
    return {
      preview: fullAudio,
      chunks: [
        {
          audio: fullAudio,
          start: 0,
          end: duration
        }
      ],
      metadata: {
        duration
      }
    }
  }
  else {
    // logging = true

    const numChunks = Math.ceil(mbSize / (SIZE_LIMIT -1 )) // - 1 MB bias to ensure all chunks are small enough
    const chunkSeconds = Math.round(duration/numChunks)+60

    await ffmpeg.exec([
      '-i', 'video', // input
      '-vn', // strip video
      '-c', 'copy',
      '-f', 'segment', // use the segment muxer
      '-segment_time', `${chunkSeconds}`,
      `part%03d.${container}` // part000.mp4, part001.mp4, part002.mp4 ...
    ])


    const chunks = []
    for (let i=0; i<=(numChunks-1); i++) {
      data = await ffmpeg.readFile(`part${String(i).padStart(3, '0')}.${container}`)
      const start = i*chunkSeconds
      const end   = (i+1)*chunkSeconds
      chunks.push({
        audio: returnAudio(data, container),
        start: start,
        end: end <= duration ? end : duration
      })
    }
    return {
      preview: fullAudio,
      chunks: chunks,
      metadata: {
        duration
      }
    }
  }
}
