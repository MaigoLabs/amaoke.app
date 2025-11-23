export default {
  home: {
    titles: {
      continue: 'Continue From Last Session',
      history: 'History',
      myPlaylists: 'My Playlists',
      recPlaylists: 'Recommended Playlists'
    },
    btn: {
      importFromNetease: 'Import from NetEase'
    },
    text: {
      playlistCreatedBy: 'From {u}'
    }
  },
  admin: {
    neteaseLogin: {
      title: 'NetEase Login',
      scanTitle: 'Scan to Login',
      scanTip: 'Please use NetEase Music App to scan',
      generating: 'Generating QR Code...',
      scanned: 'Scanned',
      confirm: 'Please confirm login on your phone',
      success: 'Login Successful',
      errorPrefix: 'Error: '
    }
  },
  import: {
    netease: {
      title: 'Import from NetEase',
      status: {
        importing: 'Importing',
        success: 'Import Complete',
        error: 'Import Failed'
      },
      songs: 'songs',
      tip: 'Go to NetEase Music App, find a Japanese playlist you like, click share, copy link, and paste it here to start importing!',
      inputLabel: 'NetEase Playlist Link / ID',
      btnStart: 'Start Import',
      btnUpdate: 'Update Playlist',
      btnView: 'View Playlist'
    }
  },
  playlist: {
    detail: {
      title: 'Playlist Details',
      creator: 'Creator: ',
      count: 'Songs: ',
      startPractice: 'Start Practice',
      songList: 'Song List',
      songs: 'songs',
      updateFromNetease: 'Update from NetEase'
    },
    list: {
      mine: 'My Playlists',
      rec: 'Recommended Playlists',
      import: 'Import from NetEase',
      created: 'Created by {u}',
      count: '{n} songs'
    }
  },
  results: {
    title: 'Practice Results',
    fields: {
      speed: 'Speed',
      accuracy: 'Accuracy',
      realtime: 'Realtime Rate',
      count: 'Count',
      time: 'Time',
      duration: 'Duration'
    },
    units: {
      cpm: 'CPM',
      percent: '%',
      x: 'x',
      char: 'chars'
    },
    chart: {
      speed: 'Speed (CPM)',
      accuracy: 'Accuracy (%)'
    },
    btn: {
      next: 'Next Song',
      back: 'Back to Playlist',
      retry: 'Retry'
    }
  },
  song: {
    mode: {
      typing: 'Typing Mode',
      music: 'Music Mode',
      karaoke: 'Singing Mode'
    },
    karaoke: {
      noVocals: 'No vocal separation track detected, cannot adjust vocal volume. Please process in song details page first.'
    },
    play: {
      speed: 'Speed: ',
      accuracy: 'Accuracy: ',
      stats: {
        right: 'Right: ',
        fuzzy: 'Fuzzy: ',
        wrong: 'Wrong: ',
        remaining: 'Remaining: '
      }
    }
  },
  user: {
    title: 'Account Management',
    loginSuccess: {
      title: 'Login Successful',
      content: 'Login Successful!',
      jump: 'Jump'
    },
    generateCode: {
      title: 'Generate Sync Code',
      copy: 'Copy',
      success: 'Sync Code Generated! Code is: {code}',
      expiry: 'This code will expire after use or in 7 days if unused.'
    },
    desc: {
      intro: 'This App uses a sync code system like Japanese mobile games, no email/password registration needed.',
      instruction: 'To login on another device, click "Generate Sync Code" then click "Login" on the target device.',
      loginMode: 'You are in "Sync Login" page. Get a code from another device and enter it below to login.'
    },
    input: 'Enter Sync Code',
    btn: {
      generate: 'Generate Sync Code',
      loginWithCode: 'Login with Sync Code',
      login: 'Login'
    }
  },
  errorPage: {
    title: 'Oops!',
    message: 'The page you’re looking for doesn’t exist. It might have been removed, renamed, or never existed.\n\n </br></br>  Go back to the <a class="error-page__link" href="/">homepage</a> to continue browsing',
    return: 'Return home',
  },
  player: {
    menu: {
      showFuri: 'Show Furigana',
      hideFuri: 'Hide Furigana',
      revertHiragana: 'Revert to Hiragana',
      convertToKatakana: 'Convert all to Katakana',
      showRomaji: 'Show Romaji',
      hideRomaji: 'Hide Romaji',
      showRomajiOnError: 'Show Romaji on Error',
      hideRomajiOnError: 'Don\'t Show Romaji on Error',
      musicModeUnavailable: 'Not available in music mode',
      showRepeated: 'Show Repeated Lines',
      hideRepeated: 'Hide Repeated Lines',
      shuffle: 'Current: Shuffle',
      sequential: 'Current: Sequential',
      nextSong: 'Next Song'
    }
  },
  dialog: {
    close: 'Close',
    error: {
      title: 'Error',
      refresh: 'Refresh to Retry'
    }
  },
  components: {}
}