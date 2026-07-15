import "./style.css";
import { getVisitorId } from "./visitorId";
import { getLocalDateString, selectDailyAlbum } from "./dailyAlbum";
import { albums } from "./albums";
import { extractDominantColors } from "./dominantColor";

const visitorId = getVisitorId();
const album = selectDailyAlbum(visitorId, getLocalDateString(), albums);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="content">
    <div class="eyebrow">Today's Pick</div>
    <img class="cover-art" src="${album.coverArtUrl}" alt="${album.title} cover art" />
    <h1 class="title">${album.title}</h1>
    <div class="meta">${album.artist} &middot; ${album.year}</div>
  </div>
`;

// Page renders immediately with the fallback colors set in style.css;
// once extraction resolves, swap the two custom properties in place so the
// background/text transition to the album's real colors without re-rendering markup.
extractDominantColors(album.coverArtUrl).then(({ primary, secondary }) => {
  document.documentElement.style.setProperty("--color-primary", primary);
  document.documentElement.style.setProperty("--color-secondary", secondary);
});
