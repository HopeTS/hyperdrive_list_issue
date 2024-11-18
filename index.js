/** @typedef {import('pear-interface')} */ /* global Pear */
import crypto from "hypercore-crypto";
import Hyperdrive from "hyperdrive";
import Hyperswarm from "hyperswarm";
import Localdrive from "localdrive";
import Corestore from "corestore";
import b4a from "b4a";
import debounce from "debounceify";
import goodbye from "graceful-goodbye";
import RPC from 'protomux-rpc';
import c from 'compact-encoding';

import * as utils from "./utils.js";

const DRIVE_KEY_REQUEST_MESSAGE = "drive-key-request";
const DRIVE_KEY_SEND_MESSAGE = "drive-key-send";

/** Main class */
class PD {
  constructor(localDrivePath, corestorePath) {
    this.localDrivePath = localDrivePath;
    this.corestorePath = corestorePath;

    this.connected = false;

    this.store = new Corestore(corestorePath);
    this.swarm = new Hyperswarm();
    goodbye(() => this.swarm.destroy());

    this.peerDrives = {};
    this.activePeers = {};

    this._localUpdate = this._localUpdate.bind(this);
    this._networkUpdate = this._networkUpdate.bind(this);
    this._swarmConnection = this._swarmConnection.bind(this);

    this.swarm.on("connection", this._swarmConnection);

    this._connClose = this._connClose.bind(this);
    this._connData = this._connData.bind(this);

    this._handleMessage = this._handleMessage.bind(this);
    this._handleDriveKeyRequestMessage =
      this._handleDriveKeyRequestMessage.bind(this);
    this._handleDriveKeySendMessage =
      this._handleDriveKeySendMessage.bind(this);

    this._localMirrorDrive = this._localMirrorDrive.bind(this);
    this._localMirror = debounce(this._localMirrorDrive);

    this._sendMessageToPeer = this._sendMessageToPeer.bind(this);
  }

  async ready() {
    await this.store.ready();
  }

  async close () {
    await this.swarm.destroy()
    await this.store.close()
  }

  async joinNetwork(topic) {
    this.swarmTopic = topic || crypto.randomBytes(32);
    this.local = new Localdrive(this.localDrivePath);
    this.drive = new Hyperdrive(this.store);

    await this.local.ready();
    await this.drive.ready();

    this.swarmTopic = topic || crypto.randomBytes(32);
    const discovery = this.swarm.join(this.swarmTopic, {
      client: true,
      server: true,
    });
    await discovery.flushed();

    this.publicKey = utils.formatToStr(this.swarm.keyPair.publicKey);
    this.secretKey = utils.formatToStr(this.swarm.keyPair.secretKey);

    await this._localMirror();
    this.connected = true;
  }

  async listNetworkFiles(dir = "/") {
    await this._localMirror();
    const files = [];
    for (const key of Object.keys(this.peerDrives)) {
      const drive = this.peerDrives[key];
      for await (const file of drive.list(dir)) {
        files.push(file);
      }
    }

    return files;
  }

  async listLocalFiles(dir = "/") {
    let files = [];
    for await (const file of this.local.list(dir)) {
      files.push(file);
    }
    return files;
  }

  async _localMirrorDrive() {
    const mirror = this.local.mirror(this.drive);
    await mirror.done();
  }

  async _localUpdate() {
    //
  }

  async _networkUpdate() {
    //
  }

  async _swarmConnection(conn) {
    this.store.replicate(conn) // replicate the drives etc
    const rpc = new RPC(conn, {
      valueEncoding: c.json
    }) // speak rpc for the rest

    rpc.respond(DRIVE_KEY_SEND_MESSAGE, (payload) => {
      return this._handleDriveKeySendMessage(conn, payload)
    })

    rpc.respond(DRIVE_KEY_REQUEST_MESSAGE, (payload) => {
      return this._handleDriveKeyRequestMessage(conn, payload);
    })

    conn.once("close", this._connClose.bind(this, conn));
    conn.on("data", (data) => this._connData(conn, data));

    const key = utils.formatToStr(conn.remotePublicKey);
    this.activePeers[key] = rpc;
    this._sendMessageToPeer(key, DRIVE_KEY_SEND_MESSAGE, utils.formatToStr(this.drive.key));
  }

  async _connClose(conn) {
    delete this.activePeers[utils.formatToStr(conn.remotePublicKey)];
    //
  }

  async _connData(conn, data) {
    this._handleMessage(conn, data);
  }

  async _handleMessage(conn, data) {
    try {
      const parsedMessage = JSON.parse(data);
      const { type, payload } = parsedMessage;
      if (typeof type !== "string") throw new Error("invalid message");

      // Handle message types
      switch (type) {
        case DRIVE_KEY_REQUEST_MESSAGE:
          this._handleDriveKeyRequestMessage(conn, payload);
          break;

        case DRIVE_KEY_SEND_MESSAGE:
          this._handleDriveKeySendMessage(conn, payload);
          break;

        default:
          throw new Error("invalid message");
      }
    } catch (error) {
      return;
    }
  }

  async _handleDriveKeyRequestMessage(conn, payload) {
    //
    return true
  }

  async _handleDriveKeySendMessage(conn, payload) {
    const peerKeyStr = utils.formatToStr(conn.remotePublicKey);
    const driveKeyStr = utils.formatToStr(payload);
    const drive = new Hyperdrive(this.store, driveKeyStr);
    drive.core.on("append", this._networkUpdate);
    await drive.ready();
    this.peerDrives[peerKeyStr] = drive;
    return true
  }

  async _sendMessageToPeer(key, type, payload) {
    const rpc = this.activePeers[key];

    if (!rpc) return false;

    await rpc.request(type, payload);
  }
}

export default PD;
