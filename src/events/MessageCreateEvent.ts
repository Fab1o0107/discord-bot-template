import { BaseEvent } from "../structures/BaseEvent";
import { DefineEvent } from "../util/decorators/DefineEvent";
import { Message } from "discord.js";

@DefineEvent("messageCreate")
export class MessageCreateEvent extends BaseEvent {
    public exec(message: Message): any {
        if (message.author.bot || message.author === (this.client.user as any)) return message;

        const isPrefixes = (): boolean => message.content.toLowerCase().startsWith(this.client.config.prefix.toLowerCase());

        if (message.mentions.users.has(this.client.user!.id) && !isPrefixes()) {
            return message.reply({
                embeds: [{
                    color: "#00CCFF",
                    description: `Hi, my **Prefixes** ${
                        message.guild ? `on this server is **\`${this.client.config.prefix}\`**` : `is **\`${this.client.config.prefix}\`**`
                    }.`
                }]
            });
        }
        try {
            return this.client.commandManager.handle(message);
        } catch (e) {
            this.client.logger.error("MESSAGE_CREATE_EVENT_ERR: ", e);
        }
    }
}
