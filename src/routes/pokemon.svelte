<script lang="ts" context="module">
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

export let number: number
$: data = Pokemon.live(number, suspend)
$: console.log('DATA', $data)
$: note = Note.live($data?.species.name, suspend)
$: console.log('NOTE', $note)

function onchange(e: { currentTarget: HTMLTextAreaElement }) {
  if (!$data) throw new TypeError()
  const name = $data.species.name
  const value = e.currentTarget.value
  Note.update(name, value)
  localStorage.setItem(`/api/notes/${name}`, value)
}
</script>

{#if $data}
  <h1>{$data.species.name}</h1>
  <p>
    <img alt="" src={$data.sprites.front_default} />
  </p>
  <p>
    <textarea value={$note} {onchange}></textarea>
  </p>
{/if}
