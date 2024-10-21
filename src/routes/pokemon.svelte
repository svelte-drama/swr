<script lang="ts" module>
import { swr } from '$lib/index.js'

type PokemonType = {
  species: {
    name: string
  }
  sprites: {
    front_default: string
  }
}

// Simulate network delay
const sleep = () => new Promise((resolve) => setTimeout(resolve, 500))

const maxAge = 30 * 60 * 1000
const Pokemon = swr({
  key(id: number) {
    return `https://pokeapi.co/api/v2/pokemon/${id}/`
  },
  async fetcher(key): Promise<PokemonType> {
    const response = await fetch(key)
    await sleep()
    return response.json()
  },
  maxAge,
  name: 'pokemon:05-11-2023',
})
const Note = swr({
  key(name: string) {
    return `/api/notes/${name}`
  },
  async fetcher(key) {
    const data = localStorage.getItem(key)
    await sleep()
    return data ?? ''
  },
  maxAge,
  name: 'notes:05-12-2023',
})

Pokemon.keys().then((keys) => {
  console.log('#KEYS#', keys)
})
</script>

<script lang="ts">
import { createSuspense } from '@svelte-drama/suspense'

interface Props {
  id: number
}
let { id }: Props = $props()
const pokemon = $derived(Pokemon.get(id))
const note = $derived(Note.get(pokemon.value?.species.name))

const suspend = createSuspense()

async function onchange(e: { currentTarget: HTMLTextAreaElement }) {
  if (!pokemon.value) throw new TypeError()
  const name = pokemon.value.species.name
  const value = e.currentTarget.value
  Note.update(name, value)
  localStorage.setItem(`/api/notes/${name}`, value)
}

$effect(() => {
  suspend(pokemon)
})
</script>

<h1>Promise</h1>
{#await suspend(Promise.all([pokemon, note]))}
  <p>Loading...</p>
{:then [pokemon, note]}
  <h2>{pokemon.species.name}</h2>
  <p>
    <img alt="" src={pokemon.sprites.front_default} />
  </p>
  <p>
    <textarea value={note} {onchange}></textarea>
  </p>
{/await}

<h1>Store</h1>
{#if $pokemon && $note !== undefined}
  <h2>{$pokemon.species.name}</h2>
  <p>
    <img alt="" src={$pokemon.sprites.front_default} />
  </p>
  <p>
    <textarea value={$note} {onchange}></textarea>
  </p>
{/if}

<h1>Value</h1>
{#if pokemon.value && note.value !== undefined}
  <h2>{pokemon.value.species.name}</h2>
  <p>
    <img alt="" src={pokemon.value.sprites.front_default} />
  </p>
  <p>
    <textarea value={note.value} {onchange}></textarea>
  </p>
{/if}
