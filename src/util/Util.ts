/* eslint-disable prefer-template */
import fetch from "node-fetch";
import { BotClient } from "../structures/BotClient";

export class Util {
    public hastebin: (StringOrObject: Record<any, any> | string) => Promise<string>;
    public toTitleCase: (text: string) => string;
    public bytesToSize: (bytes: number | string) => string;
    public trimArray: <T>(array: T[], length?: number) => T[];
    public chunk: <T>(array: T[], chunckSize?: number) => T[][];
    public validateURL: (url: string) => boolean;
    public parseQuery: (queries: string[]) => { args: string[]; flag: string[] };
    public constructor(public readonly client: BotClient) {
        Object.defineProperty(this, "client", { enumerable: false, writable: false });

        this.hastebin = async StringOrObject => {
            const { key } = await fetch("https://bin.fab1o.xyz/documents", {
                method: "POST",
                body: typeof StringOrObject === "object" ? JSON.stringify(StringOrObject, null, 2) : StringOrObject,
                headers: { "content-type": "application/json" }
            }).then(res => res.json() as Promise<{ key: string }>);

            return `https://bin.fab1o.xyz/${key}`;
        };
        this.toTitleCase = text => {
            const string = text.toLowerCase().split(" ");

            for (let i = 0; i < string.length; i++) {
                string[i] = string[i].charAt(0).toUpperCase() + string[i].slice(1);
            }

            return string.join(" ");
        };
        this.bytesToSize = bytes => {
            const sizes = ["B", "kB", "MB", "GB", "TB", "PB"];

            if (bytes < 2 && bytes > 0) return `${bytes} Byte`;

            const i = parseInt(Math.floor(Math.log(bytes as number) / Math.log(1024)).toString());

            if (i === 0) return `${bytes} ${sizes[i]}`;

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (sizes[i] === undefined) return `${bytes} ${sizes[sizes.length - 1]}`;

            return `${Number(bytes as number / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
        };
        this.trimArray = (array, length = 10) => {
            const len = array.length - length;
            const temp = array.slice(0, length);

            // @ts-expect-error ignore this issues (2345)
            temp.push(`...${len} more.`);

            return temp;
        };
        this.chunk = (array, chunkSize = 10) => {
            const temp = [];

            for (let i = 0; i < array.length; i += chunkSize) {
                temp.push(array.slice(i, i + chunkSize));
            }

            return temp;
        };
        this.validateURL = url => {
            const pattern = new RegExp(
                "^(https?:\\/\\/)?" + // protocol
                "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
                "((\\d{1,3}\\.){3}\\d{1,3}))" + // or, IP (v4) address
                "(\\:\\d+)?(\\/[-a-zd%_.~+]*)*" + // port and path
                "(\\:\\d+)?(\\/[-a-z\\d%_.~+=-]*)?" + // query string
                "(\\#[-a-z\\d_]*)?$", // fragment locator
                "i"
            );

            return Boolean(pattern.test(url));
        };
        this.parseQuery = queries => {
            const args = [];
            const flag = [];

            for (const query of queries) {
                if (query.startsWith("--")) flag.push(query.slice(2).toLowerCase());
                else if (query.startsWith("-")) flag.push(query.slice(1).toLowerCase());
                else args.push(query);
            }

            return { args, flag };
        };
    }
}
