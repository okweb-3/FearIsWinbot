const axios = require('axios');
const config = require('./config');

/**
 * 获取美股恐惧贪婪指数
 */
async function getStockFearGreedIndex() {
    try {
        const response = await axios.get(config.STOCK_FEAR_GREED_API, {
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
        console.error('获取美股恐惧贪婪指数失败:', error.message);
        throw new Error('无法获取美股数据，请稍后重试');
    }
}

/**
 * 获取加密市场恐惧贪婪指数（修复版）
 */
async function getCryptoFearGreedIndex() {
    try {
        const response = await axios.get(config.CRYPTO_FEAR_GREED_API, {
            params: { limit: 30 },
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const data = response.data.data;

        // 安全获取数据，避免 undefined
        const current = data[0];
        const yesterday = data[1] || null;
        const lastWeek = data[7] || null;
        const lastMonth = data[29] || null;

        // 安全解析数值
        const currentScore = parseInt(current.value);
        const yesterdayScore = yesterday ? parseInt(yesterday.value) : currentScore;
        const lastWeekScore = lastWeek ? parseInt(lastWeek.value) : currentScore;
        const lastMonthScore = lastMonth ? parseInt(lastMonth.value) : currentScore;

        return {
            score: currentScore,
            rating: current.value_classification,
            previousClose: yesterdayScore,
            previousWeek: lastWeekScore,
            previousMonth: lastMonthScore,
            timestamp: new Date(parseInt(current.timestamp) * 1000).toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    } catch (error) {
        console.error('获取加密恐惧贪婪指数失败:', error.message);
        throw new Error('无法获取加密数据，请稍后重试');
    }
}

/**
 * 格式化指数等级 Emoji（美股）
 */
function getStockRatingEmoji(rating) {
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
 * 格式化指数等级 Emoji（加密）
 */
function getCryptoRatingEmoji(rating) {
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
 * 生成美股推送消息
 */
function formatStockMessage(data) {
    const emoji = getStockRatingEmoji(data.rating);
    const ratingCN = getRatingChinese(data.rating);

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
🔗 数据来源：CNN Fear & Greed Index
`.trim();
}

/**
 * 生成加密市场推送消息
 */
function formatCryptoMessage(data) {
    const emoji = getCryptoRatingEmoji(data.rating);
    const ratingCN = getRatingChinese(data.rating);

    const changeFromYesterday = data.score - data.previousClose;
    const changeFromWeek = data.score - data.previousWeek;
    const changeFromMonth = data.score - data.previousMonth;

    const changeEmoji = (val) => val >= 0 ? '📈' : '📉';

    return `
₿ <b>加密市场恐惧贪婪指数</b>

${emoji} <b>当前指数：${data.score}</b>
💭 情绪状态：<b>${ratingCN}</b> (${data.rating})

━━━━━━━━━━━━━━━━
📈 <b>历史对比</b>

${changeEmoji(changeFromYesterday)} 较昨日：${changeFromYesterday > 0 ? '+' : ''}${changeFromYesterday} (${data.previousClose})
${changeEmoji(changeFromWeek)} 较上周：${changeFromWeek > 0 ? '+' : ''}${changeFromWeek} (${data.previousWeek})
${changeEmoji(changeFromMonth)} 较上月：${changeFromMonth > 0 ? '+' : ''}${changeFromMonth} (${data.previousMonth})

━━━━━━━━━━━━━━━━
🕐 更新时间：${data.timestamp}
🔗 数据来源：Alternative.me
`.trim();
}

/**
 * 生成合并消息（美股+加密）
 */
function formatBothMessage(stockData, cryptoData) {
    const stockEmoji = getStockRatingEmoji(stockData.rating);
    const cryptoEmoji = getCryptoRatingEmoji(cryptoData.rating);
    const stockRatingCN = getRatingChinese(stockData.rating);
    const cryptoRatingCN = getRatingChinese(cryptoData.rating);

    return `
📊 <b>美股恐惧贪婪指数</b>
${stockEmoji} 当前：<b>${stockData.score}</b> | ${stockRatingCN}

₿ <b>加密恐惧贪婪指数</b>
${cryptoEmoji} 当前：<b>${cryptoData.score}</b> | ${cryptoRatingCN}

━━━━━━━━━━━━━━━━
📊 <b>美股历史对比</b>
昨日：${stockData.previousClose} | 上周：${stockData.previousWeek} | 上月：${stockData.previousMonth}

₿ <b>加密历史对比</b>
昨日：${cryptoData.previousClose} | 上周：${cryptoData.previousWeek} | 上月：${cryptoData.previousMonth}

━━━━━━━━━━━━━━━━
🕐 更新时间：${stockData.timestamp}

<i>使用 /stock 查看美股详情
使用 /crypto 查看加密详情</i>
`.trim();
}

module.exports = {
    getStockFearGreedIndex,
    getCryptoFearGreedIndex,
    formatStockMessage,
    formatCryptoMessage,
    formatBothMessage,
    getRatingChinese,
    getStockRatingEmoji,
    getCryptoRatingEmoji
};
