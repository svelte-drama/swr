<script lang="ts">
import { suspend } from '@svelte-drama/suspense'
import { Pokemon, Note } from './pokemon.svelte'

interface Props {
  id: number
}
let { id }: Props = $props()
const pokemon = $derived(suspend(Pokemon.get(id)).value)
const note = $derived(suspend(Note.get(pokemon?.species.name)).value)

async function onchange(e: { currentTarget: HTMLTextAreaElement }) {
  if (!pokemon) throw new TypeError()
  const name = pokemon.species.name
  const value = e.currentTarget.value
  Note.update(name, value)
  localStorage.setItem(`/api/notes/${name}`, value)
}
</script>

<p>
  <textarea value={note} {onchange}></textarea>
</p>
