export default {
  home: {
    titles: {
      continue: '前回のセッションから続ける',
      history: '履歴',
      myPlaylists: 'マイプレイリスト',
      recPlaylists: 'おすすめプレイリスト'
    },
    btn: {
      importFromNetease: 'NetEaseからインポート'
    },
    text: {
      playlistCreatedBy: '{u} 作成'
    }
  },
  admin: {
    neteaseLogin: {
      title: 'NetEaseログイン',
      scanTitle: 'スキャンしてログイン',
      scanTip: 'NetEase Musicアプリでスキャンしてください',
      generating: 'QRコードを生成中...',
      scanned: 'スキャン完了',
      confirm: '携帯電話でログインを確認してください',
      success: 'ログイン成功',
      errorPrefix: 'エラー: '
    }
  },
  import: {
    netease: {
      title: 'NetEaseからインポート',
      status: {
        importing: 'インポート中',
        success: 'インポート完了',
        error: 'インポート失敗'
      },
      songs: '曲',
      tip: 'NetEase Musicアプリでお気に入りの日本語プレイリストを見つけ、共有をクリックし、リンクをコピーしてここに貼り付けると、インポートを開始できます！',
      inputLabel: 'NetEaseプレイリストリンク / ID',
      btnStart: 'インポート開始',
      btnUpdate: 'プレイリストを更新',
      btnView: 'プレイリストを表示'
    }
  },
  playlist: {
    detail: {
      title: 'プレイリスト詳細',
      creator: '作成者: ',
      count: '曲数: ',
      startPractice: '練習開始',
      songList: '曲リスト',
      songs: '曲',
      updateFromNetease: 'NetEaseから更新'
    },
    list: {
      mine: 'マイプレイリスト',
      rec: 'おすすめプレイリスト',
      import: 'NetEaseからインポート',
      created: '{u} 作成',
      count: '{n} 曲'
    }
  },
  results: {
    title: '練習結果',
    fields: {
      speed: '速度',
      accuracy: '正確率',
      realtime: 'リアルタイム率',
      count: '文字数',
      time: '時間',
      duration: '曲の長さ'
    },
    units: {
      cpm: 'CPM',
      percent: '%',
      x: 'x',
      char: '文字'
    },
    chart: {
      speed: '速度 (CPM)',
      accuracy: '正確率 (%)'
    },
    btn: {
      next: '次の曲',
      back: 'プレイリストに戻る',
      retry: 'もう一度'
    }
  },
  song: {
    mode: {
      typing: 'タイピングモード',
      music: '音楽モード',
      karaoke: '歌うモード'
    },
    karaoke: {
      noVocals: 'ボーカル分離トラックが検出されないため、ボーカル音量を調整できません。まず曲の詳細ページで処理してください。'
    },
    play: {
      speed: '速度: ',
      accuracy: '正確率: ',
      stats: {
        right: '正解：',
        fuzzy: '曖昧：',
        wrong: '不正解：',
        remaining: '残り：'
      }
    }
  },
  user: {
    title: 'アカウント管理',
    loginSuccess: {
      title: 'ログイン成功',
      content: 'ログインに成功しました！',
      jump: '移動'
    },
    generateCode: {
      title: '引き継ぎコード生成',
      copy: 'コピー',
      success: '引き継ぎコードが生成されました！コードは：{code}',
      expiry: 'このコードは使用後、または未使用の場合は7日後に無効になります。'
    },
    desc: {
      intro: 'このアプリは日本のモバイルゲームのように引き継ぎコードシステムを使用しており、メールアドレスやパスワードの登録は不要です。',
      instruction: '別のデバイスでログインするには、「引き継ぎコード生成」をクリックし、ログインしたいデバイスで「ログイン」をクリックしてください。',
      loginMode: '現在は「引き継ぎログイン」ページです。別のデバイスで引き継ぎコードを取得し、下の入力欄に入力して「ログイン」をクリックしてください。'
    },
    input: '引き継ぎコードを入力',
    btn: {
      generate: '引き継ぎコード生成',
      loginWithCode: '引き継ぎコードでログイン',
      login: 'ログイン'
    }
  },
  errorPage: {
    title: 'おっと！',
    message: 'お探しのページは見つかりませんでした。削除されたか、名前が変更されたか、あるいは最初から存在しなかった可能性があります。\n\n </br></br> <a class="error-page__link" href="/">トップページ</a> に戻って閲覧を続けてください',
    return: 'トップページに戻る',
  }
}
