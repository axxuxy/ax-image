import type { ComponentPublicInstance, Plugin } from "vue";

export enum ErrorType {
  vue = "vue",
  event = "event",
  otherEvent = "other event",
  html = "html",
  async = "async",
}

interface BaseErrorInfo {
  type: ErrorType;
  date: Date;
  message?: string;
  stack?: string;
  name: string;
}

export interface VueErrorInfo extends BaseErrorInfo {
  type: ErrorType.vue;
  data: unknown;
  info: string;
  routePath?: string;
  componentPath: Array<string | undefined>;
}

export interface EventErrorInfo extends BaseErrorInfo {
  type: ErrorType.event;
  eventMessage: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

export interface HtmlErrorInfo extends BaseErrorInfo {
  type: ErrorType.html;
  html: string;
  path: Array<string>;
}

export interface EventOtherErrorInfo extends BaseErrorInfo {
  type: ErrorType.otherEvent;
  message: undefined;
  stack: undefined;
  name: "";
  eventName: string;
  eventTargetName: string;
}

export interface AsyncErrorInfo extends BaseErrorInfo {
  type: ErrorType.async;
}

export type ErrorInfo =
  | VueErrorInfo
  | EventErrorInfo
  | HtmlErrorInfo
  | EventOtherErrorInfo
  | AsyncErrorInfo;

type ErrorEventListener = (errorInfo: ErrorInfo) => void;

const errorEventListeners = new Set<ErrorEventListener>();
function captureError(errorInfo: ErrorInfo) {
  errorEventListeners.forEach((listen) => listen(errorInfo));
}

export function addErrorEventListener(listen: ErrorEventListener) {
  errorEventListeners.add(listen);
}

export function removeErrorListener(listen: ErrorEventListener) {
  errorEventListeners.delete(listen);
}

export const vueCaptureErrorPlugin: Plugin = {
  install(app) {
    app.config.errorHandler = function (err, vm, info) {
      const components: Array<string | undefined> = [];
      let current: ComponentPublicInstance | null | undefined = vm;
      do {
        components.push(current?.$options?.name);
        current = current?.$parent;
      } while (current);
      components.reverse();

      const errorInfo: VueErrorInfo = {
        date: new Date(),
        type: ErrorType.vue,
        message: (<Error>err).message,
        stack: (<Error>err).stack || (<Error>err).toString(),
        name: (<Error>err).name,
        routePath: location.href,
        componentPath: components,
        data: vm?.$data,
        info: info,
      };
      captureError(errorInfo);
    };
  },
};

window.addEventListener(
  "error",
  (event: Event) => {
    if (event instanceof ErrorEvent) {
      const errorInfo: EventErrorInfo = {
        date: new Date(),
        type: ErrorType.event,
        message: event.error?.message,
        stack: event.error?.stack,
        name: event.error?.name,
        eventMessage: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      };
      captureError(errorInfo);
    } else if (event.target instanceof HTMLElement) {
      const path: Array<string> = [];
      let target: HTMLElement | null = event.target;
      do {
        path.push(target.tagName.toLowerCase());
        target = target.parentElement;
      } while (target);

      const errorInfo: HtmlErrorInfo = {
        date: new Date(),
        type: ErrorType.html,
        message: "",
        stack: "",
        name: "",
        html: event.target.outerHTML,
        path: path,
      };
      captureError(errorInfo);
    } else {
      captureError(<EventOtherErrorInfo>{
        date: new Date(),
        type: ErrorType.otherEvent,
        message: undefined,
        stack: undefined,
        name: "",
        eventName: event.constructor.name,
        eventTargetName: event.target?.constructor?.name,
      });
    }
    event.preventDefault();
  },
  true
);

window.addEventListener(
  "unhandledrejection",
  (event: PromiseRejectionEvent) => {
    const error = event.reason;
    const errorInfo: AsyncErrorInfo = {
      date: new Date(),
      type: ErrorType.async,
      message: error.message,
      stack: error.stack ?? "",
      name: error.name,
    };
    captureError(errorInfo);
    event.preventDefault();
  }
);
