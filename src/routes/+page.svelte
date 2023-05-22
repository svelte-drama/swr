<script lang="ts">
import { clear } from '$lib/index.js'
import Pokemon from './pokemon.svelte'
import { Suspense } from '@svelte-drama/suspense'
import { fade } from 'svelte/transition'

let number = 133
</script>

<input type="number" min="1" max="150" bind:value={number} />
<p>
  <button type="button" on:click={clear}> Clear Cache </button>
</p>

<Suspense>
  <p slot="loading" in:fade>Loading...</p>
  <p slot="error">An error has occurred.</p>

  {#key number}
    <Pokemon {number} />
  {/key}
</Suspense>
