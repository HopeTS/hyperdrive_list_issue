import b4a from "b4a";
import crypto from "hypercore-crypto";

/** String to array buffer
 *
 * @param {string} str Stringified version of key
 * @returns {Uint8Array | ArrayBuffer} key buffer
 */
export function strToBuffer(str) {
  return b4a.from(str, "hex");
}

/** Array buffer to string
 *
 * @param {Uint8Array | ArrayBuffer} buffer key buffer
 * @returns {string} Stringified version of key
 */
export function bufferToStr(buffer) {
  return b4a.toString(buffer, "hex");
}

/** Take key of string or buffer, format to string
 *
 * @param {string | Uint8Array | ArrayBuffer} key key to format
 * @returns {string} stringified key
 */
export function formatToStr(key) {
  if (typeof key === "string") return key;
  else if (key instanceof Uint8Array || key instanceof ArrayBuffer)
    return bufferToStr(key);
  else throw new Error("Invalid key type", typeof key, key);

  // TODO
}

/** Take key of string or buffer, format to buffer
 *
 * @param {string | Uint8Array | ArrayBuffer} key key to format
 *
 * @returns {Uint8Array | ArrayBuffer} buffer key
 */
export function formatToBuffer(key) {
  if (typeof key === "string") return strToBuffer(key);
  else if (key instanceof Uint8Array || key instanceof ArrayBuffer) return key;
  else throw new Error("Invalid key type", typeof key, key);
}
