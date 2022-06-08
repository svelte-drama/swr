<script lang="ts" context="module">
import type { Load } from '@sveltejs/kit';
import { swr } from '$lib/index'
import { refreshOnFocus } from '$lib/plugin'


const sleep = (timeout: number) => {
  // Sleep to simulate network delay
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

type Profile = {
  nickname: string
  hedgehogs_petted: number
  favorite_color: string
}

const new_profile: Profile = {
  nickname: 'Farmer Joe',
  hedgehogs_petted: 2,
  favorite_color: '#E34234',
}

const { data, fetch, processing } = swr<Profile>('/api/profile', {
  async fetcher(key) {
    console.log('Fetching data...')
    await sleep(500)
    const raw = localStorage.getItem(key)

    const result = raw ? JSON.parse(raw) : { ...new_profile }
    return result
  },
  async updater(key, value) {
    const raw = JSON.stringify(value)
    await sleep(1000)
    localStorage.setItem(key, raw)
  },
  plugins: [refreshOnFocus()],
})

export const load: Load = async () => {
  const data = await fetch()
  console.log(data)
  return {}
}
</script>

<h1>My Profile</h1>
{#if $data === undefined}
  <p>Loading...</p>
{:else}
  <p>
    <label>
      Nick Name:
      <input type="text" bind:value={$data.nickname} />
    </label>
  </p>
  <p>
    <label>
      Hedgehogs Hugged:
      <input
        type="number"
        min="0"
        step="1"
        bind:value={$data.hedgehogs_petted}
      />
    </label>
  </p>
  <p>
    <label>
      Favorite Color:
      <input type="color" bind:value={$data.favorite_color} />
    </label>
  </p>

  {#if $processing}
    <p>Refreshing Data...</p>
  {/if}
{/if}
