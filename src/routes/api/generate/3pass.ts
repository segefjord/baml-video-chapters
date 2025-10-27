import Groq from 'groq-sdk'
import dedent from 'dedent'

import { b } from "$lib/baml_client"
import { Collector } from "@boundaryml/baml"
import type { VideoChaptersResponse } from '$lib/baml_client/types'

import type { ProcessVideoResult } from "$lib/ffmpeg"

import mergeWhisperResults from "./mergeWhisperResults"
import chunkSegments from "./chunkSegments"
import { promptifySegments } from "./promptify"
import { secondsToTimestamp } from "./formatSeconds"

import type { Chapter } from './types'

export default async function (
  chapterRate: number,
  whisperChunks: Groq.Audio.Transcription[],
  processedAudio: ProcessVideoResult,
  prompt: string,
  GROQ_API_KEY: string,
): Promise<Chapter[]> {
  const collector = new Collector("my-collector")
  const env = {
    BAML_LOG: "WARN",
    GROQ_API_KEY,
  }

  const mergedWhisperResults = mergeWhisperResults(whisperChunks, processedAudio.chunks)

  const summaryParts = chunkSegments(mergedWhisperResults.segments)
  const summarizationPromises: Promise<VideoChaptersResponse>[] = []
  for (const segments of summaryParts) {
    const transcript = promptifySegments(segments)
    const context = dedent(`
      # About the video
      ${prompt}
    `).trim()
    const instructions = dedent(`
      # User query
      Suggest 3 chapters
    `).trim()
    summarizationPromises.push(b.FindChapters(
      context, instructions, transcript,
      { collector, env }
    ))
  }
  
  const summarizationChapters = await Promise.all(summarizationPromises)

  const videoParts = chunkSegments(mergedWhisperResults.segments, 600)
  const chunkedPromises: Promise<VideoChaptersResponse>[] = []
  const totalChapterTarget = (processedAudio.metadata.duration/60)/chapterRate
  const partChapterTarget = totalChapterTarget / videoParts.length
  const partChapterRange = {
    min: Math.floor(partChapterTarget*0.85),
    max: Math.ceil(partChapterTarget*1.5)
  }
  for(const segments of videoParts) {
    const transcript = promptifySegments(segments)
    const context = dedent(`
      # About the video
      ${prompt}

      # Fine-grained summaries
      ${JSON.stringify(summarizationChapters)}
      
      ## Initial estimates
      These are some initial suggestions for chapters + summaries of video parts.
    `).trim()
    const instructions = dedent(`
      # User query
      Suggest ${partChapterRange.min}-${partChapterRange.max} chapters.
      (Pick the number of chapters that makes the most sense based on the content)
    `).trim()

    chunkedPromises.push(b.FindChapters(
      context, instructions, transcript,
      { collector, env }
    ))
  }

  const chunkedChapters = await Promise.all(chunkedPromises)

  const chapterRange = {
    min: Math.floor(totalChapterTarget*0.9),
    max: Math.ceil(totalChapterTarget*1.3)
  }

  const finalChapters = await b.FindChapters(
    dedent(`
      # About the video
      ${prompt}

      # Fine-grained summaries
      ${JSON.stringify(summarizationChapters)}

      These are zoomed-in sections of the video with suggested chapters

      # Refined (zoomed out) summaries and suggestions
      ${JSON.stringify(chunkedChapters)}

      # About your task
      You will be finding the best suited chapters to label and classify the video sections by, based on previous summaries and chapter suggestions.
      You won't see the original transcript as it's too long, but instead the combined results of different "zooms" of the video.
      That's what you were just presented above.
    `).trim(),
    dedent(`
      # User query
      Suggest ${chapterRange.min}-${chapterRange.max} chapters.
      (Pick the number of chapters that makes the most sense based on the content)
      
      This will be the final result, so take into consideration the previous suggestions and figure out how to turn it into the most coherent video-chapters that will make it easier for a user to navigate the video sections with semantic labels and classifications.
    `).trim(),
    null,
    { collector, env }
  )

  const chapters: Chapter[] = []
  for (const chapter of finalChapters.chapters) {
    const segment: Groq.Audio.TranscriptionSegment = mergedWhisperResults.segments[chapter.bookmark]
    const timestamp = secondsToTimestamp(segment.start)
    chapters.push({
      timestamp,
      title: chapter.chapter_title
    })
  }
  
  return chapters
}
