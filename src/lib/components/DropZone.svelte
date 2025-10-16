<script>
  let props = $props()
  let { children, clickText, subheading, loading, loaded } = props
</script>

{#snippet clickToPick()}
  <div class="title flex">
    <label for={props.for} class="clickText">
      <span>{clickText}</span>
      {@render children?.()}
    </label>
    <p class="pl-1">or drag and drop</p>
  </div>
{/snippet}

<div class="border relative">
  <div class="text-center" class:opacity-0={props?.promise}>
    <div class="icon">
      <props.icon />
      <!-- <svg viewBox="0 0 24 24" fill="currentColor" data-slot="icon" aria-hidden="true">
        <path d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clip-rule="evenodd" fill-rule="evenodd"></path>
      </svg> -->
    </div>
    <div class="mt-2">
      {@render clickToPick?.()}
    </div>
    <p class="subheading">{subheading}</p>
  </div>
  {#if props.promise}
    <div class="absolute inset-0 grid place-items-center">
      {#await props.promise}
        {@render loading?.()}
      {:then result}
        <div class="w-[calc(100%-3rem)] text-center">
          <div class="mb-3 inline-block">
            {@render clickToPick?.()}
          </div>
          {@render loaded?.(result)}
        </div>
      {/await}
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference 'tailwindcss';

	.border {
		@apply px-6 pt-6 pb-6.5;
		@apply flex justify-center;
		@apply rounded-2xl border-1 border-dashed border-gray-900/25;
		@apply dark:border-white/25;
    /* @apply bg-white/40; */
    background: linear-gradient(
      --alpha(white / 90%) 0%,
      --alpha(white / 50%) 20%,
      --alpha(white / 30%) 100%
    );
	}

	.icon {
		@apply text-gray-300;
		@apply mx-auto size-12 dark:text-gray-600;
	}

	.title {
		@apply text-sm/6 text-gray-600;
		@apply dark:text-gray-400;
	}

	.clickText {
		@apply bg-transparent text-indigo-600;
		@apply relative cursor-pointer rounded-md font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:focus-within:outline-indigo-500 dark:hover:text-indigo-300;
	}

	.subheading {
		@apply text-xs/5 text-gray-600;
		@apply dark:text-gray-400;
	}
</style>
