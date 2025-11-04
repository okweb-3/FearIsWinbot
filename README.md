# 🤖 美股恐惧贪婪指数 Telegram 推送机器人

完整的 Node.js 项目 - 每天 9:00 和 21:00 自动推送，支持手动触发
纯AI生成，没有一行代码是自己写的

## ✨ 功能特点

- ✅ **定时推送** - 每天 9:00 和 21:00 自动推送
- ✅ **手动触发** - 使用 /check 命令立即查询
- ✅ **历史对比** - 显示昨日、上周、上月数据
- ✅ **免费 API** - 使用 CNN 官方接口

---

## 📋 项目结构

```
fear-greed-tg-bot/
├── index.js          # 主程序入口
├── config.js         # 配置文件
├── fearGreedAPI.js   # 恐惧贪婪指数 API
├── package.json      # 依赖配置
├── .env              # 环境变量（需要创建）
└── README.md         # 说明文档
```

---

## 📦 1. package.json

```json
{
  "name": "fear-greed-tg-bot",
  "version": "1.0.0",
  "description": "美股恐惧贪婪指数 Telegram 推送机器人",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "keywords": ["telegram", "bot", "fear-greed-index", "stock-market"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "node-telegram-bot-api": "^0.66.0",
    "node-cron": "^3.0.3",
    "axios": "^1.7.7",
    "dotenv": "^16.4.5"
  }
}
```

---

## ⚙️ 2. config.js

```javascript
require('dotenv').config();

module.exports = {
  // Telegram 机器人 Token（从 @BotFather 获取）
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  
  // 你的 Telegram 用户 ID（从 @userinfobot 获取）
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  
  // 推送时间设置（使用 cron 表达式）
  PUSH_SCHEDULE: {
    morning: '0 9 * * *',    // 每天 9:00
    evening: '0 21 * * *'    // 每天 21:00
  },
  
  // CNN 恐惧贪婪指数 API
  FEAR_GREED_API: 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata/',
  
  // 时区设置
  TIMEZONE: 'Asia/Shanghai'
};
```

---

## 🔌 3. fearGreedAPI.js

```javascript
const axios = require('axios');
const config = require('./config');

/**
 * 获取恐惧贪婪指数
 */
async function getFearGreedIndex() {
  try {
    const response = await axios.get(config.FEAR_GREED_API, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;
    const fg = data.fear_and_greed;

    return {
      score: fg.score,
      rating: fg.rating,
      previousClose: fg.previous_close,
      previousWeek: fg.previous_1_week,
      previousMonth: fg.previous_1_month,
      previousYear: fg.previous_1_year,
      timestamp: new Date(fg.timestamp).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  } catch (error) {
    console.error('获取恐惧贪婪指数失败:', error.message);
    throw new Error('无法获取数据，请稍后重试');
  }
}

/**
 * 格式化指数等级为中文
 */
function getRatingEmoji(rating) {
  const emojiMap = {
    'Extreme Fear': '😱',
    'Fear': '😰',
    'Neutral': '😐',
    'Greed': '😃',
    'Extreme Greed': '🤑'
  };
  return emojiMap[rating] || '❓';
}

/**
 * 格式化指数等级为中文
 */
function getRatingChinese(rating) {
  const chineseMap = {
    'Extreme Fear': '极度恐惧',
    'Fear': '恐惧',
    'Neutral': '中性',
    'Greed': '贪婪',
    'Extreme Greed': '极度贪婪'
  };
  return chineseMap[rating] || rating;
}

/**
 * 生成推送消息
 */
function formatMessage(data) {
  const emoji = getRatingEmoji(data.rating);
  const ratingCN = getRatingChinese(data.rating);
  
  // 计算变化
  const changeFromYesterday = (data.score - data.previousClose).toFixed(1);
  const changeFromWeek = (data.score - data.previousWeek).toFixed(1);
  const changeFromMonth = (data.score - data.previousMonth).toFixed(1);
  
  const changeEmoji = (val) => val >= 0 ? '📈' : '📉';

  return `
📊 <b>美股恐惧贪婪指数</b>

${emoji} <b>当前指数：${data.score}</b>
💭 情绪状态：<b>${ratingCN}</b> (${data.rating})

━━━━━━━━━━━━━━━━
📈 <b>历史对比</b>

${changeEmoji(changeFromYesterday)} 较昨日：${changeFromYesterday > 0 ? '+' : ''}${changeFromYesterday} (${data.previousClose})
${changeEmoji(changeFromWeek)} 较上周：${changeFromWeek > 0 ? '+' : ''}${changeFromWeek} (${data.previousWeek})
${changeEmoji(changeFromMonth)} 较上月：${changeFromMonth > 0 ? '+' : ''}${changeFromMonth} (${data.previousMonth})

━━━━━━━━━━━━━━━━
🕐 更新时间：${data.timestamp}

<i>指数说明：
0-25：极度恐惧 😱
26-45：恐惧 😰
46-55：中性 😐
56-75：贪婪 😃
76-100：极度贪婪 🤑</i>
`.trim();
}

module.exports = {
  getFearGreedIndex,
  formatMessage,
  getRatingChinese,
  getRatingEmoji
};
```

---

## 🤖 4. index.js (主程序)

```javascript
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const config = require('./config');
const { getFearGreedIndex, formatMessage } = require('./fearGreedAPI');

// 创建机器人实例
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 机器人已启动...');

/**
 * 发送恐惧贪婪指数
 */
async function sendFearGreedIndex(chatId, isManual = false) {
  try {
    const data = await getFearGreedIndex();
    const message = formatMessage(data);
    
    const prefix = isManual ? '📱 <b>手动查询</b>\n\n' : '';
    
    await bot.sendMessage(chatId, prefix + message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    
    console.log(`✅ 消息已发送 ${isManual ? '(手动触发)' : '(定时推送)'} - ${new Date().toLocaleString('zh-CN')}`);
  } catch (error) {
    console.error('❌ 发送失败:', error.message);
    
    await bot.sendMessage(chatId, 
      `⚠️ 获取数据失败\n\n错误信息：${error.message}\n请稍后再试或联系管理员。`,
      { parse_mode: 'HTML' }
    );
  }
}

/**
 * 命令：/start
 */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
👋 欢迎使用美股恐惧贪婪指数机器人！

📊 <b>功能介绍：</b>
• 每天 9:00 和 21:00 自动推送最新指数
• 使用 /check 手动查询当前指数
• 使用 /help 查看帮助信息

🔔 <b>推送时间：</b>
• 上午：09:00
• 晚上：21:00

💡 <b>指数说明：</b>
恐惧贪婪指数由 CNN 提供，通过市场波动性、成交量、看涨看跌比等多个指标综合计算，反映市场情绪。

输入 /check 立即查看当前指数！
`.trim();

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

/**
 * 命令：/check (手动触发)
 */
bot.onText(/\/check/, async (msg) => {
  const chatId = msg.chat.id;
  
  // 发送"正在查询"提示
  const waitMsg = await bot.sendMessage(chatId, '⏳ 正在查询最新数据...');
  
  try {
    await sendFearGreedIndex(chatId, true);
    // 删除"正在查询"消息
    await bot.deleteMessage(chatId, waitMsg.message_id);
  } catch (error) {
    await bot.deleteMessage(chatId, waitMsg.message_id);
  }
});

/**
 * 命令：/help
 */
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📖 <b>使用说明</b>

<b>可用命令：</b>
/start - 启动机器人
/check - 立即查询当前指数
/help - 查看帮助信息

<b>自动推送：</b>
机器人会在每天 9:00 和 21:00 自动推送最新的恐惧贪婪指数。

<b>指数说明：</b>
• 0-25：极度恐惧 😱 - 投资者极度悲观
• 26-45：恐惧 😰 - 投资者较为悲观
• 46-55：中性 😐 - 市场情绪平稳
• 56-75：贪婪 😃 - 投资者较为乐观
• 76-100：极度贪婪 🤑 - 投资者极度乐观

<b>数据来源：</b>
CNN Fear & Greed Index
https://www.cnn.com/markets/fear-and-greed

💡 提示：指数仅供参考，投资需谨慎！
`.trim();

  bot.sendMessage(chatId, helpMessage, { 
    parse_mode: 'HTML',
    disable_web_page_preview: true 
  });
});

/**
 * 定时任务：每天 9:00 推送
 */
cron.schedule(config.PUSH_SCHEDULE.morning, () => {
  console.log('⏰ 触发早间定时推送...');
  sendFearGreedIndex(config.TELEGRAM_CHAT_ID);
}, {
  timezone: config.TIMEZONE
});

/**
 * 定时任务：每天 21:00 推送
 */
cron.schedule(config.PUSH_SCHEDULE.evening, () => {
  console.log('⏰ 触发晚间定时推送...');
  sendFearGreedIndex(config.TELEGRAM_CHAT_ID);
}, {
  timezone: config.TIMEZONE
});

// 错误处理
bot.on('polling_error', (error) => {
  console.error('❌ Polling 错误:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理的 Promise 错误:', error);
});

console.log('✅ 定时任务已设置');
console.log(`📅 推送时间：上午 9:00 和 晚上 21:00 (${config.TIMEZONE})`);
console.log(`📱 目标用户 ID：${config.TELEGRAM_CHAT_ID}`);
```

---

## 🔐 5. .env 文件

```env
# Telegram 机器人 Token（从 @BotFather 获取）
TELEGRAM_BOT_TOKEN=your_bot_token_here

# 你的 Telegram 用户 ID（从 @userinfobot 获取）
TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## 🚀 部署步骤

### 步骤 1：创建 Telegram 机器人

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 命令
3. 按提示设置机器人名称和用户名
4. 复制获得的 **Token**（形如：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 步骤 2：获取你的 Chat ID

1. 在 Telegram 中搜索 `@userinfobot`
2. 向它发送任意消息
3. 复制返回的 **Id**（纯数字，如：`123456789`）

### 步骤 3：本地部署

1. 创建项目文件夹并进入：
   ```bash
   mkdir fear-greed-tg-bot && cd fear-greed-tg-bot
   ```

2. 创建上述所有文件（复制代码到对应文件）

3. 编辑 `.env` 文件，填入你的 Token 和 Chat ID

4. 安装依赖：
   ```bash
   npm install
   ```

5. 启动机器人：
   ```bash
   npm start
   ```

### ✅ 成功标志

看到以下输出表示启动成功：

```
🤖 机器人已启动...
✅ 定时任务已设置
📅 推送时间：上午 9:00 和 晚上 21:00 (Asia/Shanghai)
📱 目标用户 ID：你的ID
```

---

## ☁️ 云端部署方案

### 方案 1：Railway (推荐)

1. 访问 [railway.app](https://railway.app) 并登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 上传你的代码到 GitHub 仓库
4. 在 Railway 中添加环境变量（Variables）：
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
5. Railway 会自动部署并保持运行

### 方案 2：自己的 VPS 服务器

1. 上传代码到服务器
2. 安装 Node.js 和 npm
3. 使用 PM2 保持进程运行：
   ```bash
   npm install -g pm2
   pm2 start index.js --name fear-greed-bot
   pm2 save
   pm2 startup
   ```

---

## 📱 使用方法

| 命令 | 功能 | 说明 |
|------|------|------|
| `/start` | 启动机器人 | 查看欢迎信息和功能介绍 |
| `/check` | 手动查询 | 立即获取当前恐惧贪婪指数 |
| `/help` | 帮助信息 | 查看详细使用说明 |
| 自动推送 | 定时推送 | 每天 9:00 和 21:00 自动发送 |

---

## 🔧 自定义配置

### 修改推送时间

编辑 `config.js` 中的 `PUSH_SCHEDULE`：

```javascript
PUSH_SCHEDULE: {
  morning: '0 9 * * *',    // 每天 9:00
  afternoon: '0 15 * * *', // 每天 15:00（新增）
  evening: '0 21 * * *'    // 每天 21:00
}
```

**Cron 表达式说明：**

- `0 9 * * *` = 每天 9:00
- `0 */6 * * *` = 每 6 小时一次
- `0 9,21 * * *` = 每天 9:00 和 21:00
- `0 9 * * 1-5` = 工作日 9:00

### 添加更多定时任务

在 `index.js` 中添加新的 cron 任务：

```javascript
cron.schedule('0 15 * * *', () => {
  console.log('⏰ 触发下午定时推送...');
  sendFearGreedIndex(config.TELEGRAM_CHAT_ID);
}, {
  timezone: config.TIMEZONE
});
```

---

## ⚠️ 常见问题

### 问题 1：机器人无响应

**解决方法：**
- 检查 Token 是否正确
- 确保机器人程序正在运行
- 在 Telegram 中向机器人发送 `/start`

### 问题 2：收不到定时推送

**解决方法：**
- 确认 `TELEGRAM_CHAT_ID` 正确
- 检查服务器时区设置是否为 `Asia/Shanghai`
- 查看控制台日志确认定时任务是否执行

### 问题 3：获取数据失败

**解决方法：**
- 检查网络连接
- CNN API 可能临时不可用，稍后重试
- 查看错误日志获取详细信息

---

## 📊 推送效果预览

**定时推送消息示例：**

```
📊 美股恐惧贪婪指数

😰 当前指数：42
💭 情绪状态：恐惧 (Fear)

━━━━━━━━━━━━━━━━
📈 历史对比

📉 较昨日：-3.2 (45.2)
📉 较上周：-5.8 (47.8)
📈 较上月：+2.1 (39.9)

━━━━━━━━━━━━━━━━
🕐 更新时间：2025-11-04 09:00

指数说明：
0-25：极度恐惧 😱
26-45：恐惧 😰
46-55：中性 😐
56-75：贪婪 😃
76-100：极度贪婪 🤑
```

---

## 🎯 总结

### ✅ 已实现功能
- 每天 9:00 和 21:00 自动推送
- /check 命令手动触发
- 历史数据对比
- 完整的错误处理

### 📦 项目特点
- 纯 JavaScript 实现
- 免费 CNN 官方 API
- 无需数据库
- 易于部署和维护

### 🚀 部署选项
- 本地运行
- Railway 云端部署
- VPS 服务器部署
- 支持 PM2 进程管理

### 🔧 可扩展性
- 易于添加新功能
- 支持多个推送时间
- 可自定义消息格式
- 可添加更多命令

---

## 🎉 项目完成！

现在你可以：

1. 复制上述所有代码文件
2. 按照部署步骤配置机器人
3. 享受自动推送服务

**祝你使用愉快！如有问题，可以随时询问。**