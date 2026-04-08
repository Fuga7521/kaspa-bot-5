const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const anonFile = path.join(__dirname, '..', 'data', 'anonThreads.json');

function loadAnonThreads() {
    if (!fs.existsSync(anonFile)) {
        fs.writeFileSync(anonFile, JSON.stringify({}, null, 2));
    }

    try {
        return JSON.parse(fs.readFileSync(anonFile, 'utf8') || '{}');
    } catch (error) {
        console.error('anonThreads.json 読み込みエラー:', error);
        return {};
    }
}

function saveAnonThreads(data) {
    fs.writeFileSync(anonFile, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anon')
        .setDescription('匿名スレッド管理コマンド')
        .setDMPermission(false)
        .addSubcommand(sub =>
            sub
                .setName('delete')
                .setDescription('番号を指定して匿名投稿を削除')
                .addIntegerOption(option =>
                    option
                        .setName('number')
                        .setDescription('削除したい番号')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'このコマンドはサーバー内専用です。',
                ephemeral: true
            });
            return;
        }

        const thread = interaction.channel;
        if (!thread || thread.type !== ChannelType.PublicThread) {
            await interaction.reply({
                content: 'このコマンドは匿名スレッド内で使ってください。',
                ephemeral: true
            });
            return;
        }

        const anonThreads = loadAnonThreads();
        if (!anonThreads[thread.id]) {
            await interaction.reply({
                content: 'このスレッドは匿名スレッドではありません。',
                ephemeral: true
            });
            return;
        }

        const number = interaction.options.getInteger('number');
        const targetData = anonThreads[thread.id].messages?.[number];

        if (!targetData) {
            await interaction.reply({
                content: `番号 #${number} は存在しません。`,
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const targetMessage = await thread.messages.fetch(targetData.messageId).catch(() => null);
            if (targetMessage) {
                await targetMessage.delete().catch(() => null);
            }
        } catch (error) {
            console.error('匿名投稿削除エラー:', error);
        }

        delete anonThreads[thread.id].messages[number];
        saveAnonThreads(anonThreads);

        await interaction.editReply(`番号 #${number} を削除しました。`);
    }
};