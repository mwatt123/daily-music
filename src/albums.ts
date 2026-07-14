export interface Album {
  title: string;
  artist: string;
  year: number;
  coverArtUrl: string;
}

/**
 * Starter curated list. Cover art sourced from the iTunes Search API at
 * curation time (not fetched live by the app -- see SPEC.md).
 * Growing this list is manual follow-up work, not part of this build.
 */
export const albums: Album[] = [
  {
    title: "In Rainbows",
    artist: "Radiohead",
    year: 2007,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/dd/50/c7/dd50c790-99ac-d3d0-5ab8-e3891fb8fd52/634904032463.png/600x600bb.jpg",
  },
  {
    title: "Rumours",
    artist: "Fleetwood Mac",
    year: 1977,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/4d/13/ba/4d13bac3-d3d5-7581-2c74-034219eadf2b/081227970949.jpg/600x600bb.jpg",
  },
  {
    title: "To Pimp a Butterfly",
    artist: "Kendrick Lamar",
    year: 2015,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/b5/a6/91/b5a69171-5232-3d5b-9c15-8963802f83dd/15UMGIM15814.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Nevermind",
    artist: "Nirvana",
    year: 1991,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/19/7a/58/197a5870-618b-446f-a193-ca4a84502adc/190295781163.jpg/600x600bb.jpg",
  },
  {
    title: "Discovery",
    artist: "Daft Punk",
    year: 2001,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fd/4a/77/fd4a77db-0ebc-d043-41a2-f32fa1bb0fb4/dj.qrikkdwj.jpg/600x600bb.jpg",
  },
  {
    title: "Back to Black",
    artist: "Amy Winehouse",
    year: 2006,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/cf/3f/09/cf3f0994-980d-d8ed-088d-ae89af256b73/15UMGIM24224.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Abbey Road",
    artist: "The Beatles",
    year: 1969,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/48/53/43/485343e3-dd6a-0034-faec-f4b6403f8108/13UMGIM63890.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    year: 1973,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/54/d0/62/54d06230-1196-0bd0-93b3-1bd3eef2b43d/cover_-.jpg/600x600bb.jpg",
  },
  {
    title: "Thriller",
    artist: "Michael Jackson",
    year: 1982,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/600x600bb.jpg",
  },
  {
    title: "Lemonade",
    artist: "Beyonce",
    year: 2016,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d2/53/65/d2536587-c7f3-9153-4677-f5a2f3e9e5ad/886447691120.jpg/600x600bb.jpg",
  },
  {
    title: "My Beautiful Dark Twisted Fantasy",
    artist: "Kanye West",
    year: 2010,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/37/da/7c/37da7cc5-2b6f-9bb8-30ba-8a8c3be3e16a/00602527584973.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "21",
    artist: "Adele",
    year: 2011,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/eb/ca/25/ebca2596-cd1e-b295-91a3-771c868d0a79/191404113868.png/600x600bb.jpg",
  },
  {
    title: "The Rise and Fall of Ziggy Stardust and the Spiders From Mars",
    artist: "David Bowie",
    year: 1972,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/5f/fa/56/5ffa56c2-ea1f-7a17-6bad-192ff9b6476d/825646124206.jpg/600x600bb.jpg",
  },
  {
    title: "Songs in the Key of Life",
    artist: "Stevie Wonder",
    year: 1976,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/eb/1f/12/eb1f12ec-474c-63aa-43af-09282f423b9d/00602537004737.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Purple Rain",
    artist: "Prince",
    year: 1984,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/00/17/f2/0017f24f-e580-b77a-71a8-1bc7b75881bf/603497822065.jpg/600x600bb.jpg",
  },
  {
    title: "The Miseducation of Lauryn Hill",
    artist: "Lauryn Hill",
    year: 1998,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/09/6b/55/096b55c4-ee8f-23bd-df8f-0ca0821f3028/886446727189.jpg/600x600bb.jpg",
  },
  {
    title: "Blonde",
    artist: "Frank Ocean",
    year: 2016,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/8d/76/23/8d76234b-5101-fa9b-58b3-5e17645d5b05/00602527744209.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Funeral",
    artist: "Arcade Fire",
    year: 2004,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2b/09/6e/2b096e8c-ae65-fc42-a4b1-19abb4100433/886446576442.jpg/600x600bb.jpg",
  },
  {
    title: "Is This It",
    artist: "The Strokes",
    year: 2001,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/9c/ae/7a/9cae7a72-29ed-08aa-1b42-913776bbb6ec/886443855571.jpg/600x600bb.jpg",
  },
  {
    title: "Currents",
    artist: "Tame Impala",
    year: 2015,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/64/48/5c/64485cc9-968c-68cc-764e-9a7c71733def/00602567155454.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Stankonia",
    artist: "Outkast",
    year: 2000,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/d6/21/fb/d621fbde-c099-6794-7102-2692f10c4dbb/886448814283.jpg/600x600bb.jpg",
  },
  {
    title: "Songs in A Minor",
    artist: "Alicia Keys",
    year: 2001,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c2/07/c6/c207c6ee-e3f1-cad2-1259-69a3ebd08b5c/828765571227.jpg/600x600bb.jpg",
  },
  {
    title: "The Velvet Underground and Nico",
    artist: "The Velvet Underground",
    year: 1967,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/92/93/39/9293397f-a707-237e-ec7e-0ca613a67e3c/06UMGIM04143.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Blue",
    artist: "Joni Mitchell",
    year: 1971,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/00/a2/43/00a24363-cf69-bfd2-a26a-a042d57ab141/075992719926.jpg/600x600bb.jpg",
  },
  {
    title: "Mezzanine",
    artist: "Massive Attack",
    year: 1998,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/8a/c1/04/8ac104fb-d37e-1433-5d2e-805710d7a7c4/00602567930983.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Dummy",
    artist: "Portishead",
    year: 1994,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c1/71/93/c1719342-df7d-e9c5-c87c-53dae5afb289/00042282855329.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Illinois",
    artist: "Sufjan Stevens",
    year: 2005,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/47/9e/a3/479ea382-2686-3ea9-3def-d67d81fb2ee3/mzi.lhtprasx.jpg/600x600bb.jpg",
  },
  {
    title: "Homogenic",
    artist: "Bjork",
    year: 1997,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/12/38/d0/1238d076-0a43-5758-1876-5ab6d256d648/5016958995157.png/600x600bb.jpg",
  },
  {
    title: "Remain in Light",
    artist: "Talking Heads",
    year: 1980,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music/87/5f/5b/mzi.zzquknhm.jpg/600x600bb.jpg",
  },
  {
    title: "Enter the Wu-Tang 36 Chambers",
    artist: "Wu-Tang Clan",
    year: 1993,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/8c/20/1f/8c201f03-7617-2d8b-3d8d-e0ba2d55041b/196872123784.jpg/600x600bb.jpg",
  },
  {
    title: "Baduizm",
    artist: "Erykah Badu",
    year: 1997,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/73/f5/09/73f50998-4b58-0fe9-fac6-c2d83ca067c5/00602557325478.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "Sound of Silver",
    artist: "LCD Soundsystem",
    year: 2007,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/fb/fe/a5/fbfea51a-0130-d557-c1f4-9e5e98b7bab8/094638511359.jpg/600x600bb.jpg",
  },
  {
    title: "Aja",
    artist: "Steely Dan",
    year: 1977,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/c2/3c/54/c23c5414-20d1-7aea-f0f5-187974c58d65/23UMGIM79990.rgb.jpg/600x600bb.jpg",
  },
  {
    title: "i,i",
    artist: "Bon Iver",
    year: 2019,
    coverArtUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/de/f0/bf/def0bfe3-6b57-34fa-3a40-bb67aa6284b2/656605235066.jpg/600x600bb.jpg",
  },
];
