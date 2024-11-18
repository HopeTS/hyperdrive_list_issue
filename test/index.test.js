/** @typedef {import('pear-interface')} */ /* global Pear */
import { test, hook, solo } from "brittle";

import * as utils from "./utils.js";
import PD from "../index.js";

test("List file", async (t) => {
  await t.test("local files (should work)", async (t) => {
    const pd = utils.createPD();
    await pd.ready();
    await pd.joinNetwork();
    const files = await pd.listLocalFiles();
    if (files.length === 3) t.pass("Local files listed successfully");
    else t.fail("Local files not listed successfully");
  });

  await t.test("network files (shouldn't work)", async (t) => {
    const [p1, p2] = await utils.createNetwork(2);

    // Wait for peers to connect drives
    let peerDrivesConnected = false;
    const startTime = Date.now();
    while (!peerDrivesConnected && Date.now() - startTime < 60000) {
      let p1hasp2 = false;
      let p2hasp1 = false;

      // Check for p2's hyperdrive in p1's networkDrive
      if (Object.keys(p1.peerDrives).includes(p2.publicKey)) {
        p1hasp2 = true;
      }

      // Check for p1's hyperdrive in p2's networkDrive
      if (Object.keys(p2.peerDrives).includes(p1.publicKey)) {
        p2hasp1 = true;
      }

      if (p1hasp2 && p2hasp1) {
        peerDrivesConnected = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const networkFilesP1 = await p1.listNetworkFiles();
    console.log("Network files", networkFilesP1);

    if (networkFilesP1.length === 3)
      t.pass("Network files listed successfully");
    else t.fail("Network files not listed successfully");
  });
});
