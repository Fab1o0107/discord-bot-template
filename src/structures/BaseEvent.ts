import { ClientEvents } from "discord.js";
import { BotClient } from "./BotClient";

export class BaseEvent {
    public constructor(public readonly client: BotClient, public name: keyof ClientEvents) { Object.defineProperty(this, "client", { enumerable: true, writable: false }); }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public exec(...args: ClientEvents[BaseEvent["name"]]): void {}
}
