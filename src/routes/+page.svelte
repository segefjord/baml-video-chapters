<script lang="ts">
  import MainForm from "$lib/MainForm.svelte"

  interface TechItem {
    img: string
    alt: string
    size: number
    space: number
  }
  const poweredBy: TechItem[] = [
    { img: '/logos/tailwind.svg', alt: 'Tailwind CSS', size: 60, space: 0 },
    { img: '/logos/svelte.svg', alt: 'Svelte', size: 100, space: 0.1 },
    { img: '/logos/vercel.svg', alt: 'Vercel', size: 50, space: 0 },
    { img: '/logos/groq.svg', alt: 'groq.com', size: 70, space: 0.15 },
    { img: '/logos/openai.svg', alt: 'OpenAI', size: 85, space: 0.24 },
    { img: '/logos/meta.svg', alt: 'Meta AI', size: 68, space: 0.25 },
  ]
</script>

<main>
  <div class="card">
    <header class="text-gray-800">
      <div class="flex items-center">
        <a href="https://docs.boundaryml.com/guide/introduction/what-is-baml" target="_blank">
          <img class="w-[4rem]" height="auto" src="/logos/baml-lamb-white.webp" alt="BAML Lamb Logo">
        </a>
        <div class="ml-1">
          <a href="https://boundaryml.com" target="_blank">
            <img class="mt-1 ml-2 h-[2rem]" src="/logos/boundary-black-big.svg" alt="BoundaryML Logo">
          </a>
          <h1 class="ml-2 text-2xl"><span class="font-bold">BAML</span> Video Chapters</h1>
        </div>
      </div>
      <div class="mt-5 flex items-center">
        <p class="text-sm font-black tracking-tight mr-1">
          Powered by:
        </p>
        {#each poweredBy as {img, alt, size, space} }
          <img src={img} {alt} style={`
            height: ${1.6*(size/100)}rem;
            margin-left: ${0.32+space}rem;
          `}>
        {/each}
      </div>
      <p class="mt-1 text-xs font-medium text-gray-400">
        Crafted with 0% vibes and 100% artisanry.
      </p>
    </header>
    <MainForm />
  </div>
</main>

<style lang="postcss">
  @reference 'tailwindcss';

  .card {
    @apply my-10 mb-25 max-w-md mx-auto;
    @apply p-12 pb-25 rounded-4xl;
    @apply border-1 border-[white]/40;
    
    /* @apply bg-white/40; */
    background: linear-gradient(
      --alpha(white / 85%) 5rem,
      --alpha(white / 50%) 14rem,
      --alpha(white / 50%) calc(100% - 4rem),
      --alpha(white / 60%) 100%
    );
  }

</style>
