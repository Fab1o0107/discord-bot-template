import { BaseCommand } from "../../structures/BaseCommand";
import { DefineCommand } from "../../util/decorators/DefineCommand";
import { ColorResolvable, Message, MessageEmbed } from "discord.js";

@DefineCommand({
    name: "ping",
    aliases: ["pong", "pang", "peng"],
    info: {
        desc: "Show ping the bot to see if there are latency issues.",
        usage: "{prefix}ping"
    }
})
export class PingCommand extends BaseCommand {
    public exec(message: Message): Promise<Message> {
        const before = Date.now();
        const pingEmbed = new MessageEmbed().setColor("#00CCFF").setDescription(
            "Check the api and websocket latencies, please wait..."
        );

        return message.reply({ embeds: [pingEmbed], allowedMentions: { repliedUser: false } }).then(async m => {
            const latency = Date.now() - before;
            const wsLatency = await this.webSocketPing();

            pingEmbed
                .setAuthor({ name: "🏓 PONG!", iconURL: this.client.user!.displayAvatarURL() })
                .setColor(this.searchHex(wsLatency))
                .addFields({
                    name: "📶 API Latency",
                    value: `**\`${latency}\`** ms`,
                    inline: true
                }, {
                    name: "🌐 WebSocket Latency",
                    value: `**\`${wsLatency}\`** ms`,
                    inline: true
                })
                .setTimestamp();

            pingEmbed.description = null;

            return m.edit({ embeds: [pingEmbed] });
        });
    }

    private searchHex(ms: number | string): ColorResolvable {
        const listColorHex: ColorResolvable[][] = [
            [0, 20, "#0DFF00"],
            [21, 50, "#0BC700"],
            [51, 100, "#E5ED02"],
            [101, 150, "#FF8C00"],
            [151, 200, "#FF6A00"]
        ];

        const defaultColors = "#FF0D00";

        const min = listColorHex.map(e => e[0]);
        const max = listColorHex.map(e => e[1]);
        const hex = listColorHex.map(e => e[2]);
        let ret: ColorResolvable = "#000000";

        for (let i = 0; i < listColorHex.length; i++) {
            if (min[i] <= ms && ms <= max[i]) { ret = hex[i]; } else { ret = defaultColors; }
        }

        return ret;
    }

    private webSocketPing(): Promise<string> {
        if (!this.client.shard) return Promise.resolve(this.client.ws.ping.toFixed(0));

        return this.client.shard.broadcastEval(client => client.ws.ping.toFixed(0)).then(data => data.reduce((a, b) => a + b));
    }
}
