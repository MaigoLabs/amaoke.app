import { lyric, playlist_detail, song_detail } from '@neteasecloudmusicapienhanced/api'

// https://music.163.com/song?id=642871&uct2=U2FsdGVkX19dE/dGqyg30J6dS3aqWznh2Wz9nKoJsKo=
// https://music.163.com/song?id=25723366&uct2=U2FsdGVkX189IV8TRFkOqe8Lqq5vi0s+eKgNFfBRseg=
console.log(await lyric({ id: 25723366 }));
// https://music.163.com/playlist?id=580208139&uct2=U2FsdGVkX18XZab9ViJlHmG5DvPGxTWZXnw6yLwig/w=
// const pl = (await playlist_detail({ id: 580208139 })).body as any
// console.log(pl.playlist.tracks)

// const detail = await song_detail({ ids: "25723366" })
// console.log(detail.body.songs[0])
