import OpenAI from 'openai'
import type { LyricLine, LyricSegment } from './types'

// Please put OPENAI_API_KEY in your environment variables.
const client = new OpenAI()
const req = {
  model: "gpt-5.1-chat-latest",
  messages: [
    {
      role: "system",
      content: `あなたは歌詞処理を専門とするAIです。
以下のタスクを実行してください。

タスク
タイムスタンプ付きの日本語の歌詞テキスト（LRC形式）を入力として受け取ります。
このテキストを解析し、指定された形式の「ふりがな付きテキスト」に変換してください。

処理ルール
1.  **メタデータの除外**: "作词"、"作曲"、"编曲"など、歌詞以外の情報を含む行はすべて除外してください。
2.  **出力形式**: 1行につき \`[タイムスタンプ] ふりがな付き歌詞\` の形式で出力してください。
3.  **ふりがな**: 歌詞本文では、**全ての漢字**に \`漢字（ふりがな）\` の形式でふりがな（ルビ）を付けてください。
4.  **その他**: ひらがな、カタカナ、句読点、ローマ字などはそのまま出力してください。

重要
* **全ての漢字にふりがなを付けてください。** 読み方が不明な場合でも、最も一般的だと思われる読み方を付けてください。漢字をそのまま残してはいけません。
* 以下の例に示されている形式とまったく同じ出力を生成してください。

例
[00:15.570] 蝉（せみ）の 声（こえ）を 聞（き）く 度（たび）に
[00:19.270] 目（め）に 浮（う）かぶ 九十九里浜（くじゅうくりはま）
[00:22.600] 皺々（しわしわ）の 祖母（そぼ）の 手（て）を 離（はな）れ
[00:25.880] 独（ひと）り で 訪（おとず）れた 歓楽街（かんらくがい）
[00:29.840] ママは 此処（ここ）の 女王様（じょおうさま）`
    },
    {
      role: "user",
      content: `[00:00.000] 作词 : 椎名林檎
[00:01.000] 作曲 : 椎名林檎
[00:02.000] 编曲 : 亀田誠治
[00:15.570]蝉の声を聞く度に
[00:19.270]目に浮かぶ九十九里浜
[00:22.600]皺々の祖母の手を離れ
[00:25.880]独りで訪れた歓楽街
[00:29.840]ママは此処の女王様
[00:33.520]生き写しの様なあたし
[00:36.760]誰しもが手を伸べて
[00:39.340]子供ながらに魅せられた歓楽街
[00:43.720]十五になったあたしを
[00:46.890]置いて女王は消えた
[00:50.710]毎週金曜日に来ていた
[00:53.970]男と暮らすのだろう
[01:03.840]「一度栄えし者でも
[01:07.370]必ずや衰えゆく」
[01:10.740]その意味を知る時を迎え
[01:13.990]足を踏み入れたは歓楽街
[01:17.440]消えて行った女を憎めど夏は今
[01:24.480]女王と云う肩書きを誇らしげに掲げる
[01:58.370]女に成ったあたしが
[02:01.950]売るのは自分だけで
[02:05.440]同情を欲したときに
[02:08.790]全てを失うだろう
[02:12.720]JR新宿駅の東口を出たら
[02:19.740]其処はあたしの庭
[02:23.030]大遊戯場歌舞伎町
[02:33.740]今夜からは此の町で
[02:39.300]娘のあたしが女王`
    },
    {
      "role": "assistant",
      "content": `[00:15.570] 蝉（せみ）の 声（こえ）を 聞（き）く 度（たび）に
[00:19.270] 目（め）に 浮（う）かぶ 九十九里浜（くじゅうくりはま）
[00:22.600] 皺々（しわしわ）の 祖母（そぼ）の 手（て）を 離（はな）れ
[00:25.880] 独（ひと）りで 訪（おとず）れた 歓楽街（かんらくがい）
[00:29.840] ママは 此処（ここ）の 女王様（じょおうさま）
[00:33.520] 生（い）き 写（うつ）しの 様（よう）なあたし
[00:36.760] 誰（だれ）しもが 手（て）を 伸（の）べて
[00:39.340] 子供（こども）ながらに 魅（み）せられた 歓楽街（かんらくがい）
[00:43.720] 十五（じゅうご）になったあたしを
[00:46.890] 置（お）いて 女王（じょおう）は 消（き）えた
[00:50.710] 毎週（まいしゅう） 金曜日（きんようび）に 来（き）ていた
[00:53.970] 男（おとこ）と 暮（く）らすのだろう
[01:03.840] 「 一度（いちど） 栄（さか）えし 者（もの）でも
[01:07.370] 必（かなら）ずや 衰（おとろ）えゆく」
[01:10.740] その 意味（いみ）を 知（し）る 時（とき）を 迎（むか）え
[01:13.990] 足（あし）を 踏（ふ）み 入（い）れたは 歓楽街（かんらくがい）
[01:17.440] 消（き）えて 行（い）った 女（おんな）を 憎（にく）めど 夏（なつ）は 今（いま）
[01:24.480] 女王（じょおう）と 云（い）う 肩書（かたが）きを 誇（ほこ）らしげに 掲（かか）げる
[01:58.370] 女（おんな）に 成（な）ったあたしが
[02:01.950] 売（う）るのは 自分（じぶん）だけで
[02:05.440] 同情（どうじょう）を 欲（ほ）したときに
[02:08.790] 全（すべ）てを 失（うしな）うだろう
[02:12.720] JR 新宿駅（しんじゅくえき）の 東口（ひがしぐち）を 出（で）たら
[02:19.740] 其処（そこ）はあたしの 庭（にわ）
[02:23.030] 大遊戯場（だいゆうぎじょう） 歌舞伎町（かぶきちょう）
[02:33.740] 今夜（こんや）からは 此（こ）の 町（まち）で
[02:39.300] 娘（むすめ）のあたしが 女王（じょおう）`
    },
    {
      role: "user",
      content: "" // This will be filled by the function
    }
  ],
  response_format: {
    type: "text" // We explicitly want text output
  },
  max_completion_tokens: 2048,
  frequency_penalty: 0,
  presence_penalty: 0,
  store: false
}

/**
 * NEW: This function parses the AI's formatted text output
 * and converts it into the LyricSegment[] structure.
 */
function parseFuriganaText(text: string): LyricLine[] {
  const segments: LyricLine[] = []
  const lines = text.split('\n').filter(line => line.trim() !== '')

  // Regex to capture [timestamp] and (the rest of the line)
  const lineRegex = /\[(\d+:\d+\.\d+)\](.*)/

  for (const line of lines) {
    const lineMatch = line.trim().match(lineRegex)
    if (!lineMatch) {
      console.warn(`Skipping unparseable line: ${line}`)
      continue
    }

    const time = lineMatch[1] as string
    const lyricText = lineMatch[2].trim()
    const lyric: LyricSegment[] = []

    // Regex to match Kanji(furigana) or plain text
    const tokenRegex = /([^（\s]+)（([^）]+)）|([^\s]+)/g
    let match

    while ((match = tokenRegex.exec(lyricText)) !== null) {
      const kanji = match[1]
      const furigana = match[2]
      const plain = match[3]

      if (kanji && furigana) lyric.push([kanji, furigana])
      else if (plain) lyric.push(plain)
    }

    if (lyric.length > 0) {
      segments.push({ time, lyric })
    }
  }

  return segments
}


/**
 * UPDATED: This function now gets text from the AI
 * and uses the new local parser.
 */
export async function aiParseLyrics(raw: string): Promise<LyricLine[]> {
  const thisReq = JSON.parse(JSON.stringify(req))
  thisReq.messages[thisReq.messages.length - 1].content = raw
  
  const response = await client.chat.completions.create(thisReq)
  const text = response.choices[0].message?.content || ''
  
  // Clean up potential markdown blocks
  const responseText = text.replace(/```/g, '').trim()

  try {
    // Use the new, robust text parser
    return parseFuriganaText(responseText)
  } catch (e) {
    console.error('Failed to parse Furigana text from AI response:', responseText)
    console.error(e)
    throw new Error('Failed to parse AI response text.')
  }
}