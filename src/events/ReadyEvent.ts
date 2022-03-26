import { ClientPresence } from "discord.js";
import { BaseEvent } from "../structures/BaseEvent";
import { DefineEvent } from "../util/decorators/DefineEvent";

@DefineEvent("ready")
export class ReadyEvent extends BaseEvent {
    public exec(): this {
        this.client.logger.info(
            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} I'm ready to serve ${this.client.guilds.cache.size} guilds ` +
            `with ${this.client.channels.cache.filter(ch => ch.isText()).size} text channels (include ${this.client.channels.cache.filter(ch => ch.isThread()).size} thread channels, ${this.client.channels.cache.filter(ch => ch.type === "GUILD_NEWS").size} news channels, and ${this.client.channels.cache.filter(ch => ch.type === "GUILD_STORE").size} store channels) and ` +
            `${this.client.channels.cache.filter(ch => ch.isVoice()).size} voice channels (include ${this.client.channels.cache.filter(ch => ch.type === "GUILD_STAGE_VOICE").size} stage channels).`
        );

        this.doPresence();

        return this;
    }

    private doPresence(): void {
        this.updatePresence().then(() => setInterval(() => this.updatePresence(), 30 * 1_000)).catch(e => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (e.message === "Shards are stil being spawned.") return this.doPresence();

            this.client.logger.error("READY_EVENT_ERR: ", e);
        });

        return undefined;
    }

    private async updatePresence(): Promise<ClientPresence> {
        const { prefix } = this.client.config;
        const presence = [
            `My prefixes is ${prefix}`,
            `Use ${prefix}help for get started!`,
            `${prefix}help | Mention me (@${this.client.user!.username})`,
            `${prefix}help | Serve ${await this.client.getGuildsCount()} Guilds`,
            `${prefix}help | In ${await this.client.getUsersCount()} Users`,
            `${prefix}help | With ${await this.client.getChannelsCount()} Channels`
        ];

        if (this.client.shard) presence.push(`${prefix}help | Of ${this.client.shard.count} Shards`);

        const randomPresence = this.getRandom(presence);

        return this.client.user!.setPresence({ activities: [{ name: presence[randomPresence], type: "COMPETING" }] });
    }

    private getRandom(array: string[]): number { return Math.floor(Math.random() * array.length); }
}
