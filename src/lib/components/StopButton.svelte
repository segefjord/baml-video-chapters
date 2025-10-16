<script>
  import StopIcon from '$lib/assets/icons/solar/media/circle-stop.svg?component';

  const props = $props();
  let { children, icon, onclick } = props;
</script>

<button
  class="inline-block px-2 py-3 rounded-full select-none"
  draggable="false"
  {onclick}
>
  <div class="btn relative">
    <span class="opacity-0">S</span>
    <div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div class="bg-[white]/70 rounded-full">
        <StopIcon height="2em" />
      </div>
    </div>
  </div>
</button>

<style lang="postcss">
	@reference "tailwindcss";

	.btn {
		@apply text-xl font-semibold rounded-full;
		@apply cursor-pointer;
		@apply px-5 py-3;

		overflow: hidden;
		position: relative;
    @apply text-gray-800 bg-[#d6ddeb];
    @apply bg-transparent;
    /* @apply border-2 border-gray-300; */
	}

  button:hover .btn {
    /* @apply bg-[#c3cce0]; */
    @apply bg-[#d6ddeb];
  }

  button:active .btn {
    /* @apply bg-[#a5afc6]; */
    @apply bg-[#bec9e0];
  }

  button:active {
    transform: scale(0.9);
    transition: transform 0ms;
  }

  button {
    transition: transform 80ms;
    @apply cursor-pointer;
  }
</style>

