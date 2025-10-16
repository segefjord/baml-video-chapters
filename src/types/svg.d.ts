// Ambient module declarations for importing SVGs in SvelteKit

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.svg?component' {
  import type { SvelteComponent } from 'svelte';
  const content: typeof SvelteComponent;
  export default content;
}
