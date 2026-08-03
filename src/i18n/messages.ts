import type { Locale } from './locales'

const zh = {
  'nav.home': '首页',
  'nav.explore': '探索',
  'nav.following': '关注',
  'nav.search': '搜索作品',
  'nav.publish': '发布作品',
  'nav.login': '登录',
  'nav.account': '用户中心',
  'nav.dashboard': '创作者仪表盘',
  'nav.admin': '管理后台',
  'nav.logout': '退出登录',
  'footer.tagline': '收集每一种被歌声点亮的想象。',
  'footer.unofficial': '非官方同人项目',
  'footer.share': '分享你的作品',
  'work.back': '返回上一页',
  'work.creator': '同人创作者',
  'work.colorNotes': '色彩笔记',
  'work.rights': '版权与署名信息',
  'work.license': '许可证',
  'work.maintainers': '维护者',
  'work.coAuthors': '共同作者',
  'work.ai': 'AI 使用声明',
  'work.origin': '作品来源',
  'work.tags': '作品标签',
  'work.next': '下一件作品',
  'work.like': '喜欢',
  'work.liked': '已喜欢',
  'work.save': '收藏',
  'work.comment': '评论',
  'work.body': '作品正文',
  'creator.works': 'TA 的作品',
  'creator.follow': '关注',
  'account.title': '用户中心',
  'account.sessions': '登录设备',
  'account.revoke': '注销此设备',
  'account.current': '当前设备',
  'account.verifyEmail': '验证邮箱',
  'account.resendVerify': '重发验证邮件',
  'account.locale': '界面语言',
  'auth.login': '登录',
  'auth.register': '注册',
  'auth.forgot': '忘记密码？',
  'auth.reset': '重置密码',
  'auth.github': '使用 GitHub 登录',
  'auth.or': '或',
  'common.save': '保存',
  'common.loading': '加载中…',
  'common.language': '语言',
} as const

type MessageKey = keyof typeof zh

const en: Record<MessageKey, string> = {
  'nav.home': 'Home',
  'nav.explore': 'Explore',
  'nav.following': 'Following',
  'nav.search': 'Search works',
  'nav.publish': 'Publish',
  'nav.login': 'Sign in',
  'nav.account': 'Account',
  'nav.dashboard': 'Creator dashboard',
  'nav.admin': 'Admin',
  'nav.logout': 'Sign out',
  'footer.tagline': 'Collecting every imagination lit by her voice.',
  'footer.unofficial': 'Unofficial fan project',
  'footer.share': 'Share your work',
  'work.back': 'Back',
  'work.creator': 'Fan creator',
  'work.colorNotes': 'Color notes',
  'work.rights': 'Rights & credit',
  'work.license': 'License',
  'work.maintainers': 'Maintainers',
  'work.coAuthors': 'Co-authors',
  'work.ai': 'AI disclosure',
  'work.origin': 'Origin',
  'work.tags': 'Tags',
  'work.next': 'Next work',
  'work.like': 'Like',
  'work.liked': 'Liked',
  'work.save': 'Save',
  'work.comment': 'Comment',
  'work.body': 'Work body',
  'creator.works': 'Works',
  'creator.follow': 'Follow',
  'account.title': 'Account',
  'account.sessions': 'Signed-in devices',
  'account.revoke': 'Revoke device',
  'account.current': 'This device',
  'account.verifyEmail': 'Verify email',
  'account.resendVerify': 'Resend verification',
  'account.locale': 'Interface language',
  'auth.login': 'Sign in',
  'auth.register': 'Sign up',
  'auth.forgot': 'Forgot password?',
  'auth.reset': 'Reset password',
  'auth.github': 'Continue with GitHub',
  'auth.or': 'or',
  'common.save': 'Save',
  'common.loading': 'Loading…',
  'common.language': 'Language',
}

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': zh,
  en,
}

export type { MessageKey }

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string>): string {
  let text = catalogs[locale][key] ?? catalogs['zh-CN'][key] ?? key
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value)
    }
  }
  return text
}
