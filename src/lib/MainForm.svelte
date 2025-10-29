<script lang="ts">
  // import { whisper, baml, chapters } from '$lib/mockData'
  // import { mockEndpoint } from '$lib/mock'
  // const whisperFakeEndpoint = mockEndpoint(whisper)
  // const bamlFakeEndpoint = mockEndpoint([baml])

  import "@macfja/svelte-persistent-runes"
  import Groq from 'groq-sdk'

  import { copy, type CopyDetail } from '@svelte-put/copy'
  import { toast } from 'svelte-sonner'
  import { initTooltip, type TooltipProps } from 'svelte-pops'

  import { autoHeightTextarea } from "$lib/utils/proxy/attachments"

  import { onMount } from "svelte";
  onMount(async function() {
    // let { waveform, mirage, jellyTriangle, bouncy, dotSpinner, dotPulse } = await import('../../node_modules/ldrs/dist')
    // waveform.register()
    // mirage.register()
    // jellyTriangle.register()
    // bouncy.register()
    // dotSpinner.register()
    // dotPulse.register()
    let { waveform, mirage, dotSpinner } = await import('../../node_modules/ldrs/dist')
    waveform.register()
    mirage.register()
    dotSpinner.register()
  })

  import DropZone from "$lib/components/DropZone.svelte"
  import { onPageDrop } from "./components/DropZonePage.svelte"
  
  import TextLoader from "$lib/components/TextLoader.svelte"
  import BigButton from '$lib/components/BigButton.svelte'
  import GenerateIcon from '$lib/assets/icons/solar/media/clapperboard.svg?component'
  import VideoFileIcon from '$lib/assets/icons/solar/media/video-playlist.svg?component'
  // import UploadFileIcon from '$lib/assets/icons/solar/upload.svg?component'
  import UploadFileIcon from '$lib/assets/icons/Upload.svelte'

  // import StopButton from '$lib/components/StopButton.svelte'

  import type { Chapter } from '../routes/api/generate/types'
  
  // import { processVideo, type ProcessVideoResult} from "$lib/ffmpeg"
  import { type ProcessVideoResult} from "$lib/ffmpeg"
  let processVideo: ((videoURL: string) => Promise<ProcessVideoResult>) | undefined 
  onMount(async function () {
    const module = await import('$lib/ffmpeg')
    processVideo = module.processVideo
  })

  // -------------------------------------------------------------------

  let GROQ_API_KEY = $persist(undefined, 'groq_api_key')

  let prompt: string = $persist('', 'prompt')
  let smoothTextarea: boolean = $state(false)

  let files: FileList | undefined = $state()
  
  onPageDrop(function(data, target) {
    if (target.name === 'video-file') {
      files = data.files
    }
  })

  let audioPromise = $derived.by(function() {
    if(files && processVideo) {
      for (const videoFile of files) {
        const blobURL = URL.createObjectURL(videoFile)
        return processVideo(blobURL)
      }
    }
    else return null
  })

  let generationPromise: Promise<[any, Chapter[]]> | undefined = $state()
  let finishedGenerating = $state(false)

  async function onclick(e: MouseEvent) {
    e.preventDefault()
    generationPromise = undefined
    finishedGenerating = false

    // @ts-ignore
    if(!audioPromise) return toast.warning('Start by uploading media', { icon: UploadFileIcon })

    const processedAudio = await audioPromise
    console.log(processedAudio.chunks)
    const groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true })
    if(!processedAudio.chunks) console.warn("No audio chunks")
    if(!groq) console.warn("Failed to start Groq client")

    const whisperChunksPromise = Promise.all(processedAudio.chunks.map(async(chunk)=>{
      const whisperPromise = groq.audio.transcriptions.create({
        file: chunk.audio.file,
        model: "whisper-large-v3-turbo",
        // prompt: "Specify context or spelling", // Optional
        response_format: "verbose_json",
        timestamp_granularities: ['segment'], // can also take 'word'
        language: "en", // Optional
        temperature: 0.0, // Optional
      })
      // const whisperPromise = whisperFakeEndpoint(0)
      return whisperPromise
    }))

    const bamlPromise = whisperChunksPromise.then((whisperChunks) => {
      return fetch('api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': GROQ_API_KEY || "",
        },
        body: JSON.stringify({whisperChunks, processedAudio, prompt})
      }).then(r => r.json())
    })

    generationPromise = Promise.all([whisperChunksPromise, bamlPromise])

    await generationPromise
    // console.log(await bamlPromise)
    finishedGenerating = true
  }

  let copyTrigger: HTMLButtonElement | undefined = $state()

  const apiKeyTooltipProps: TooltipProps = {
    onMouse: true,
    tweenDuration: 150,
    hideMS: 80,
    modalOffset: 25,
    modalShift: 10,
    class: "rounded-xl bg-[white]/60 backdrop-blur-sm border-1 border-[white] shadow-xl",
  }
</script>

{#snippet apiKeyTooltip()}
  <div class="py-1.5 px-2.5">
    <p class="font-semibold text-gray-800">Know the risks</p>
    <p class="text-xs text-gray-500 tracking-tight">
      Always use low-privilege API keys
      <br>
      for <span class="font-mono text-gray-800 font-medium">bring-your-own-key</span> apps.
    </p>
  </div>
{/snippet}

{#snippet fileNamePreview(cutoff = 25)}
  {@const name = files?.[0]?.name}
  {#if (!name)}
    your video
  {:else}
    <span class="text-xs tracking-tighter font-bold text-gray-800">
      {name.substring(0, cutoff).trim()}...
    </span>
  {/if}
{/snippet}

<form class="mt-5" action="">
  <div use:initTooltip={() => ({ children: apiKeyTooltip, ...apiKeyTooltipProps })}>
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
  </div>

  <label class="mt-3 cursor-pointer" for="video-file">Drop video</label>
  <DropZone
    icon={VideoFileIcon}
    promise={audioPromise}
    clickText="Select video"
    subheading="Any file containing audio should work"
    for="video-file"
  >
    <input
      bind:files={files}
      type="file"
      id="video-file" name="video-file"
      class="sr-only"
    >
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
        <!-- Grabbed audio from your video -->
        Grabbed audio from {@render fileNamePreview?.()}
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
      <BigButton {onclick}>
        {#snippet icon()}
          <div class="opacity-90 transform scale-[1.3] translate-y-[-5%] translate-x-[-10%] relative">
            <div class:opacity-0={Boolean(generationPromise) && !finishedGenerating}>
              <GenerateIcon width="1.2em" />
            </div>
            {#if generationPromise}
              {#await generationPromise}
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

          {#if generationPromise}
            {#await generationPromise}
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
      
      <!-- {#if generationPromise && !finishedGenerating}
        <div class="inline-block -ml-1.5">
          <StopButton onclick={(e: MouseEvent)=>{e.preventDefault()}} />
        </div>
      {/if} -->

    </div>
  </div>
  {#if generationPromise}
    <div class="ml-1">
      {#await generationPromise}
        <div class="mt-6 -ml-2 text-indigo-500">
          <l-mirage
            size="120"
            speed="10"
            color="currentColor" 
          ></l-mirage>
        </div>
      {:then [whisperChunks, chapters]}
        <div class="resultPane mt-8 relative">
          <button
            class="absolute top-4 right-4"
            bind:this={copyTrigger}
            onclick={(e: MouseEvent) => {
              e.preventDefault()
              
            }}
          >
            Copy
          </button>
          <ul
            use:copy={{ trigger: copyTrigger }}
            oncopied={(e: CustomEvent<CopyDetail>) => {
              // toast.success(`Copied your chapters: ${e.detail.text.substring(0,10)}...`)
              toast.success(`Copied your chapters`)
            }}
          >
            {#each chapters as chapter}
              <li class="font-medium leading-snug text-sm">
                <span class="text-indigo-500 font-semibold">{chapter.timestamp}</span>
                &#45;
                <span>{chapter.title}</span>
              </li>
            {/each} 
          </ul>
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
		@apply block font-semibold;
  }

  input {
    @apply block min-w-0 py-1.5 pr-3 pl-1;
		@apply text-base text-gray-900;
		@apply grow placeholder:text-gray-400 focus:outline-none sm:text-sm/6;
  }


  .field {
    @apply flex items-center;
		@apply pl-3 -outline-offset-1;
		@apply rounded-lg outline-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600;
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
	}

  .resultPane {
    @apply shadow-lg shadow-[#21119320];
    @apply p-4 rounded-2xl;
    @apply outline-1 outline-gray-300;
    /* @apply bg-[white]; */
    background: linear-gradient(
      --alpha(white / 100%) 0.1rem,
      --alpha(white / 60%) 1.5rem,
      --alpha(white / 40%) 100%
    );
  }

  button {
    @apply text-sm font-bold tracking-tighter;
    @apply py-1 px-2 rounded-lg;
    @apply cursor-pointer outline-1;
    @apply bg-white outline-gray-300 text-gray-500;
    @apply hover:outline-gray-400 hover:text-gray-800;
    @apply active:bg-gray-200 active:outline-gray-300 active:text-gray-900;
  }
</style>
