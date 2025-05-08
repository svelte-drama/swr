<script lang="ts">
import { clear } from '$lib/index.js'
import Pokemon from './pokemon.svelte'
import { Suspense } from '@svelte-drama/suspense'
import { fade } from 'svelte/transition'

let id = $state(133)
</script>

<input type="number" min="1" max="150" bind:value={id} />
<p>
  <button type="button" onclick={clear}> Clear Cache </button>
</p>

<Suspense>
  {#snippet loading()}
    <p in:fade>Loading Pokemon...</p>
  {/snippet}

  {#snippet failed()}
    <p>An error has occurred.</p>
  {/snippet}

  {#key id}
    <Pokemon {id} />
  {/key}
</Suspense>
