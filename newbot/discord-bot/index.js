const fs = require('fs');
const path = require('path');
const {
    Client,
    GatewayIntentBits,
    Collection,
    MessageFlags,
    EmbedBuilder,
    ChannelType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

function getAnonFilePath() {
    return path.join(__dirname, 'data', 'anonThreads.json');
}

function loadAnonThreads() {
    const anonFile = getAnonFilePath();

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
    fs.writeFileSync(getAnonFilePath(), JSON.stringify(data, null, 2));
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('コマンド実行エラー:', error);

        if (error.code === 10062 || error.code === 40060) {
            return;
        }

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'エラー発生',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'エラー発生',
                    flags: MessageFlags.Ephemeral
                });
            }
        } catch (replyError) {
            console.error('エラー通知にも失敗:', replyError);
        }
    }
});

client.on('messageCreate', async message => {
    try {
        if (!message.guild) return;
        if (message.author.bot) return;
        if (message.system) return;

        const channel = message.channel;
        if (!channel || channel.type !== ChannelType.PublicThread) return;

        const anonThreads = loadAnonThreads();
        const threadData = anonThreads[channel.id];
        if (!threadData) return;

        // 匿名スレッドの通常発言を強制匿名化
        threadData.counter = (threadData.counter || 0) + 1;
        const number = threadData.counter;

        let content = message.content?.trim() || '';

        // 返信先がある場合、返信先番号をできるだけ特定
        let replyHeader = '';
        if (message.reference?.messageId) {
            try {
                const referencedMessage = await channel.messages.fetch(message.reference.messageId).catch(() => null);

                if (referencedMessage && referencedMessage.embeds?.length > 0) {
                    const title = referencedMessage.embeds[0].title || '';
                    const match = title.match(/#(\d+)/);

                    if (match) {
                        const replyToNumber = match[1];
                        replyHeader = `>>> #${replyToNumber} への返信\n\n`;
                    }
                }
            } catch (error) {
                console.error('返信先取得失敗:', error);
            }
        }

        // 添付ファイルも本文に追加
        if (message.attachments.size > 0) {
            const files = [];
            for (const attachment of message.attachments.values()) {
                files.push(attachment.url);
            }

            if (content.length > 0) {
                content += '\n\n';
            }
            content += `添付:\n${files.join('\n')}`;
        }

        if (!content) {
            content = '（内容なし）';
        }

        const embed = new EmbedBuilder()
            .setTitle(`匿名メッセージ #${number}`)
            .setDescription(`${replyHeader}${content}`)
            .setColor(0x808080)
            .setFooter({ text: '送信者は匿名です' })
            .setTimestamp();

        // 元メッセージを削除
        await message.delete().catch(error => {
            console.error('元メッセージ削除失敗:', error);
        });

        // 匿名として再投稿
        const sent = await channel.send({
            embeds: [embed]
        });

        threadData.messages = threadData.messages || {};
        threadData.messages[number] = {
            messageId: sent.id,
            createdAt: Date.now(),
            originalAuthorId: message.author.id,
            type: message.reference?.messageId ? 'reply' : 'post'
        };

        anonThreads[channel.id] = threadData;
        saveAnonThreads(anonThreads);

    } catch (error) {
        console.error('匿名自動変換エラー:', error);
    }
});

client.once('clientReady', () => {
    console.log(`${client.user.tag} でログインしました`);
});

process.on('unhandledRejection', error => {
    console.error('未処理のPromiseエラー:', error);
});

client.login('your');