/* eslint-disable no-negated-condition */
import { Message, MessageEmbed, PresenceStatus } from "discord.js";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";

@DefineCommand({
    name: "userinfo",
    aliases: ["infouser", "user", "useri", "uinfo", "ui"],
    info: {
        desc: "Show of Discord information for someone the user.",
        usage: "{prefix}userinfo [@user|userName|userId]",
        example: "{prefix}userinfo {userTag}\n{prefix}userinfo {userName}\n{prefix}userinfo {userId}\n{prefix}userinfo"
    }
})
export class UserinfoCommand extends BaseCommand {
    public exec(message: Message, args: string[]): Promise<Message> {
        let mentions = message.mentions.members!.first() ?? message.guild!.members.resolve(args[0]);
        if (!mentions) {
            const members = message.guild!.members.cache.filter(
                m => m.displayName.toLowerCase() === args.join(" ").toLowerCase() || m.user.username.toLowerCase() === args.join(" ").toLowerCase()
            );

            mentions = members.first() ?? message.member!;
        }

        const status: Record<PresenceStatus, string> = {
            online: "Online",
            idle: "Idle",
            dnd: "Do Not Disturb",
            offline: "Offline",
            invisible: "Invisble"
        };

        const userinfoEmbed = new MessageEmbed()
            .setAuthor({ name: "User Informations" })
            .setColor(mentions.displayHexColor)
            .setThumbnail(mentions.user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .addFields({
                name: "**Details**",
                value: `\`\`\`asciidoc
• User Name :: ${mentions.user.tag}
• User ID :: ${mentions.user.id}
• User Created At :: ${mentions.user.createdAt.toLocaleString()}
• User Joined At :: ${mentions.joinedAt!.toLocaleString()}
\`\`\``,
                inline: false
            }, {
                name: "**Statistic**",
                value: `\`\`\`asciidoc
• Type :: ${!mentions.user.bot ? "I'm Human" : "Beep Boop, Boop Beep ?"}
• Presence :: (${status[mentions.presence?.status ?? "offline"]}) ${mentions.presence?.activities.filter(({ type }) => type !== "CUSTOM").length ? mentions.presence.activities.filter(({ type }) => type !== "CUSTOM")[0].name : "Activities is not Detected!"}
\`\`\``,
                inline: false
            })
            .setTimestamp();

        return message.reply({ embeds: [userinfoEmbed], allowedMentions: { repliedUser: false } });
    }
}
