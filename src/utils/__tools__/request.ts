import Request from "@/utils/request";
import http from "http";
import https from "https";

/**
 * Rquest module import http or https request use named import.
 * But msw only mock module request property.
 * So in the need use module request property replace named import method.
 */
Request.prototype["request"] = function (signal: AbortSignal) {
  switch (this.urlPass.protocol) {
    case "http:":
      return http.request(this.urlPass.toString(), {
        agent: this.agent,
        signal,
      });
    case "https:":
      return https.request(this.urlPass.toString(), {
        agent: this.agent,
        signal,
      });
    default:
      throw new Error("This's use protocol is't http and https.");
  }
};
