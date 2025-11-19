<script lang="ts">
    import { Carousel } from "flowbite-svelte";
    import type { ResourceImage } from "$lib/data/chile-travel";

    export let images: ResourceImage[] = [];
    export let className: string = "";
    export let showCaptions: boolean = true;

    // Transform ResourceImage to the format expected by Flowbite Carousel if needed,
    // or just use a custom slot. Flowbite Carousel accepts `images` prop as {alt, src, title}[]
    // but we might want more control over the caption/credit.
    // Let's use the default slot for maximum flexibility.

    let carouselImages = images.map((img) => ({
        alt: img.caption || "Reisebild",
        src: img.url,
        title: img.caption,
    }));
</script>

<div class={className}>
    {#if images.length === 0}
        <div
            class="h-full w-full bg-gray-200 flex items-center justify-center text-gray-400 rounded-lg"
        >
            Kein Bild verfügbar
        </div>
    {:else if images.length === 1}
        <div class="relative h-full w-full overflow-hidden rounded-lg">
            <img
                src={images[0].url}
                alt={images[0].caption || "Reisebild"}
                class="h-full w-full object-cover"
            />
            {#if showCaptions && (images[0].caption || images[0].credit)}
                <div
                    class="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-xs text-white backdrop-blur-sm"
                >
                    {#if images[0].caption}
                        <p class="font-medium">{images[0].caption}</p>
                    {/if}
                    {#if images[0].credit}
                        <p class="opacity-75">© {images[0].credit}</p>
                    {/if}
                </div>
            {/if}
        </div>
    {:else}
        <Carousel
            images={carouselImages}
            let:Indicators
            let:Controls
            class="h-full rounded-lg"
        >
            <Controls />
            <Indicators />
            {#each images as image, index}
                <div class="relative h-full w-full">
                    <img
                        src={image.url}
                        alt={image.caption || "Reisebild"}
                        class="h-full w-full object-cover"
                    />
                    {#if showCaptions && (image.caption || image.credit)}
                        <div
                            class="absolute bottom-0 left-0 right-0 bg-black/50 p-4 text-sm text-white backdrop-blur-sm"
                        >
                            {#if image.caption}
                                <p class="font-medium">{image.caption}</p>
                            {/if}
                            {#if image.credit}
                                <p class="text-xs opacity-75">
                                    © {image.credit}
                                </p>
                            {/if}
                        </div>
                    {/if}
                </div>
            {/each}
        </Carousel>
    {/if}
</div>
