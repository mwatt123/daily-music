import { describe, expect, it } from "vitest";
import { applyReviewDecisions, type ReviewDecisionRecord, type CoverArt } from "./applyReviewDecisions";
import type { AlbumChange } from "./diffDefinitiveAlbums";
import type { Album } from "../src/albums";

describe("applyReviewDecisions", () => {
  it("leaves albums untouched for a rejected decision", () => {
    const current: Album[] = [{ title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" }];
    const reviewItems: AlbumChange[] = [{ type: "add", artist: "Alvvays", toAlbum: "Blue Rev", confidence: "high" }];
    const decisions: ReviewDecisionRecord[] = [{ idx: 0, decision: "reject", finalAlbum: null }];

    const result = applyReviewDecisions(current, reviewItems, decisions, new Map());

    expect(result.albums).toEqual(current);
    expect(result.skipped).toEqual([]);
  });

  it("adds the fetched album for an approved add", () => {
    const current: Album[] = [{ title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" }];
    const reviewItems: AlbumChange[] = [{ type: "add", artist: "Alvvays", toAlbum: "Blue Rev", confidence: "high" }];
    const decisions: ReviewDecisionRecord[] = [{ idx: 0, decision: "approve", finalAlbum: "Blue Rev" }];
    const coverArt = new Map<number, CoverArt>([[0, { coverArtUrl: "b", year: 2022 }]]);

    const result = applyReviewDecisions(current, reviewItems, decisions, coverArt);

    expect(result.albums).toEqual([
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "a" },
      { title: "Blue Rev", artist: "Alvvays", year: 2022, coverArtUrl: "b" },
    ]);
    expect(result.skipped).toEqual([]);
  });

  it("uses the corrected title for a 'correct' decision on a replace", () => {
    const current: Album[] = [
      { title: "m b v", artist: "My Bloody Valentine", year: 2013, coverArtUrl: "a" },
    ];
    const reviewItems: AlbumChange[] = [
      { type: "replace", artist: "My Bloody Valentine", fromAlbums: ["m b v"], toAlbum: " Loveless", confidence: "high" },
    ];
    const decisions: ReviewDecisionRecord[] = [{ idx: 0, decision: "correct", finalAlbum: "Loveless" }];
    const coverArt = new Map<number, CoverArt>([[0, { coverArtUrl: "b", year: 1991 }]]);

    const result = applyReviewDecisions(current, reviewItems, decisions, coverArt);

    expect(result.albums).toEqual([{ title: "Loveless", artist: "My Bloody Valentine", year: 1991, coverArtUrl: "b" }]);
  });

  it("records a skipped decision when cover art wasn't fetched for an approve/correct", () => {
    const current: Album[] = [];
    const reviewItems: AlbumChange[] = [{ type: "add", artist: "Alvvays", toAlbum: "Blue Rev", confidence: "high" }];
    const decisions: ReviewDecisionRecord[] = [{ idx: 0, decision: "approve", finalAlbum: "Blue Rev" }];

    const result = applyReviewDecisions(current, reviewItems, decisions, new Map());

    expect(result.albums).toEqual([]);
    expect(result.skipped).toEqual([
      { idx: 0, artist: "Alvvays", finalAlbum: "Blue Rev", reason: "no confident cover art match found" },
    ]);
  });

  it("collapses to a single existing album for a 'keepone' decision on a replace", () => {
    const current: Album[] = [
      { title: "Blonde", artist: "Frank Ocean", year: 2016, coverArtUrl: "a" },
      { title: "channel ORANGE", artist: "Frank Ocean", year: 2012, coverArtUrl: "b" },
      { title: "nostalgia,ULTRA.", artist: "Frank Ocean", year: 2011, coverArtUrl: "c" },
    ];
    const reviewItems: AlbumChange[] = [
      {
        type: "replace",
        artist: "Frank Ocean",
        fromAlbums: ["Blonde", "channel ORANGE", "nostalgia,ULTRA."],
        toAlbum: "channel ORANGE",
        confidence: "low",
      },
    ];
    const decisions: ReviewDecisionRecord[] = [{ idx: 0, decision: "keepone", finalAlbum: "Blonde" }];

    const result = applyReviewDecisions(current, reviewItems, decisions, new Map());

    expect(result.albums).toEqual([{ title: "Blonde", artist: "Frank Ocean", year: 2016, coverArtUrl: "a" }]);
  });

  it("collapses a remove decision down to the kept album", () => {
    const current: Album[] = [
      { title: "Fatigue", artist: "L'Rain", year: 2019, coverArtUrl: "a" },
      { title: "fata morgana", artist: "L'Rain", year: 2021, coverArtUrl: "b" },
      { title: "I Killed Your Dog", artist: "L'Rain", year: 2023, coverArtUrl: "c" },
    ];
    const reviewItems: AlbumChange[] = [
      { type: "remove", artist: "L'Rain", fromAlbums: ["Fatigue", "fata morgana", "I Killed Your Dog"] },
    ];
    const decisions: ReviewDecisionRecord[] = [{ idx: 0, decision: "keepone", finalAlbum: "I Killed Your Dog" }];

    const result = applyReviewDecisions(current, reviewItems, decisions, new Map());

    expect(result.albums).toEqual([{ title: "I Killed Your Dog", artist: "L'Rain", year: 2023, coverArtUrl: "c" }]);
  });

  it("applies several decisions together without disturbing untouched albums", () => {
    const current: Album[] = [
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "z" },
      { title: "Blonde", artist: "Frank Ocean", year: 2016, coverArtUrl: "a" },
      { title: "channel ORANGE", artist: "Frank Ocean", year: 2012, coverArtUrl: "b" },
    ];
    const reviewItems: AlbumChange[] = [
      { type: "add", artist: "Alvvays", toAlbum: "Blue Rev", confidence: "high" },
      {
        type: "replace",
        artist: "Frank Ocean",
        fromAlbums: ["Blonde", "channel ORANGE"],
        toAlbum: "channel ORANGE",
        confidence: "low",
      },
    ];
    const decisions: ReviewDecisionRecord[] = [
      { idx: 0, decision: "reject", finalAlbum: null },
      { idx: 1, decision: "keepone", finalAlbum: "Blonde" },
    ];

    const result = applyReviewDecisions(current, reviewItems, decisions, new Map());

    expect(result.albums).toEqual([
      { title: "Rumours", artist: "Fleetwood Mac", year: 1977, coverArtUrl: "z" },
      { title: "Blonde", artist: "Frank Ocean", year: 2016, coverArtUrl: "a" },
    ]);
  });
});
