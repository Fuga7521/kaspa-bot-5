const { SlashCommandBuilder } = require('discord.js');
const { getWeatherEmbed } = require('../utils/weatherHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('今日と明日の天気を表示します')
        .addStringOption(option =>
            option
                .setName('city')
                .setDescription('都市名（例: Tokyo）')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const city = interaction.options.getString('city') || 'Tokyo';

        try {
            const embed = await getWeatherEmbed(city);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('weather エラー:', error.response?.data || error.message);
            await interaction.editReply('天気の取得に失敗しました。都市名やAPIキーを確認してください。');
        }
    }
};