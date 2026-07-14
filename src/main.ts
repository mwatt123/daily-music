import "./style.css";
import { getVisitorId } from "./visitorId";
import { pickDailyAlbum } from "./dailyAlbum";
import { albums } from "./albums";

const visitorId = getVisitorId();
const album = pickDailyAlbum(visitorId, albums);

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="card">
    <div class="eyebrow">Today's Pick</div>
    <img class="cover-art" src="${album.coverArtUrl}" alt="${album.title} cover art" />
    <h1 class="title">${album.title}</h1>
    <div class="meta">${album.artist} &middot; ${album.year}</div>
  </div>
`;
