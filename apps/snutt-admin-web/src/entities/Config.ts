import type { OS, Version } from "./NativeClient";

type Data = Record<string, unknown>;
export type Config = Record<string, Data>;
export type AdminConfigId = string & { __brand: "AdminConfigId" };
export type AdminConfig = {
  id: AdminConfigId;
  data: Data;
  minVersion: null | Record<OS, Version>;
  maxVersion: null | Record<OS, Version>;
};
