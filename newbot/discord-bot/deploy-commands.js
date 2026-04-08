console.log('deploy-commands.js 開始');

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('見つかったファイル:', commandFiles);

for (const file of commandFiles) {
    console.log(`読み込み中: ${file}`);

    const command = require(`./commands/${file}`);
    console.log('中身:', command);

    if (!command.data) {
        console.log(`エラー: ${file} に data がありません`);
        continue;
    }

    if (typeof command.data.toJSON !== 'function') {
        console.log(`エラー: ${file} の data に toJSON() がありません`);
        continue;
    }

    commands.push(command.data.toJSON());
}

console.log('登録するコマンド:', commands);

const rest = new REST({ version: '10' }).setToken('your');

(async () => {
    try {
        console.log('登録中...');

        await rest.put(
            Routes.applicationCommands('1491031330677456896'),
            { body: commands },
        );

        console.log('登録完了');
    } catch (error) {
        console.error(error);
    }
})();