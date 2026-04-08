const {
    SlashCommandBuilder,
    ChannelType,
    PermissionFlagsBits
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
        .setName('anonthread')
        .setDescription('匿名チャットスレッドを管理します')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads)
        .addSubcommand(sub =>
            sub
                .setName('create')
                .setDescription('匿名チャットスレッドを作成')
                .addStringOption(option =>
                    option
                        .setName('title')
                        .setDescription('スレッド名')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('close')
                .setDescription('現在の匿名スレッドを閉じる')
        )
        .addSubcommand(sub =>
            sub
                .setName('status')
                .setDescription('このスレッドが匿名スレッドか確認')
        ),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'このコマンドはサーバー内専用です。',
                ephemeral: true
            });
            return;
        }

        const anonThreads = loadAnonThreads();
        const sub = interaction.options.getSubcommand();

        if (sub === 'create') {
            await interaction.deferReply({ ephemeral: true });

            const title = interaction.options.getString('title');
            const parentChannel = interaction.channel;

            if (!parentChannel || !parentChannel.threads) {
                await interaction.editReply('このチャンネルではスレッドを作成できません。');
                return;
            }

            const thread = await parentChannel.threads.create({
                name: `匿名-${title}`,
                autoArchiveDuration: 1440,
                type: ChannelType.PublicThread,
                reason: `匿名スレッド作成 by ${interaction.user.tag}`
            });

            anonThreads[thread.id] = {
                guildId: interaction.guildId,
                parentChannelId: interaction.channelId,
                createdBy: interaction.user.id,
                createdAt: Date.now(),
                counter: 0,
                messages: {}
            };

            saveAnonThreads(anonThreads);

            await thread.send(
                'このスレッドは**強制匿名化スレッド**です。\n' +
                'ここで普通に送ったメッセージは、自動で匿名メッセージに変換されます。\n\n' +
                '使い方:\n' +
                '・普通にメッセージ送信 → 自動で匿名化\n' +
                '・画像添付 → 自動で匿名化\n' +
                '・返信 → できる範囲で返信先番号を表示\n' +
                '・削除: `/anon delete number:番号`\n' +
                '・終了: `/anonthread close`'
            );

            await interaction.editReply(`匿名スレッドを作成しました: <#${thread.id}>`);
            return;
        }

        if (sub === 'close') {
            await interaction.deferReply({ ephemeral: true });

            const thread = interaction.channel;

            if (!thread || thread.type !== ChannelType.PublicThread) {
                await interaction.editReply('このコマンドはスレッド内で使ってください。');
                return;
            }

            if (!anonThreads[thread.id]) {
                await interaction.editReply('このスレッドは匿名スレッドではありません。');
                return;
            }

            delete anonThreads[thread.id];
            saveAnonThreads(anonThreads);

            await interaction.editReply('匿名スレッドを閉じます。');
            await thread.send('この匿名スレッドは閉じられます。');
            await thread.setArchived(true, '匿名スレッドを閉鎖');
            return;
        }

        if (sub === 'status') {
            const thread = interaction.channel;

            if (!thread || thread.type !== ChannelType.PublicThread) {
                await interaction.reply({
                    content: 'このコマンドはスレッド内で使ってください。',
                    ephemeral: true
                });
                return;
            }

            if (!anonThreads[thread.id]) {
                await interaction.reply({
                    content: 'このスレッドは匿名スレッドではありません。',
                    ephemeral: true
                });
                return;
            }

            const info = anonThreads[thread.id];
            await interaction.reply({
                content:
                    `このスレッドは匿名スレッドです。\n` +
                    `現在の番号カウンター: ${info.counter}\n` +
                    `作成者: <@${info.createdBy}>`,
                ephemeral: true
            });
        }
    }
};