<script lang="ts" context="module">
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

const swr = SWR({
  maxAge: 30 * 60 * 1000,
  partition: 'user_id',
})
const Pokemon = swr.model({
  key(id: number) {
    return `https://pokeapi.co/api/v2/pokemon/${id}/`
  },
  async fetcher(key): Promise<Pokemon> {
    const response = await fetch(key)
    await sleep()
    return response.json()
  },
  version: '05-11-2023',
})
const Note = swr.model({
  key(name: string) {
    return `/api/notes/${name}`
  },
  async fetcher(key) {
    const data = localStorage.getItem(key)
    await sleep()
    return data ?? ''
  },
  version: '05-12-2023',
})
</script>

<script lang="ts">
import { createSuspense } from '@svelte-drama/suspense'
import { SWR } from '$lib/index.js'

const suspend = createSuspense()

export let number: number
$: data = Pokemon.live(number, suspend)
$: note = Note.live($data?.species.name, suspend)

function onChange(e: { currentTarget: HTMLTextAreaElement }) {
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
    <textarea value={$note} on:change={onChange} />
  </p>
{/if}
