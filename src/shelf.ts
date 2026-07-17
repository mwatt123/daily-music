import { getVisitorId, type VisitorIdStore } from "./visitorId";
import { getLocalDateString, selectDailyAlbum } from "./dailyAlbum";
import type { Album } from "./albums";
import type { ExtractedColors } from "./dominantColor";
import { applyAlbumColors, renderAlbum } from "./renderAlbum";
import { albumKey, type Crate, type KeptAlbum } from "./crate";
import { listenUrlFor } from "./listenUrl";

export interface ShelfDeps {
  /** The web app's root container (`#app`). */
  container: HTMLElement;
  store: VisitorIdStore;
  crate: Crate;
  albums: Album[];
  /** Precomputed colors keyed by `coverArtUrl` (see src/albumColors.ts). */
  colors: Record<string, ExtractedColors>;
  /** Overridable for tests; defaults to the visitor's local date. */
  date?: string;
}

/**
 * Renders "The Shelf" -- the web app's two-screen crate-digging surface. Screen
 * one is today's serendipitous pick (drawn by the shared `renderAlbum` seam, so
 * the card markup stays identical to the extension) plus a Listen link and a
 * single Keep/Undo control; screen two, below the fold, is the crate: a wall of
 * kept covers, each with its own Listen link and an inline Remove.
 *
 * This layer is deliberately thin glue over the tested {@link Crate} module: it
 * owns no logic worth unit-testing, only DOM assembly and event wiring, and it
 * re-renders wholesale whenever the crate changes. The extension is untouched --
 * it keeps using `initNewTab` and the plain single-card layout.
 */
export async function initShelf(deps: ShelfDeps): Promise<Album> {
  const { container, store, crate, albums, colors, date } = deps;

  const visitorId = await getVisitorId(store);
  const album = selectDailyAlbum(visitorId, date ?? getLocalDateString(), albums);

  container.classList.add("shelf");

  const listenLink = (target: Pick<Album, "artist" | "title" | "listenUrl">, extra = "") =>
    `<a class="listen${extra}" href="${listenUrlFor(target)}" target="_blank" rel="noopener">▷ Listen</a>`;

  function pickActions(): string {
    if (crate.isKept(album)) {
      return `<div class="pick-actions">${listenLink(album)}<span class="chip">✓ In your crate</span><button class="linkbtn" data-act="undo">Undo</button></div>`;
    }
    return `<div class="pick-actions">${listenLink(album)}<button class="btn" data-act="keep">＋ Keep</button></div>`;
  }

  function crateCell(kept: KeptAlbum): string {
    return `<figure>
      <img class="crate-cover" src="${kept.coverArtUrl}" alt="${kept.title} cover art" />
      <figcaption><span class="crate-title">${kept.title}</span><br />${kept.artist} &middot; ${kept.year}</figcaption>
      <div class="fig-actions">${listenLink(kept, " listen--sm")}<button class="prune" data-act="remove" data-key="${kept.key}">Remove</button></div>
    </figure>`;
  }

  function crateBody(kept: KeptAlbum[]): string {
    if (kept.length === 0) {
      const slots = Array.from({ length: 6 }, (_, i) =>
        `<div class="ghost">${i === 0 ? "keep today's pick" : "&middot;"}</div>`,
      ).join("");
      return `<div class="grid">${slots}</div>`;
    }
    return `<div class="grid">${kept.map(crateCell).join("")}</div>`;
  }

  function render(): void {
    const kept = crate.list();
    const n = kept.length;
    container.innerHTML = `
      <section class="screen pick-screen">
        <div class="pick-card"></div>
        <button class="scroll-hint" data-act="toCrate">Your crate &middot; ${n}<span class="arrow">↓</span></button>
      </section>
      <section class="screen crate-screen">
        <div class="crate-wrap">
          <div class="crate-head"><h2>Your Crate</h2><span class="count">${n} record${n === 1 ? "" : "s"}</span></div>
          ${crateBody(kept)}
        </div>
      </section>`;

    // Draw today's card through the shared seam, then append the crate/keep layer
    // around it so the daily-card markup keeps a single source of truth.
    const pickCard = container.querySelector<HTMLElement>(".pick-card")!;
    renderAlbum(pickCard, album);
    pickCard.insertAdjacentHTML("beforeend", pickActions());
  }

  container.addEventListener("click", (event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-act]");
    if (!trigger) return;
    switch (trigger.dataset.act) {
      case "keep":
        crate.keep(album);
        render();
        break;
      case "undo":
        crate.remove(albumKey(album));
        render();
        break;
      case "remove":
        crate.remove(trigger.dataset.key!);
        render();
        break;
      case "toCrate":
        container.querySelector(".crate-screen")?.scrollIntoView({ behavior: "smooth" });
        break;
    }
  });

  render();
  // Today's colors are constant across re-renders, so apply them once. The page
  // shows the style.css fallback until this lands (no runtime canvas extraction).
  applyAlbumColors(colors, album.coverArtUrl);

  return album;
}
