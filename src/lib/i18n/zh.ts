export default {
  home: {
    titles: {
      continue: '从暂停的位置继续',
      history: '历史数据',
      myPlaylists: '我的歌单',
      recPlaylists: '推荐歌单'
    },
    btn: {
      importFromNetease: '从网易云导入'
    },
    text: {
      playlistCreatedBy: '{u} 创建'
    }
  },
  admin: {
    neteaseLogin: {
      title: '网易云登录',
      scanTitle: '扫码登录',
      scanTip: '请使用网易云音乐 APP 扫码',
      generating: '正在生成二维码...',
      scanned: '已扫描',
      confirm: '请在手机上确认登录',
      success: '登录成功',
      errorPrefix: '错误: '
    }
  },
  import: {
    netease: {
      title: '从网易云导入',
      status: {
        importing: '正在导入',
        success: '导入完成',
        error: '导入出错'
      },
      songs: '首歌曲',
      tip: '去网易云 APP 找一个你喜欢的日本语歌单，点击分享，再点击复制链接，然后把链接粘贴到这里就可以开始导入了！',
      inputLabel: '网易云歌单链接 / ID',
      btnStart: '开始导入',
      btnView: '查看歌单'
    }
  },
  playlist: {
    detail: {
      title: '歌单详情',
      creator: '创建者: ',
      count: '歌曲数: ',
      startPractice: '开始练习',
      songList: '歌曲列表',
      songs: '首歌曲'
    },
    list: {
      mine: '我的歌单',
      rec: '推荐歌单',
      import: '从网易云导入',
      created: '{u} 创建',
      count: '{n} 首歌'
    }
  },
  results: {
    title: '练习结果',
    fields: {
      speed: '速度',
      accuracy: '准确率',
      realtime: '实时率',
      count: '字数',
      time: '用时',
      duration: '歌曲时长'
    },
    units: {
      cpm: 'CPM',
      percent: '%',
      x: 'x',
      char: '字'
    },
    chart: {
      speed: '速度 (CPM)',
      accuracy: '准确率 (%)'
    },
    btn: {
      next: '下一首',
      back: '返回歌单',
      retry: '再来一次'
    }
  },
  song: {
    mode: {
      typing: '打字模式',
      music: '音乐模式',
      karaoke: '唱歌模式'
    },
    karaoke: {
      noVocals: '未检测到人声分离音轨，无法调节人声音量。请先在歌曲详情页进行处理。'
    },
    play: {
      speed: '速度: ',
      accuracy: '正确率: ',
      stats: {
        right: '正确：',
        fuzzy: '模糊：',
        wrong: '错误：',
        remaining: '剩余：'
      }
    }
  },
  user: {
    title: '账号管理',
    loginSuccess: {
      title: '登录成功',
      content: '登录成功！',
      jump: '跳转'
    },
    generateCode: {
      title: '生成引继码',
      copy: '复制',
      success: '引继码生成成功！生成的引继码是：{code}',
      expiry: '这个引继码将会在使用之后、或者未使用的 7 天后会失效'
    },
    desc: {
      intro: '这个 App 像日本的手机游戏一样采用引继码系统管理账号，并不需要用邮箱密码注册帐号。',
      instruction: '如果想要在另一个设备上登录账号，请点击「生成引继码」然后在想要登录的设备上点击「登录」',
      loginMode: '您当前在「引继登录」页面，请在另一个设备上获取引继码之后输入到下面的输入框内点击「登录」'
    },
    input: '输入引继码',
    btn: {
      generate: '生成引继码',
      loginWithCode: '用引继码登录',
      login: '登录'
    }
  },
  errorPage: {
    title: 'Oops!',
    message: 'The page you’re looking for doesn’t exist. It might have been removed, renamed, or never existed.\n\n </br></br> Go back to the <a class="error-page__link" href="/">homepage</a> to continue browsing',
    return: 'Return home',
  }
}