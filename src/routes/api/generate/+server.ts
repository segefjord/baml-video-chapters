// import { error } from '@sveltejs/kit';
// import type { RequestEvent, RequestHandler } from './$types';
// import { b } from "$lib/baml_client"
// import { Collector } from "@boundaryml/baml"
// import type { Resume } from '$lib/baml_client/types'

// export const GET: RequestHandler = async (event: RequestEvent) => {
// 	const collector = new Collector("my-collector")

// 	const env = {
// 		BAML_LOG: "WARN",
// 		OPENAI_API_KEY: "sk-...",
// 		GROQ_API_KEY: "gsk_...",
// 	}

// 	const res = await b.ExtractResume(
// 		"Aaron Sverdlen\n University of California, Berkeley\n B.S. Electrical Engineering and Computer Science",
// 		{ collector, env }
// 	);
	
// 	console.log(collector.last?.id)
// 	console.log(collector.last?.usage)
// 	console.log(collector.logs)

// 	return new Response(JSON.stringify(res));
// };


import { error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';
import { b } from "$lib/baml_client"
import { Collector } from "@boundaryml/baml"
import type { Resume } from '$lib/baml_client/types'

export const POST: RequestHandler = async (event: RequestEvent) => {
	try {
		const collector = new Collector("my-collector")

		const GROQ_API_KEY = event.request.headers.get('GROQ_API_KEY')
		const data = await event.request.json()
		
		console.log(data)

		const env = {
			BAML_LOG: "WARN",
			GROQ_API_KEY: GROQ_API_KEY || "",
			// OPENAI_API_KEY: "sk-...",
		}

		// const res = await b.ExtractResume(
		// 	"Aaron Sverdlen\n University of California, Berkeley\n B.S. Electrical Engineering and Computer Science",
		// 	{ collector, env }
		// );
		
		// console.log(collector.last?.id)
		// console.log(collector.last?.usage)
		// console.log(collector.logs)
		const res = {
			video_part: data.video_part,
			context: data.context,
			instructions: data.instructions,
		}

		return new Response(JSON.stringify(res));
	} catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400
    });
  }
};
