import { Client } from "@colyseus/sdk";

/**
 * Dev:  http://localhost:2567
 * Prod: set NEXT_PUBLIC_COLYSEUS_URL=https://novlearn.fr/duel-ws
 */
const COLYSEUS_URL = process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "http://localhost:2567";

let _client: Client | null = null;

export function getColyseusClient(): Client {
  if (!_client) {
    _client = new Client(COLYSEUS_URL);
  }
  return _client;
}
