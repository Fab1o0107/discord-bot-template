import { Message, MessageEmbed, version } from "discord.js";
import { cpus, uptime } from "os";
import prettyMilliseconds from "pretty-ms";
import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";

@DefineCommand({
    name: "stats",
    aliases: ["st", "status", "statistic", "statistics", "static", "info", "botinfo", "infobot"],
    info: {
        desc: "Show the statistic information the bots.",
        usage: "{prefix}stats"
    }
})
export class StatsCommand extends BaseCommand {
    public async exec(message: Message): Promise<Message> {
        const statsEmbed = new MessageEmbed()
            .setAuthor({ name: `${this.client.user!.username}'s Bot Statistics` })
            .setThumbnail(this.client.user!.displayAvatarURL({ size: 4096 }))
            .setColor("#00CCFF")
            .addFields({
                name: "**General**",
                value: `\`\`\`asciidoc
• Users :: ${(await this.client.getUsersCount()).toLocaleString()}
• Channels :: ${(await this.client.getChannelsCount()).toLocaleString()}
• Guilds :: ${(await this.client.getGuildsCount()).toLocaleString()}
• Shards :: ${this.client.shard?.count ?? "N/A"}
• Node.js :: ${process.version}
• Discord.js :: v${version}
\`\`\``
            }, {
                name: "**Engine**",
                value: `\`\`\`asciidoc
• Memory Usage :: ${this.client.util.bytesToSize(await this.client.getTotalMemory("rss"))}
• Processor :: ${cpus().length}x ${cpus()[0].model}
• Websocket :: ${(await this.client.shard?.broadcastEval(client => client.ws.ping.toFixed(0)))?.reduce((a, b) => a + b) ?? this.client.ws.ping.toFixed(0)} ms
\`\`\``
            }, {
                name: "**Uptime**",
                value: `\`\`\`asciidoc
• Bots :: ${prettyMilliseconds(this.client.uptime!, { secondsDecimalDigits: 0 })}
• OS :: ${prettyMilliseconds(uptime() * 1_000, { secondsDecimalDigits: 0 })}
• Process :: ${prettyMilliseconds(Math.floor(process.uptime() * 1_000), { secondsDecimalDigits: 0 })}
\`\`\``
            })
            .setTimestamp();

        return message.reply({ embeds: [statsEmbed], allowedMentions: { repliedUser: false } });
    }
}
