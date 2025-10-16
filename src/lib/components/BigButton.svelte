<script>
  const props = $props();
  let { children, icon, onclick, disabled } = props;
</script>

<!-- svelte-ignore a11y_positive_tabindex -->
<button
  class="inline-block px-3.5 py-3 rounded-full select-none"
  draggable="false"
  {onclick}
  disabled={false}
>
  <div class="btn relative">

    <div class="radial-gradient inline-block">
    </div>

    <span class="flex items-center gap-[0.25em]">
      {@render icon?.()}
      {@render children?.()}
    </span>
  </div>
</button>

<style lang="postcss">
	@reference "tailwindcss";

	.btn {
		@apply text-xl font-semibold rounded-2xl;
    @apply text-[white];
		@apply cursor-pointer;
		@apply px-5 py-3;

    @apply border-1 border-[#667fff];

		overflow: hidden;
		position: relative;
    /* @apply border-2 border-[#1b0074]; */
	}

	/* .btn svg {
    display: none;
		position: absolute;
		top: -2px;
		left: -2px;
		width: calc(100% + 4px);
		height: calc(100% + 4px);
	} */

	.btn span {
		position: relative;
	}

  

  .radial-gradient {
    background: radial-gradient(circle, #5526ed 25%, #666bff);

    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    transform: translate(5%, -15%) rotate(50deg) scale(1, 4.6);

  }
  
  button:disabled .btn {
    opacity: 60%;
  }

  /* button:disabled .btn > span {
    opacity: 90%;
  } */

  button:disabled .btn {
    @apply cursor-default;
  }

  button:disabled .radial-gradient {
    /* background: radial-gradient(circle, #5367ff 25%, #979bff); */
    background: radial-gradient(circle, #757575 25%, #acacac);
  }

  button:not(:disabled):hover {
    .btn {
      @apply border-[#8c8cff];
    }
    .radial-gradient {
      background: radial-gradient(circle, #4f31fc 25%, #6f73ff);
    }
  }

  button:not(:disabled):active {
    .btn {
      @apply border-[#5f41f3];
    }
    .radial-gradient {
      background: radial-gradient(circle, #331499 0%, #5578d2);
      transform: translate(-15%, 40%) rotate(80deg) scale(1, 6.3) !important;
    }
  }

  button:not(:disabled):active {
    transform: scale(0.96);
    transition: transform 0ms;
  }

  button:not(:disabled) {
    transition: transform 80ms;
    @apply cursor-pointer;
  }
</style>
