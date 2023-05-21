<script lang="ts" context="module">
import { clear, swr } from '$lib/index.js'

type Pokemon = {
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
  async fetcher(key): Promise<Pokemon> {
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
</script>

<script lang="ts">
import { createSuspense } from '@svelte-drama/suspense'

const suspend = createSuspense()

export let number: number
$: data = Pokemon.live(number, suspend)
$: console.log('DATA', $data)
$: note = Note.live($data?.species.name, suspend)
$: console.log('NOTE', $note)

function onChange(e: { currentTarget: HTMLTextAreaElement }) {
  if (!$data) throw new TypeError()
  const name = $data.species.name
  const value = e.currentTarget.value
  Note.update(name, value)
  localStorage.setItem(`/api/notes/${name}`, value)
}
</script>

<p>
  <button type="button" on:click={clear}>
    Clear Cache
  </button>
</p>

{#if $data}
  <h1>{$data.species.name}</h1>
  <p>
    <img alt="" src={$data.sprites.front_default} />
  </p>
  <p>
    <textarea value={$note} on:change={onChange} />
  </p>
{/if}
