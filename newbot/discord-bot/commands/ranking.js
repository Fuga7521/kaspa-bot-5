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
        .setName('ranking')
        .setDescription('サーバー内のじゃんけんポイントランキングを表示します')
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'このコマンドはサーバー内でだけ使えます。'
            });
            return;
        }

        await interaction.deferReply();

        const guildId = interaction.guildId;
        const points = loadPoints();

        if (!points[guildId] || Object.keys(points[guildId]).length === 0) {
            await interaction.editReply('まだポイントデータがありません。');
            return;
        }

        const rankingData = Object.entries(points[guildId])
            .filter(([_, point]) => typeof point === 'number')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (rankingData.length === 0) {
            await interaction.editReply('まだポイントデータがありません。');
            return;
        }

        let description = '';

        for (let i = 0; i < rankingData.length; i++) {
            const [userId, point] = rankingData[i];

            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `#${i + 1}`;

            description += `${medal} <@${userId}> - **${point}ポイント**\n`;
        }

        const myRank =
            Object.entries(points[guildId])
                .filter(([_, point]) => typeof point === 'number')
                .sort((a, b) => b[1] - a[1])
                .findIndex(([userId]) => userId === interaction.user.id) + 1;

        const myPoint = points[guildId][interaction.user.id] ?? 0;

        const embed = new EmbedBuilder()
            .setTitle('🏆 サーバー内じゃんけんランキング')
            .setDescription(description)
            .addFields({
                name: 'あなたの順位',
                value: myRank > 0 ? `#${myRank} (${myPoint}ポイント)` : `圏外 (${myPoint}ポイント)`,
                inline: false
            })
            .setColor(0xFFD700);

        await interaction.editReply({ embeds: [embed] });
    }
};