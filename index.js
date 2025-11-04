const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const config = require('./config');
const {
    getStockFearGreedIndex,
    getCryptoFearGreedIndex,
    formatStockMessage,
    formatCryptoMessage,
    formatBothMessage
} = require('./fearGreedAPI');

// 创建机器人实例
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 机器人已启动...');

/**
 * 发送美股恐惧贪婪指数
 */
async function sendStockIndex(chatId, isManual = false) {
    try {
        const data = await getStockFearGreedIndex();
        const message = formatStockMessage(data);
        const prefix = isManual ? '📱 <b>手动查询</b>\n\n' : '';

        await bot.sendMessage(chatId, prefix + message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });

        console.log(`✅ 美股指数已发送 ${isManual ? '(手动)' : '(定时)'} - ${new Date().toLocaleString('zh-CN')}`);
    } catch (error) {
        console.error('❌ 发送美股指数失败:', error.message);
        await bot.sendMessage(chatId,
            `⚠️ 获取美股数据失败\n\n错误：${error.message}`,
            { parse_mode: 'HTML' }
        );
    }
}

/**
 * 发送加密市场恐惧贪婪指数
 */
async function sendCryptoIndex(chatId, isManual = false) {
    try {
        const data = await getCryptoFearGreedIndex();
        const message = formatCryptoMessage(data);
        const prefix = isManual ? '📱 <b>手动查询</b>\n\n' : '';

        await bot.sendMessage(chatId, prefix + message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });

        console.log(`✅ 加密指数已发送 ${isManual ? '(手动)' : '(定时)'} - ${new Date().toLocaleString('zh-CN')}`);
    } catch (error) {
        console.error('❌ 发送加密指数失败:', error.message);
        await bot.sendMessage(chatId,
            `⚠️ 获取加密数据失败\n\n错误：${error.message}`,
            { parse_mode: 'HTML' }
        );
    }
}

/**
 * 发送合并指数（美股+加密）
 */
async function sendBothIndexes(chatId, isManual = false) {
    try {
        const [stockData, cryptoData] = await Promise.all([
            getStockFearGreedIndex(),
            getCryptoFearGreedIndex()
        ]);

        const message = formatBothMessage(stockData, cryptoData);
        const prefix = isManual ? '📱 <b>手动查询</b>\n\n' : '';

        await bot.sendMessage(chatId, prefix + message, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });

        console.log(`✅ 合并指数已发送 ${isManual ? '(手动)' : '(定时)'} - ${new Date().toLocaleString('zh-CN')}`);
    } catch (error) {
        console.error('❌ 发送合并指数失败:', error.message);
        await bot.sendMessage(chatId,
            `⚠️ 获取数据失败\n\n错误：${error.message}`,
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
👋 欢迎使用恐惧贪婪指数机器人！

📊 <b>功能介绍：</b>
• 每天 9:00 和 21:00 自动推送
• 支持美股和加密市场指数
• 多种查询命令

🔔 <b>可用命令：</b>
/stock - 查询美股指数 📊
/crypto - 查询加密指数 ₿
/both - 同时查看两个市场 📊₿
/help - 查看帮助信息

🕐 <b>推送时间：</b>
• 上午：09:00
• 晚上：21:00

💡 立即输入命令开始查询！
`.trim();

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

/**
 * 命令：/stock（查询美股指数）
 */
bot.onText(/\/stock/, async (msg) => {
    const chatId = msg.chat.id;
    const waitMsg = await bot.sendMessage(chatId, '⏳ 正在查询美股指数...');

    try {
        await sendStockIndex(chatId, true);
        await bot.deleteMessage(chatId, waitMsg.message_id);
    } catch (error) {
        await bot.deleteMessage(chatId, waitMsg.message_id);
    }
});

/**
 * 命令：/crypto（查询加密指数）
 */
bot.onText(/\/crypto/, async (msg) => {
    const chatId = msg.chat.id;
    const waitMsg = await bot.sendMessage(chatId, '⏳ 正在查询加密指数...');

    try {
        await sendCryptoIndex(chatId, true);
        await bot.deleteMessage(chatId, waitMsg.message_id);
    } catch (error) {
        await bot.deleteMessage(chatId, waitMsg.message_id);
    }
});

/**
 * 命令：/both（同时查询两个市场）
 */
bot.onText(/\/both/, async (msg) => {
    const chatId = msg.chat.id;
    const waitMsg = await bot.sendMessage(chatId, '⏳ 正在查询两个市场数据...');

    try {
        await sendBothIndexes(chatId, true);
        await bot.deleteMessage(chatId, waitMsg.message_id);
    } catch (error) {
        await bot.deleteMessage(chatId, waitMsg.message_id);
    }
});

/**
 * 命令：/check（兼容旧版本，默认查询美股）
 */
bot.onText(/\/check/, async (msg) => {
    const chatId = msg.chat.id;
    const waitMsg = await bot.sendMessage(chatId, '⏳ 正在查询美股指数...');

    try {
        await sendStockIndex(chatId, true);
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

<b>📊 查询命令：</b>
/stock - 查询美股恐惧贪婪指数
/crypto - 查询加密市场恐惧贪婪指数
/both - 同时查看两个市场
/check - 查询美股指数（兼容旧版）

<b>⚙️ 其他命令：</b>
/start - 启动机器人
/help - 查看此帮助信息

<b>🔔 自动推送：</b>
机器人会在每天 9:00 和 21:00 自动推送美股和加密市场指数。

<b>📊 指数说明：</b>
• 0-25：极度恐惧 😱
• 26-45：恐惧 😰
• 46-55：中性 😐
• 56-75：贪婪 😃
• 76-100：极度贪婪 🤑

<b>🔗 数据来源：</b>
• 美股：CNN Fear & Greed Index
• 加密：Alternative.me Crypto Index

💡 提示：指数仅供参考，投资需谨慎！
`.trim();

    bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
    });
});

/**
 * 定时任务：每天 9:00 推送（美股+加密）
 */
cron.schedule(config.PUSH_SCHEDULE.morning, async () => {
    console.log('⏰ 触发早间定时推送...');
    await sendBothIndexes(config.TELEGRAM_CHAT_ID, false);
}, {
    timezone: config.TIMEZONE
});

/**
 * 定时任务：每天 21:00 推送（美股+加密）
 */
cron.schedule(config.PUSH_SCHEDULE.evening, async () => {
    console.log('⏰ 触发晚间定时推送...');
    await sendBothIndexes(config.TELEGRAM_CHAT_ID, false);
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
console.log('📊 支持：美股 + 加密市场');
