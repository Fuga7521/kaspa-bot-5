const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inviteinfo')
        .setDescription('招待リンクと複数画像＋メンション')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('メンションするユーザー')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('メンションするロール')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option
                .setName('everyone')
                .setDescription('@everyoneで通知する')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const inviteURL = 'https://discord.gg/mpbwzyxf';

        const images = [
            'https://art.ngfiles.com/images/2219000/2219227_charlesloq_awesome-face-gif.gif?f1638502836',
            'https://art.pixilart.com/sr20c8789dc28aws3.gif'
        ];

        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const everyone = interaction.options.getBoolean('everyone');

        let mentionText = '';

        if (everyone === true) {
            mentionText = '@everyone ';
        } else if (role) {
            mentionText = `<@&${role.id}> `;
        } else if (user) {
            mentionText = `<@${user.id}> `;
        }

        const mainEmbed = new EmbedBuilder()
            .setTitle('サーバー招待')
            .setDescription('ここから参加できるよ')
            .addFields({
                name: '招待リンク',
                value: `[参加する](${inviteURL})`
            })
            .setImage(images[0]);

        const extraEmbeds = images.slice(1).map((img, i) =>
            new EmbedBuilder()
                .setTitle(`画像 ${i + 2}`)
                .setImage(img)
        );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('参加する')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteURL)
        );

        const allowedMentions = {
            parse: []
        };

        if (everyone === true) allowedMentions.parse.push('everyone');
        if (role) allowedMentions.roles = [role.id];
        if (user) allowedMentions.users = [user.id];

        await interaction.editReply({
            content: `${mentionText}やっほー`,
            embeds: [mainEmbed, ...extraEmbeds],
            components: [row],
            allowedMentions
        });
    }
};