import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "node:path";

const miniProgramBase64Polyfill = `
;(function (globalObject) {
  if (!globalObject || typeof globalObject.atob === "function") {
    return;
  }

  var chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

  globalObject.atob = function (input) {
    var str = String(input).replace(/[\\t\\n\\f\\r ]+/g, "");
    var output = "";
    var buffer = 0;
    var bits = 0;

    for (var i = 0; i < str.length; i += 1) {
      var char = str.charAt(i);
      if (char === "=") {
        break;
      }

      var value = chars.indexOf(char);
      if (value < 0) {
        continue;
      }

      buffer = (buffer << 6) | value;
      bits += 6;

      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 255);
      }
    }

    return output;
  };

  globalObject.btoa = function (input) {
    var str = String(input);
    var output = "";
    var i = 0;

    while (i < str.length) {
      var chr1 = str.charCodeAt(i++) & 255;
      var chr2 = i < str.length ? str.charCodeAt(i++) & 255 : NaN;
      var chr3 = i < str.length ? str.charCodeAt(i++) & 255 : NaN;
      var enc1 = chr1 >> 2;
      var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      var enc4 = chr3 & 63;

      if (chr2 !== chr2) {
        enc3 = 64;
        enc4 = 64;
      } else if (chr3 !== chr3) {
        enc4 = 64;
      }

      output +=
        chars.charAt(enc1) +
        chars.charAt(enc2) +
        chars.charAt(enc3) +
        chars.charAt(enc4);
    }

    return output;
  };
})(
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof global !== "undefined"
      ? global
      : {}
);
`;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "mp-weixin-base64-polyfill",
      renderChunk(code) {
        if (process.env.UNI_PLATFORM !== "mp-weixin" || !code.includes("atob(")) {
          return null;
        }

        return {
          code: `${miniProgramBase64Polyfill}\n${code}`,
          map: null,
        };
      },
    },
    uni(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
