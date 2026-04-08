const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinstalltesting')
        .setDescription('User install testing'),
    async execute(interaction) {
        await interaction.reply('テスト成功');
    }
};