const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('ユーザー情報を表示します')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('情報を見たいユーザー')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('target') || interaction.user;

        let member = null;
        if (interaction.guild) {
            member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        }

        const usernameText = targetUser.username || '不明';
        const globalNameText = targetUser.globalName || 'なし';
        const displayNameText = member?.displayName || globalNameText || usernameText;
        const createdText = targetUser.createdTimestamp
            ? `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`
            : '取得できません';
        const joinedText = member?.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
            : '取得できません';

        const embed = new EmbedBuilder()
            .setTitle('ユーザー情報')
            .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
            .addFields(
                { name: 'ユーザー名', value: usernameText, inline: true },
                { name: '表示名', value: displayNameText, inline: true },
                { name: 'グローバル表示名', value: globalNameText, inline: true },
                { name: 'ユーザーID', value: targetUser.id, inline: false },
                { name: 'Botかどうか', value: targetUser.bot ? 'はい' : 'いいえ', inline: true },
                { name: 'アカウント作成日', value: createdText, inline: false },
                { name: 'サーバー参加日', value: joinedText, inline: false }
            )
            .setColor(0x5865F2);

        await interaction.editReply({ embeds: [embed] });
    }
};