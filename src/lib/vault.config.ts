import "dotenv/config";
import vault from "node-vault";
import { AppError } from "../utils/AppError.js";

export type AppConfig = {
  JWT_EXPIRES_IN: string;
  JWT_SECRET: string;
  NODE_ENV: string;
  PORT: number;
  POSTGRES_DB: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_USER: string;
  REDIS_URL: string;
};

const vaultAddress = process.env.VAULT_ADDR ?? "http://localhost:8200";
const vaultToken = process.env.VAULT_DEV_ROOT_TOKEN_ID;
const vaultSecretPath = process.env.VAULT_SECRET_PATH;

if (!vaultToken) {
  throw new AppError("VAULT_DEV_ROOT_TOKEN_ID is required", 500);
}

if (!vaultSecretPath) {
  throw new AppError("VAULT_SECRET_PATH is required", 500);
}

const vaultClient = vault({
  apiVersion: "v1",
  endpoint: vaultAddress,
  token: vaultToken,
});

let cachedConfig: AppConfig | null = null;

export const getConfig = async (): Promise<AppConfig> => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const secrets = await vaultClient.read(vaultSecretPath);
  const config = secrets.data?.data as AppConfig | undefined;

  if (!config) {
    throw new AppError("Vault config not found", 500);
  }

  cachedConfig = config;
  return cachedConfig;
};
