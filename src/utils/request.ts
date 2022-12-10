import { createWriteStream, existsSync, mkdirSync } from "fs";
import { type Agent, request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { dirname } from "path";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

export enum ProxyType {
  socks5 = "socks5",
  http = "http",
}

export interface Proxy {
  host: string;
  port: number;
  type: ProxyType;
}

let _proxy: Proxy | undefined;

export function setProxy(proxy?: Proxy) {
  _proxy = proxy;
}

interface DownloadOption {
  onprogress?: (size: number) => void;
  abortController?: AbortController;
}

export default class {
  private url: string;
  private _urlPass: URL;
  private proxy?: Proxy;

  get urlPass() {
    return this._urlPass;
  }
  constructor(url: string | URL, proxy?: Proxy) {
    if (typeof url === "string") {
      this.url = url;
      this._urlPass = new URL(url);
    } else {
      this.url = url.toString();
      this._urlPass = url;
    }
    this.proxy = proxy || _proxy;
  }

  get agent(): Agent | undefined {
    if (this.proxy)
      switch (this.proxy.type) {
        case ProxyType.socks5:
          return new SocksProxyAgent({
            hostname: this.proxy.host,
            port: this.proxy.port,
          });
        case ProxyType.http:
          switch (this._urlPass.protocol) {
            case "http:":
              return new HttpProxyAgent({
                host: this.proxy.host,
                port: this.proxy.port,
              });
            case "https:":
              return new HttpsProxyAgent({
                host: this.proxy.host,
                port: this.proxy.port,
              });
            default:
              throw new Error("Unrealized http proxy in the protocol.");
          }
        default:
          throw new Error(`Unrealized the proxy ${this.proxy.type}.`);
      }
  }

  private request(signal?: AbortSignal) {
    switch (this._urlPass.protocol) {
      case "http:":
        return httpRequest(this.url, { agent: this.agent, signal });
      case "https:":
        return httpsRequest(this.url, { agent: this.agent, signal });
      default:
        throw new Error("This's use protocol is't http and https.");
    }
  }

  download(
    save: string,
    { abortController, onprogress }: DownloadOption = {}
  ): Promise<void> {
    abortController?.signal.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
      const request = this.request(abortController?.signal);

      /// In abort, if request send, request not quit.
      /// Need to destroy that.
      function destroy() {
        request.destroy();
        request.req?.destroy();
        resolve();
      }
      abortController?.signal.addEventListener("abort", destroy, {
        once: true,
      });
      request
        .once("response", (response) => {
          abortController?.signal.throwIfAborted();
          abortController?.signal.removeEventListener("abort", destroy);

          if (!response.statusCode?.toString().startsWith("2")) {
            reject(new Error(`Response code is ${response.statusCode}`));
            response.destroy();
            console.log(save);
            return;
          }
          if (onprogress) {
            let size = 0;
            response.on("data", (butter: Buffer) => {
              onprogress((size += butter.length));
            });
          }

          const dir = dirname(save);
          if (!existsSync(save)) mkdirSync(dir, { recursive: true });
          const write = createWriteStream(save);

          function destroy() {
            resolve();
            response.destroy();
          }
          abortController?.signal.addEventListener("abort", destroy);
          response
            .once("error", reject)
            .once("close", () => {
              resolve();
              abortController?.signal.removeEventListener("abort", destroy);
            })
            .pipe(write);
        })
        .once("error", reject)
        .end();
    });
  }

  private result(): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      this.request()
        .once("response", (response) => {
          if (!response.statusCode?.toString().startsWith("2"))
            return reject(
              new Error(`The request code ${response.statusCode}.`)
            );
          const buffers: Buffer[] = [];
          response
            .on("data", (buffer) => buffers.push(buffer))
            .once("error", (error) => reject(error))
            .once("close", () => {
              if (response.complete) resolve(Buffer.concat(buffers));
              reject(new Error("The request res is not complete."));
            });
        })
        .once("error", (error) => reject(error))
        .end();
    });
  }

  getJson<T>(): Promise<T> {
    return this.result().then((buffer) => JSON.parse(buffer.toString()));
  }
}
