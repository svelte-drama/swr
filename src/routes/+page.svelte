<script lang="ts">
import { clear } from '$lib/index.js'
import Pokemon from './pokemon.svelte'
import { Suspense } from '@svelte-drama/suspense'
import { fade } from 'svelte/transition'

let number = $state(133)
</script>

<input type="number" min="1" max="150" bind:value={number} />
<p>
  <button type="button" onclick={clear}> Clear Cache </button>
</p>

<Suspense>
  {#snippet loading()}
    <p in:fade>Loading...</p>
  {/snippet}
  {#snippet error()}
    <p>An error has occurred.</p>
  {/snippet}

  {#key number}
    <Pokemon {number} />
  {/key}
</Suspense>
