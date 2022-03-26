import { BaseEvent } from "../../structures/BaseEvent";
import { BotClient } from "../../structures/BotClient";

export function DefineEvent(name: BaseEvent["name"]): any {
    return function decorate<T extends BaseEvent>(target: new (...args: any[]) => T): new (client: BotClient) => T {
        return new Proxy(target, { construct: (ctx, [client]): T => new ctx(client, name) });
    };
}
