<script lang="ts">
  import "@macfja/svelte-persistent-runes"
  import Groq from 'groq-sdk'
  import dedent from 'dedent'

  import { autoHeightTextarea } from "$lib/utils/proxy/attachments"

  import { onMount } from "svelte";
  onMount(async function() {
    let { waveform, mirage, jellyTriangle, bouncy, dotSpinner, dotPulse } = await import('../../node_modules/ldrs/dist')
    waveform.register()
    mirage.register()
    jellyTriangle.register()
    bouncy.register()
    dotSpinner.register()
    dotPulse.register()
  })

  import DropZone from "$lib/components/DropZone.svelte"
  
  import TextLoader from "$lib/components/TextLoader.svelte"
  import BigButton from '$lib/components/BigButton.svelte'
  import GenerateIcon from '$lib/assets/icons/solar/media/clapperboard.svg?component'
  import VideoFileIcon from '$lib/assets/icons/solar/media/video-playlist.svg?component'

  import StopButton from '$lib/components/StopButton.svelte'

  import { whisper } from '$lib/mockData'
  import { mockEndpoint } from '$lib/mock'
  const whisperFakeEndpoint = mockEndpoint(whisper)
  
  import { processVideo } from "$lib/ffmpeg"
  import type { ProcessVideoResult } from '$lib/ffmpeg'

  import mergeWhisperResults from "$lib/clientSide/mergeWhisperResults"
  import chunkSegments from "$lib/clientSide/chunkSegments"
  import { promptifySegment } from "$lib/clientSide/promptify"

  let GROQ_API_KEY = $persist(undefined, 'groq_api_key')

  let prompt: string = $persist('', 'prompt')
  let smoothTextarea: boolean = $state(false)

  let ta2: string = $state('')

  let files: FileList | undefined = $state()

  let audioChunksPromise = $derived.by(function() {
    if(files) {
      for (const videoFile of files) {
        const blobURL = URL.createObjectURL(videoFile)
        return processVideo(blobURL)
      }
    }
    else return null
  })

  let resultPromise: Promise<Groq.Audio.Transcription[]> | undefined = $state()
  let finishedGenerating = $state(false)

  async function onclick(e: MouseEvent) {
    e.preventDefault()
    resultPromise = undefined
    finishedGenerating = false
    if(!audioChunksPromise) return
    const audioChunks = (await audioChunksPromise)?.chunks
    console.log(audioChunks)
    const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true })
    if(!audioChunks) throw new Error("No audio chunks")
    if(!groq) throw new Error("Failed to start Groq client")

    resultPromise = Promise.all(audioChunks.map(async(chunk)=>{
      // const whisperPromise = groq.audio.transcriptions.create({
      //   file: chunk.audio.file,
      //   model: "whisper-large-v3-turbo",
      //   // prompt: "Specify context or spelling", // Optional
      //   response_format: "verbose_json",
      //   timestamp_granularities: ['segment'], // can also take 'word'
      //   language: "en", // Optional
      //   temperature: 0.0, // Optional
      // })
      const whisperPromise = whisperFakeEndpoint(5000)
      return whisperPromise
    }))

    const whisperResults = await resultPromise

    if (whisperResults.length < 1) throw new Error("Whisper failed")
    if (whisperResults.length !== audioChunks.length)
      throw new Error("Whisper request count doesn't match audio chunk count")
    
    const mergedWhisperResults = mergeWhisperResults(whisperResults, audioChunks)
    const videoParts = chunkSegments(mergedWhisperResults.segments)
    for (const segments of videoParts) {
      const video_part = promptifySegment(segments)
      const context = dedent(`
        # About the video
        ${prompt}
      `).trim()
      const instructions = dedent(`
        # User query
        Suggest 3 chapters
      `).trim()
      const res = await fetch('api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'GROQ_API_KEY': GROQ_API_KEY || "",
        },
        body: JSON.stringify({video_part, context, instructions})
      })
      console.log(res)
    }

    finishedGenerating = true
  }
</script>

<form class="mt-5" action="">
  <label for="groq-api-key">Groq API key</label>
  <div class="field" class:secret={Boolean(GROQ_API_KEY)}>
    <input
      class="secret"
      id="groq-api-key"
      type="text"
      placeholder="Paste your secret token..."
      bind:value={GROQ_API_KEY}
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
    >
    <div class="secret-mask hidden">● ● ● ● ● ● ● ● ●</div>
  </div>

  <label class="mt-3" for="video-file">Drop video</label>
  <DropZone
    icon={VideoFileIcon}
    promise={audioChunksPromise}
    clickText="Select video"
    subheading="Any file containing audio should work"
    for="video-file"
  >
    <input bind:files={files} id="video-file" type="file" name="video-file" class="sr-only">
    {#snippet loading()}
      <div class="text-indigo-500">
        <TextLoader messages={[
          'ffmpeg.wasm',
          'Spliting chunks',
          'Grabbing Audio',
          'Stealing API key',
        ]}>
          <l-waveform
            size="25"
            stroke="4.5"
            speed="0.5" 
            color="currentColor" 
          ></l-waveform>
        </TextLoader>
      </div>
    {/snippet}
    {#snippet loaded(result: ProcessVideoResult)}
      <audio class="w-full" controls src={URL.createObjectURL(result?.preview.blob)}></audio>
      <p class="pt-1 text-xs text-center text-gray-600">
        Grabbed audio from your video
        <br>
        with <span class="text-indigo-500 font-mono font-bold">ffmpeg.wasm</span>
      </p>
    {/snippet}
  </DropZone>
  
  <label for="prompt" class="mt-4">Prompt <span class="ml-1 text-gray-600">(Optional)</span></label>
  <textarea id="prompt" name="prompt" {@attach autoHeightTextarea([prompt]) }
    bind:value={prompt}
    rows=3
    data-maxRows=12
    data-scrollOnMax
    data-scrollWindowDown
    oninput={(e: InputEventInit) => {
      smoothTextarea = e.inputType === 'deleteContentBackward'
      setTimeout(() => { smoothTextarea = false }, 1)
    }}
    class:smoothTextarea
  ></textarea>
  <p class="ml-1 mt-1.5 explainerText">Write some keywords and spelling details</p>

  <div class="mt-6 -ml-3.5">
    <div class="ml-0.5 flex items-center">
      <BigButton onclick={onclick}>
        {#snippet icon()}
          <div class="opacity-90 transform scale-[1.3] translate-y-[-5%] translate-x-[-10%] relative">
            <div class:opacity-0={Boolean(resultPromise) && !finishedGenerating}>
              <GenerateIcon width="1.2em" />
            </div>
            {#if resultPromise}
              {#await resultPromise}
                <!-- <div class="absolute inset-0 transform scale-[0.45] translate-y-[-3%] translate-x-[-12%] grid place-items-center">
                  <l-jelly-triangle
                    size="30"
                    speed="0.8"
                    color="currentColor" 
                  ></l-jelly-triangle>
                </div> -->
                <div class="absolute inset-0 transform scale-[1] translate-y-[3%] translate-x-[-3%] grid place-items-center">
                  <l-dot-spinner
                    size="20"
                    speed="0.8"
                    color="currentColor" 
                  ></l-dot-spinner>
                </div>
              {:then}
                <div></div>
              {/await}
            {/if}
          </div>

          <!-- {#if resultsPromise}
            {#await resultsPromise}
              <div class="transform scale-[1.5] translate-y-[10%] translate-x-[-10%] grid place-items-center">
                <l-mirage
                  size="30"
                  speed="2.5" 
                  color="currentColor" 
                ></l-mirage>
              </div>
            {:then}
              <div class="transform scale-[1.3] translate-y-[-5%] translate-x-[-10%]">
                <ButtonIcon width="1.2em" />
              </div>
            {/await}
          {/if} -->
        {/snippet}
        <span>
          {#snippet defaultText()}
            Generate Chapters
          {/snippet}

          {#if resultPromise}
            {#await resultPromise}
              <span class="mr-1.5">
                Generating
                <!-- <span class="opacity-80 ml-0.5">
                  <l-dot-pulse
                    size="20"
                    speed="0.9" 
                    color="currentColor" 
                  ></l-dot-pulse>
                  <l-bouncy
                    size="25"
                    speed="1.3" 
                    color="currentColor" 
                  ></l-bouncy>
                </span> -->
              </span>
            {:then}
              {@render defaultText?.()}
            {/await}

          {:else}
            {@render defaultText?.()}
          {/if}
        </span>
      </BigButton>
      
      {#if resultPromise && !finishedGenerating}
        <div class="inline-block -ml-1.5">
          <StopButton onclick={(e: MouseEvent)=>e.preventDefault()} />
        </div>
      {/if}

    </div>
  </div>
  {#if resultPromise}
    <div class="ml-1">
      {#await resultPromise}
        <div class="mt-6 -ml-2 text-indigo-500">
          <l-mirage
            size="120"
            speed="10"
            color="currentColor" 
          ></l-mirage>
        </div>
      {:then}
        <div>
          Test
        </div>
      {/await}
    </div>
  {/if}
</form>

<style lang="postcss">
  @reference 'tailwindcss';

  label {
    @apply ml-1 mb-1;
    @apply text-sm/6 text-gray-900;
		@apply block font-semibold dark:text-white;
  }

  input {
    @apply block min-w-0 py-1.5 pr-3 pl-1;
		@apply text-base text-gray-900;
		@apply grow placeholder:text-gray-400 focus:outline-none sm:text-sm/6 dark:bg-transparent dark:text-white dark:placeholder:text-gray-500;
  }


  .field {
    @apply flex items-center;
		@apply pl-3 -outline-offset-1;
		@apply rounded-lg outline-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 dark:bg-white/5 dark:outline-white/10 dark:focus-within:outline-indigo-500;
    background: linear-gradient(
      --alpha(white / 100%) 20%,
      --alpha(white / 40%) 100%
    );
  }

  input.secret::placeholder {
    @apply font-mono;
  }

  .field.secret input.secret {
    @apply font-mono;
    opacity: 0;
    &:focus {
      opacity: 100;
    }
  }

  .field.secret input.secret:focus + .secret-mask {
    opacity: 0;
  }

  .field.secret {
    @apply relative;
  }

  .field.secret .secret-mask {
    @apply block;
    @apply text-gray-800 text-xs;
    @apply absolute inset-0;
    left: 1.2em;
    top: calc(50% + 0.1em);
    transform: translateY(-50%);
    pointer-events: none;
  }


	textarea {
    @apply mt-1;
		@apply block w-full px-3 pt-2 pb-3 -outline-offset-1;
		@apply text-xs text-gray-800;
		@apply rounded-xl outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600;
    @apply rounded-br-3xl;
    background: linear-gradient(
      --alpha(white / 90%) 0.1rem,
      --alpha(white / 50%) 1.5rem,
      --alpha(white / 30%) 100%
    );

    &.smoothTextarea {
      transition: height 80ms;
    }
	}

	.explainerText {
		@apply text-sm text-gray-400;
		@apply dark:text-gray-700;
	}
</style>
