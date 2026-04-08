const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

// ここは自分の新しいAPIキーに変える
const API_KEY = '405ba632b5785667071905c32c9265c3';

async function getWeatherEmbed(city = 'Tokyo') {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=ja`;

    const res = await axios.get(url);
    const list = res.data.list;

    const todayDate = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const today = list.find(item =>
        item.dt_txt.startsWith(todayDate) && item.dt_txt.includes('12:00:00')
    ) || list[0];

    const tomorrow = list.find(item =>
        item.dt_txt.startsWith(tomorrowDate) && item.dt_txt.includes('12:00:00')
    ) || list[8];

    const embed = new EmbedBuilder()
        .setTitle(`🌤 天気情報（${res.data.city.name}）`)
        .addFields(
            {
                name: '今日',
                value: `${today.weather[0].description}\n🌡 ${today.main.temp}°C`,
                inline: true
            },
            {
                name: '明日',
                value: `${tomorrow.weather[0].description}\n🌡 ${tomorrow.main.temp}°C`,
                inline: true
            }
        )
        .setColor(0x00AEFF);

    return embed;
}

module.exports = { getWeatherEmbed };