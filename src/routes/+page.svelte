<script lang="ts">
import Pokemon from './pokemon.svelte'
import { Suspense } from '@svelte-drama/suspense'
import { fade } from 'svelte/transition'

let number = 133
</script>

<input type="number" min="1" max="150" bind:value={number} />

<Suspense>
  <p slot="loading" in:fade>Loading...</p>
  <p slot="error">An error has occurred.</p>

  {#key number}
    <Pokemon {number} />
  {/key}
</Suspense>
