const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const schedulesFile = path.join(__dirname, '..', 'data', 'weatherSchedules.json');

function loadSchedules() {
    if (!fs.existsSync(schedulesFile)) {
        fs.writeFileSync(schedulesFile, JSON.stringify({}, null, 2));
    }

    try {
        return JSON.parse(fs.readFileSync(schedulesFile, 'utf8') || '{}');
    } catch (error) {
        console.error('weatherSchedules.json 読み込みエラー:', error);
        return {};
    }
}

function saveSchedules(data) {
    fs.writeFileSync(schedulesFile, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weatherdaily')
        .setDescription('毎日の天気自動投稿を設定します')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub
                .setName('start')
                .setDescription('毎日の天気自動投稿を開始')
                .addStringOption(option =>
                    option
                        .setName('city')
                        .setDescription('都市名（例: Tokyo）')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('hour')
                        .setDescription('投稿する時（0〜23）')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(23)
                )
                .addIntegerOption(option =>
                    option
                        .setName('minute')
                        .setDescription('投稿する分（0〜59）')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(59)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('stop')
                .setDescription('毎日の天気自動投稿を停止')
        )
        .setDMPermission(false),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({ content: 'このコマンドはサーバー内専用です。' });
            return;
        }

        const sub = interaction.options.getSubcommand();
        const schedules = loadSchedules();
        const guildId = interaction.guildId;

        if (sub === 'start') {
            const city = interaction.options.getString('city');
            const hour = interaction.options.getInteger('hour');
            const minute = interaction.options.getInteger('minute');

            schedules[guildId] = {
                channelId: interaction.channelId,
                city,
                hour,
                minute
            };

            saveSchedules(schedules);

            await interaction.reply(
                `毎日 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} に、このチャンネルで ${city} の天気を投稿するように設定しました。`
            );
            return;
        }

        if (sub === 'stop') {
            if (schedules[guildId]) {
                delete schedules[guildId];
                saveSchedules(schedules);
                await interaction.reply('このサーバーの毎日の天気投稿を停止しました。');
            } else {
                await interaction.reply('このサーバーには自動投稿設定がありません。');
            }
        }
    }
};