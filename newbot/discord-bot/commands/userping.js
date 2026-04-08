const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pingを表示'),

    async execute(interaction) {
        const sent = await interaction.reply({
            content: '測定中...',
            fetchReply: true
        });

        const messagePing = sent.createdTimestamp - interaction.createdTimestamp;
        const apiPing = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📨 メッセージPing', value: `${messagePing}ms`, inline: true },
                { name: '🌐 API Ping', value: `${apiPing}ms`, inline: true }
            )
            .setColor(0x00ff99);

        await interaction.editReply({
            content: '',
            embeds: [embed]
        });
    }
};