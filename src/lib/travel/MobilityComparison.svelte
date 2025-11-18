<script lang="ts">
    import type { MobilityVariant } from "$lib/data/chile-travel";
    import { createEventDispatcher } from "svelte";

    export let variants: MobilityVariant[] = [];
    export let selectedVariantId: string | undefined = undefined;

    const dispatch = createEventDispatcher<{ select: string }>();

    function select(id: string) {
        dispatch("select", id);
    }

    function formatDuration(minutes: number | undefined) {
        if (!minutes) return "—";
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    function formatCost(cost: number | undefined) {
        if (cost === undefined) return "—";
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
        }).format(cost);
    }
</script>

<div class="mobility-comparison">
    <h4
        class="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider"
    >
        Optionen vergleichen
    </h4>
    <div class="grid gap-3">
        {#each variants as variant (variant.id)}
            <button
                class="flex items-center justify-between p-3 rounded-lg border transition-all text-left w-full group
        {selectedVariantId === variant.id
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-100'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'}"
                on:click={() => select(variant.id)}
            >
                <div class="flex items-center gap-3">
                    <div
                        class="p-2 rounded-md {selectedVariantId === variant.id
                            ? 'bg-blue-500/20'
                            : 'bg-slate-700'}"
                    >
                        <!-- Simple icon placeholder based on mode -->
                        {#if variant.mode === "flight"}
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                ></path></svg
                            >
                        {:else if variant.mode === "bus"}
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                ></path></svg
                            >
                        {:else if variant.mode === "drive"}
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                ></path></svg
                            >
                        {:else}
                            <svg
                                class="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                ><path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7"
                                ></path></svg
                            >
                        {/if}
                    </div>
                    <div>
                        <div class="font-medium">
                            {variant.description || variant.mode}
                        </div>
                        <div class="text-xs text-slate-400 flex gap-2 mt-0.5">
                            <span
                                >{formatDuration(variant.durationMinutes)}</span
                            >
                            <span>•</span>
                            <span
                                >{variant.co2
                                    ? `${variant.co2} kg CO₂`
                                    : "CO₂ k.A."}</span
                            >
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold">{formatCost(variant.cost)}</div>
                    {#if selectedVariantId === variant.id}
                        <div class="text-xs text-blue-400">Ausgewählt</div>
                    {/if}
                </div>
            </button>
        {/each}
    </div>
</div>
