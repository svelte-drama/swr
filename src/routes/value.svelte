<script lang="ts">
import { suspend } from '@svelte-drama/suspense'
import { Pokemon } from './pokemon.svelte'

interface Props {
  children: import('svelte').Snippet
  id: number
}
let { children, id }: Props = $props()

const pokemon = $derived(suspend(Pokemon.get(id)).current)
</script>

{#if pokemon}
  <h1>Value</h1>
  <h2>{pokemon.species.name}</h2>
  <p>
    <img alt="" src={pokemon.sprites.front_default} />
  </p>
  {@render children?.()}
{/if}
