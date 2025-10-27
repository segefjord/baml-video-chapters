import { error } from '@sveltejs/kit'
import type { RequestEvent, RequestHandler } from './$types'

// import threePass from './3pass'
import twoPass from './2pass'

export const POST: RequestHandler = async (event: RequestEvent) => {
	try {
		const GROQ_API_KEY = event.request.headers.get('Authorization') || ""
		const { whisperChunks, processedAudio, prompt } = await event.request.json()

		if (whisperChunks.length < 1) throw error(400, "No whisper transcript data recieved")
		if (processedAudio.chunks.length < 1) throw error(400, "No audio data recieved")
		if (whisperChunks.length !== processedAudio.chunks.length)
			throw error(422, "Whisper request count doesn't match audio chunk count")

		const res = await twoPass(5, whisperChunks, processedAudio, prompt, GROQ_API_KEY)

		return new Response(JSON.stringify(res))
	} catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400
    })
  }
}
