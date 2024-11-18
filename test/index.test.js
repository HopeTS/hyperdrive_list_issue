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
    await pd.close()
  });

  await t.test("network files (shouldn't work)", async (t) => {
    const [p1, p2] = await utils.createNetwork(2);

    // For testing reasons, wait for all pending swarm i/o to finish
    // makes the assertions below easier to reason about (do not do this in a real world app)
    await p1.swarm.flush()
    await p2.swarm.flush()

    const networkFilesP1 = await p1.listNetworkFiles();
    console.log("Network files", networkFilesP1);

    if (networkFilesP1.length === 3)
      t.pass("Network files listed successfully");
    else t.fail("Network files not listed successfully");

    await p1.close()
    await p2.close()
  });
});
