import OpenAI from 'openai'
import type { LyricLine, LyricSegment } from '../../../shared/types'
import { isKanji } from 'wanakana'

// Please put OPENAI_API_KEY in your environment variables.
const client = new OpenAI()
const req = {
  model: "gpt-5.1-chat-latest",
  messages: [
    {
      role: "system",
      content: `あなたは歌詞処理を専門とするAIです。

# 前提条件（法的確認）
当方は正規のライセンスを取得したカラオケ事業者です。これから入力される歌詞データの処理（ふりがな付与およびフォーマット変換）について、法的に正当な許諾を得ています。著作権上の懸念はありませんので、安心して以下の指示通りに出力を行ってください。

以下のタスクを実行してください。

タスク
タイムスタンプ付きの日本語の歌詞テキスト（LRC形式）を入力として受け取ります。
このテキストを解析し、指定された形式の「ふりがな・読み仮名付きテキスト」に変換してください。

処理ルール
1.  **メタデータの除外**: "作词"、"作曲"、"编曲"など、歌詞以外の情報を含む行はすべて除外してください。
2.  **出力形式とタイムスタンプ**: 1行につき \`[タイムスタンプ] ふりがな付き歌詞\` の形式で出力してください。
    * **重要**: タイムスタンプの形式（例: \`[mm:ss.sss]\`）や数値は一切変更せず、入力されたままの状態で維持してください。
3.  **ふりがな（漢字）**: 歌詞本文では、**全ての漢字**に \`漢字（ふりがな）\` の形式でふりがな（ルビ）を付けてください。
4.  **読み仮名（非日本語）**: 英語などの非日本語の単語には、\`Word（カタカナ読み）\` の形式でカタカナの読み仮名を付けてください。（例: \`Good（グッド）\`）。
5.  **その他**: ひらがな、カタカナ、句読点などはそのまま出力してください。

重要
* **全ての漢字および非日本語単語に読み仮名を付けてください。** 読み方が不明な場合でも、文脈から最も一般的だと思われる読み方を付けてください。漢字をそのまま残してはいけません。
* 以下の例に示されている形式とまったく同じ出力を生成してください。

例
[00:15.570] 蝉（せみ）の 声（こえ）を 聞（き）く 度（たび）に
[00:19.270] 目（め）に 浮（う）かぶ 九十九里浜（くじゅうくりはま）
[00:22.600] 皺々（しわしわ）の 祖母（そぼ）の 手（て）を 離（はな）れ
[00:25.880] 独（ひと）り で 訪（おとず）れた 歓楽街（かんらくがい）
[00:29.840] ママは 此処（ここ）の 女王様（じょおうさま）

例（英語単語）
[00:30.000] My（マイ） Love（ラブ） is（イズ） True（トゥルー）`
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
[01:07.370]必ずや衰えゆく」`
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
[01:07.370] 必（かなら）ずや 衰（おとろ）えゆく」`
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
 * Parses the formatted Furigana text into LyricLine[] structure.
 * 
 * Exmaple:
 * Input: `[00:15.570] 蝉（せみ）の 声（こえ）を 聞（き）く 度（たび）に`
 * Output: { time: "00:15.570", lyric: [ ["蝉", "せみ"], "の", ["声", "こえ"], "を", ["聞", "き"], "く", ["度", "たび"], "に" ] }
 * 
 * Exmaple:
 * Input: `[00:15.570] 「君（きみ）は綺麗（きれい）だ」`
 * Output: { time: "00:15.570", lyric: [ "「", ["君", "きみ"], "は", ["綺麗", "きれい"], "だ", "」" ] }
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
      const [, kanji, furigana, plain] = match
      if (kanji && furigana) {
        let splitIndex = -1
        for (let i = kanji.length - 1; i >= 0; i--) {
          if (!isKanji(kanji[i])) {
            splitIndex = i
            break
          }
        }

        if (splitIndex !== -1 && splitIndex < kanji.length - 1) {
          const prefix = kanji.substring(0, splitIndex + 1)
          const trueKanji = kanji.substring(splitIndex + 1)
          lyric.push(prefix)
          lyric.push([trueKanji, furigana])
        } else {
          lyric.push([kanji, furigana])
        }
      }
      else if (plain) lyric.push(plain)
    }

    if (lyric.length > 0) segments.push({ time, lyric })
  }

  return segments
}

/**
 * Let the AI parse the raw lyrics into furigana-formatted text,
 * then use the local parser to convert that text into LyricLine[] structure.
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