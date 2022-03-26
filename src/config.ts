import { Snowflake } from "discord.js";

export const prefix: string = process.env.NODE_ENV === "development" ? "+" : "!";
export const owners: Snowflake[] = ["616962893451231233"];
