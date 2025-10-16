<script>
  let { children, messages } = $props()

  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition'
  let index = $state(0)
  onMount(function() {
    setInterval(function() {
      index = (index+1) % messages.length
    }, 950)
  })
</script>

<div class="text-center">
  {@render children?.()}
  <!-- <p>{messages[(index-1) % messages.length]}</p> -->
  <p>{messages[index]}</p>
  <!-- <p>{messages[(index+1) % messages.length]}</p> -->
</div>

<style lang="postcss">
  @reference 'tailwindcss';

  p {
    @apply font-semibold text-xs;
    background: linear-gradient(
      135deg,
      var(--color-gray-300) 5%,
      var(--color-gray-700) 25%,
      var(--color-gray-700) 75%,
      var(--color-gray-300) 95%
    );
    background-clip: text;
    color: transparent;
    background-size: 200% 100%;
    animation: shimmer 1.9s linear infinite;
    animation-delay: -1.4s;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>