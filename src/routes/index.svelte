<script lang="ts">
import { swr } from '$lib'

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

const { data } = swr<Profile>('/api/profile', {
  async fetcher(key) {
    // Sleep to simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    const raw = localStorage.getItem(key)

    const result = raw ? JSON.parse(raw) : { ...new_profile }
    console.log(result)
    return result
  },
  updater(key, value) {
    const raw = JSON.stringify(value)
    localStorage.setItem(key, raw)
  },
})
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
{/if}
