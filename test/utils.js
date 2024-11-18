import fs from "fs";
import path from "path";

import * as C from "./constants.js";
import PD from "../index.js";

export function generateString(length = 8) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export function createRandomFile(basePath, length = 8) {
  const name = `${generateString(length)}.txt`;
  const path = `${basePath}/${name}`;
  const contents = generateString(length);

  fs.writeFileSync(path, contents);
  return {
    name,
    path,
    contents,
  };
}

export function createNewFolderPath(basePath, length = 8) {
  return path.join(basePath, generateString(length));
}

export function createCorestorePath() {
  return createNewFolderPath(C.CORESTORE_DIR);
}

export function createLDFolder() {
  const folderPath = createNewFolderPath(C.LD_DIR);
  fs.mkdirSync(folderPath, { recursive: true });

  let files = [];
  for (let i = 0; i < 3; i++) {
    const file = createRandomFile(folderPath);
    files.push(file);
  }
  return folderPath;
}

export function createCorestoreFolder() {
  const folderPath = createNewFolderPath(C.CORESTORE_DIR);
  fs.mkdirSync(folderPath, { recursive: true });

  return folderPath;
}

export async function createNetwork(n = 2) {
  const peers = [];
  const p1 = createPD();
  await p1.ready();
  await p1.joinNetwork();
  peers.push(p1);

  for (let i = 1; i < n; i++) {
    const p2 = createPD();
    await p2.ready();
    await p2.joinNetwork(p1.swarmTopic);
    peers.push(p2);
  }

  await awaitAllConnected(peers);
  return peers;
}

export function createPD() {
  return new PD(createLDFolder(), createCorestorePath());
}

export async function awaitAllConnected(instances, timeout = 60000) {
  let connected = false;
  const startTime = Date.now();

  while (!connected && Date.now() - startTime < timeout) {
    connected = instances.every((instance) => instance.connected);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return connected;
}
