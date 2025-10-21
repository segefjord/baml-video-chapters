<script lang="ts">
	import '../app.css';
	// import favicon from '$lib/assets/favicon.svg';
	
	let { children } = $props()


	// import { detectFrameRate } from '$lib/utils/detectPowerSavingMode'
	// import { browser } from '$app/environment'
	// let resolvePowerSavings: undefined | ( (x:boolean|undefined) => void )
	// if(browser) window.detectedPowerSavingsMode = new Promise(resolve => {
	// 	resolvePowerSavings = resolve
	// })
	// import { onMount } from 'svelte'
	// onMount(async function() {
	// 	if(resolvePowerSavings) {
	// 		const fps = await detectFrameRate()
	// 		resolvePowerSavings(fps < 45)
	// 	}
	// })
</script>

<svelte:head>
	<link rel="icon" href={'/favicon.ico'} />
</svelte:head>

{@render children?.()}
