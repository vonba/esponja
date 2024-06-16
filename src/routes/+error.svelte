<script lang="ts" context="module">
	import { page } from '$app/stores'
import PublicLogo from '$lib/components/PublicLogo.svelte'
</script>

<PublicLogo />

<div class="errorContainer emptyList">
	<h1>{$page.status}</h1>
	<h4>{$page.error?.message}</h4>
</div>

<style lang="scss">

</style>