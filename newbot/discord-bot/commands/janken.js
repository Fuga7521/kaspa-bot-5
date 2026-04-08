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

function savePoints(points) {
    fs.writeFileSync(pointsFile, JSON.stringify(points, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('janken')
        .setDescription('Botとじゃんけんしてポイントを増減します')
        .addStringOption(option =>
            option
                .setName('hand')
                .setDescription('出す手を選んでね')
                .setRequired(true)
                .addChoices(
                    { name: 'グー', value: 'グー' },
                    { name: 'チョキ', value: 'チョキ' },
                    { name: 'パー', value: 'パー' }
                )
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

        const userHand = interaction.options.getString('hand');
        const botHands = ['グー', 'チョキ', 'パー'];
        const botHand = botHands[Math.floor(Math.random() * botHands.length)];

        let result = '';
        let pointChange = 0;

        if (userHand === botHand) {
            result = 'あいこ';
            pointChange = 0;
        } else if (
            (userHand === 'グー' && botHand === 'チョキ') ||
            (userHand === 'チョキ' && botHand === 'パー') ||
            (userHand === 'パー' && botHand === 'グー')
        ) {
            result = '勝ち';
            pointChange = 10;
        } else {
            result = '負け';
            pointChange = -5;
        }

        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        const points = loadPoints();

        if (!points[guildId]) {
            points[guildId] = {};
        }

        if (typeof points[guildId][userId] !== 'number') {
            points[guildId][userId] = 0;
        }

        points[guildId][userId] += pointChange;

        if (points[guildId][userId] < 0) {
            points[guildId][userId] = 0;
        }

        savePoints(points);

        const currentPoints = points[guildId][userId];

        const embed = new EmbedBuilder()
            .setTitle('✊ じゃんけん結果')
            .addFields(
                { name: 'あなたの手', value: userHand, inline: true },
                { name: 'Botの手', value: botHand, inline: true },
                { name: '結果', value: result, inline: true },
                { name: 'ポイント変動', value: `${pointChange >= 0 ? '+' : ''}${pointChange}`, inline: true },
                { name: '現在のポイント', value: `${currentPoints}`, inline: true }
            );

        await interaction.editReply({
            content: `${interaction.user} じゃんけんの結果だよ！`,
            embeds: [embed]
        });
    }
};