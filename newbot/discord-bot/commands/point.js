const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const pointsFile = path.join(__dirname, '..', 'data', 'points.json');

function loadPoints() {
    if (!fs.existsSync(pointsFile)) {
        fs.writeFileSync(pointsFile, JSON.stringify({}, null, 2));
    }

    try {
        const data = fs.readFileSync(pointsFile, 'utf8');
        return JSON.parse(data || '{}');
    } catch (error) {
        console.error('points.json 読み込みエラー:', error);
        return {};
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('point')
        .setDescription('現在のポイントを表示します')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('ポイントを見たいユーザー')
                .setRequired(false)
        )
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'このコマンドはサーバー内でだけ使えます。'
            });
            return;
        }

        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guildId;
        const userId = targetUser.id;

        const points = loadPoints();

        let currentPoints = 0;
        if (points[guildId] && typeof points[guildId][userId] === 'number') {
            currentPoints = points[guildId][userId];
        }

        const embed = new EmbedBuilder()
            .setTitle('💰 ポイント情報')
            .setDescription(`${targetUser} の現在ポイント`)
            .addFields({
                name: 'ポイント',
                value: `${currentPoints}`,
                inline: true
            });

        await interaction.editReply({ embeds: [embed] });
    }
};