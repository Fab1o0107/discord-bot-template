import { readdir } from "fs/promises";
import { parse, resolve } from "path";
import { BaseEvent } from "../structures/BaseEvent";
import { BotClient } from "../structures/BotClient";

export class EventLoader {
    public constructor(public readonly client: BotClient, private readonly path: string) {
        Object.defineProperties(this, {
            client: { enumerable: true, writable: false },
            path: { enumerable: false, writable: false }
        });
    }

    public async load(): Promise<EventLoader> {
        const files = await readdir(resolve(this.path));

        for (const file of files) {
            const event = await this.import(resolve(this.path, file), this.client);

            if (!event) return Promise.reject(new ReferenceError(`File ${file} is invalid event files.`));

            this.client.on(event.name, (...args) => event.exec(...args));

            this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Event for name ${event.name} has been loaded.`);
        }

        this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} A total of ${files.length} of event has been loaded.`);

        return this;
    }

    private async import(path: string, ...args: any[]): Promise<BaseEvent | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const file = await import(resolve(path)).then(f => f[parse(path).name]);

        return file ? new file(...args) : undefined;
    }
}
