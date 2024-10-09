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

const suspend = createSuspense()

let { id } = $props()

let pokemon = $derived(Pokemon.get(id))
$effect(() => {
  console.log('DATA', pokemon())
})

let note = $derived(Note.get(pokemon()?.species.name))
$effect(() => {
  console.log('NOTE', note())
})

function onchange(e: { currentTarget: HTMLTextAreaElement }) {
  if (!pokemon()) throw new TypeError()
  const name = pokemon().species.name
  const value = e.currentTarget.value
  Note.update(name, value)
  localStorage.setItem(`/api/notes/${name}`, value)
}
</script>

{#await suspend.all(pokemon, note) then [pokemon, note]}
  <h1>{pokemon.species.name}</h1>
  <p>
    <img alt="" src={pokemon.sprites.front_default} />
  </p>
  <p>
    <textarea value={note} {onchange}></textarea>
  </p>
{/await}
