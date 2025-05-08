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
export const Pokemon = swr({
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

export const Note = swr({
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
import NoteComponent from './note.svelte'
import PromiseComponent from './promise.svelte'
import ValueComponent from './value.svelte'

interface Props {
  id: number
}
let { id }: Props = $props()
</script>

<ValueComponent {id}>
  <NoteComponent {id} />
</ValueComponent>

<PromiseComponent {id}>
  <NoteComponent {id} />
</PromiseComponent>
