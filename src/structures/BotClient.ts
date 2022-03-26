/* eslint-disable @typescript-eslint/method-signature-style, @typescript-eslint/member-ordering */
import { Client as DJSClient, Collection, Sweepers, Options, Snowflake, User } from "discord.js";
import { resolve } from "path";
import { CommandManager } from "../util/CommandManager";
import { EventLoader } from "../util/EventLoader";
import { createLogger } from "../util/Logger";
import { Util } from "../util/Util";
import * as config from "../config";

export class BotClient extends DJSClient {
    public readonly config = config;
    private readonly _eventLoader = new EventLoader(this, resolve(__dirname, "..", "events"));
    public readonly logger = createLogger("main", process.env.NODE_ENV === "development");
    public util = new Util(this);
    public commandManager = new CommandManager(this, resolve(__dirname, "..", "commands"));
    public constructor() {
        super({
            allowedMentions: { parse: [], repliedUser: true },
            makeCache: Options.cacheWithLimits({
                ThreadManager: {
                    sweepInterval: 3600,
                    sweepFilter: Sweepers.filterByLifetime({
                        getComparisonTimestamp: th => th.archiveTimestamp!,
                        excludeFromSweep: th => !th.archived
                    })
                },
                MessageManager: {
                    maxSize: Infinity,
                    sweepInterval: 180,
                    sweepFilter: Sweepers.filterByLifetime({
                        lifetime: 60,
                        getComparisonTimestamp: m => m.editedTimestamp ?? m.createdTimestamp
                    })
                }
            }),
            intents: [
                "GUILDS",
                "GUILD_MEMBERS",
                "GUILD_VOICE_STATES",
                "GUILD_EMOJIS_AND_STICKERS",
                "GUILD_PRESENCES",
                "GUILD_MESSAGES",
                "GUILD_MESSAGE_REACTIONS"
            ],
            ws: { properties: { $browser: "Discord iOS" } }
        });

        Object.defineProperties(this, {
            config: { enumerable: false, writable: false },
            _eventLoader: { enumerable: false, writable: false },
            logger: { enumerable: false, writable: false }
        });
    }

    public async build(): Promise<BotClient> {
        this.on("ready", () => this.commandManager.load());
        if (process.env.NODE_ENV === "development") this.on("debug", debug => this.logger.debug(debug) as any);
        this.on("warn", warn => this.logger.warn(`CLIENT_WARN: ${warn}`) as any);
        this.on("error", e => this.logger.error("CLIENT_ERR: ", e) as any);

        this._eventLoader.load().catch(e => this.logger.error("LISTENER_LOADER_ERR: ", e));

        await this.login();

        return this;
    }

    public getGuildsCount(): Promise<number> {
        if (!this.shard) return Promise.resolve(this.guilds.cache.size);

        return this.shard.broadcastEval(client => client.guilds.cache.size).then(size => size.reduce((p, v) => p + v, 0));
    }

    public getChannelsCount(filter = true): Promise<number> {
        if (filter) {
            if (!this.shard) return Promise.resolve(this.channels.cache.filter(c => c.type !== "GUILD_CATEGORY" && c.type !== "DM").size);

            return this.shard.broadcastEval(client => client.channels.cache.filter(c => c.type !== "GUILD_CATEGORY" && c.type !== "DM").size).then(size => size.reduce((p, v) => p + v, 0));
        }

        if (!this.shard) return Promise.resolve(this.channels.cache.size);

        return this.shard.broadcastEval(client => client.channels.cache.size).then(size => size.reduce((p, v) => p + v, 0));
    }

    public getUsersCount(filter = true): Promise<number> {
        const temp: Collection<Snowflake, User> = new Collection();

        if (filter) {
            if (!this.shard) return Promise.resolve(this.users.cache.filter(u => !u.equals(this.user!)).size);

            return this.shard.broadcastEval(client => client.users.cache.filter(u => !u.equals(this.user!))).then(shards => {
                for (const shard of shards) { for (const user of shard) { temp.set(user.id, user); } }

                return temp.size;
            });
        }

        if (!this.shard) return Promise.resolve(this.users.cache.size);

        return this.shard.broadcastEval(client => client.users.cache).then(shards => {
            for (const shard of shards) { for (const user of shard) { temp.set(user.id, user); } }

            return temp.size;
        });
    }

    public getTotalMemory(type: keyof NodeJS.MemoryUsage): Promise<number> {
        if (!this.shard) return Promise.resolve(process.memoryUsage()[type]);

        return this.shard.broadcastEval((_, { type }) => process.memoryUsage()[type], { context: { type } }).then(data => data.reduce((a, b) => a + b));
    }
}

declare module "discord.js" {
    // @ts-expect-error ignore this issues (2310)
    export interface Client extends DJSClient {
        readonly config: BotClient["config"];
        readonly logger: BotClient["logger"];
        util: BotClient["util"];
        commandManager: BotClient["commandManager"];

        build(): Promise<Client>;
        getGuildsCount(): Promise<number>;
        getChannelsCount(filter?: boolean): Promise<number>;
        getUsersCount(filter?: boolean): Promise<number>;
        getTotalMemory(type: keyof NodeJS.MemoryUsage): Promise<number>;
    }
}
