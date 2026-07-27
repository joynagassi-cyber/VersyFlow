/**
 * I18n Localization — Chinese Simplified (zh)
 */

export const zh = {
  common: { appName: 'VersyFlow', continue: '继续', skip: '跳过', back: '返回', done: '完成', loading: '加载中...', error: '错误', cancel: '取消', confirm: '确认', delete: '删除', search: '搜索' },
  onboarding: { welcome: '欢迎使用 VersyFlow', selectLanguage: '选择你的语言', selectTranslation: '选择圣经译本', rtlWarning: '界面将切换到从右到左阅读', slide1Title: '选择你的译本', slide1Desc: '从可用的圣经译本中选择', slide2Title: '用科学记忆', slide2Desc: 'Rust优化的FSRS算法', slide3Title: '追踪你的进度', slide3Desc: '详细统计和每日连续' },
  home: { greeting: '你好', reviewDue: '{count}节需要复习', streak: '连续{count}天!', explore: '探索圣经', dailyVerse: '今日经文', noReviews: '全部更新! ✓', goodJob: '做得好' },
  bible: { explorer: '圣经探索器', book: '书', chapter: '章', verse: '节', memorize: '背诵这节', favorite: '添加到收藏', search: '搜索引用...', oldTestament: '旧约', newTestament: '新约', verseCount: '{count}节', chapterCount: '{count}章' },
  session: { memorizing: '背诵中', allWordsRevealed: '所有词语已显示', iMemorized: '我已记住', needMoreTime: '需要更多时间', tapToReveal: '点击揭示', timeElapsed: '时间: {seconds}秒', verseComplete: '经文已记住! ✨', nextReview: '下次提醒: {days}天后' },
  review: { todayReviews: '今日复习', overdue: '逾期', dueSoon: '即将到期', totalDue: '{count}待复习', estimatedTime: '~{minutes}分钟', startReview: '开始复习', iRecalled: '我回忆起来了', almost: '差不多', forgot: '忘记了', correct: '正确!', summary: '复习总结', easy: '简单', hard: '困难' },
  progress: { yourProgress: '你的进度', versesMemorized: '已背诵{count}节', inProgress: '进行中', toReview: '待复习', streak: '连续天数', retention: '保留率', thisWeek: '本周', recentVerses: '最近经文', needsStrengthening: '需要加强', mastered: '已掌握' },
  settings: { settings: '设置', uiLanguage: '界面语言', bibleTranslation: '圣经译本', theme: '主题', light: '浅色', dark: '深色', dataManagement: '数据与存储', storageUsed: '存储空间', exportData: '导出数据', about: '关于', version: '版本', documentation: '文档', resetProgress: '重置所有进度', resetConfirmTitle: '你确定吗?', resetConfirmText: '这将删除所有你背诵的经文和历史记录。', typeConfirm: '输入 SUPPRIMER 确认' },
  errors: { translationReset: '译本重置为LSG', verseNotFound: '此译本中不可用该节', wasmFailed: '复习引擎已禁用。简化算法已激活。', databaseCorrupt: '数据库损坏。正在恢复备份...', unknownError: '发生意外错误' },
} as const;
