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

    // CNN 美股恐惧贪婪指数 API
    STOCK_FEAR_GREED_API: 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata/',

    // Alternative.me 加密恐惧贪婪指数 API
    CRYPTO_FEAR_GREED_API: 'https://api.alternative.me/fng/',

    // 时区设置
    TIMEZONE: 'Asia/Shanghai'
};
