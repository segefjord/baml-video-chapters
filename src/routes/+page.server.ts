import { fail } from "@sveltejs/kit";
import type { LoadEvent } from "@sveltejs/kit";
import type { PageData } from "./$types"
import dotenv from "dotenv";

// import { b } from "$lib/baml_client";

// // Initialize dotenv to load environment variables
// dotenv.config();

// export async function load(event: LoadEvent) {
//   const res = await b.ExtractResume(
//     "Aaron Sverdlen\n University of California, Berkeley\n B.S. Electrical Engineering and Computer Science"
//   );
//   console.log(res);

//   return { res };
// }
