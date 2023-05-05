import {
  addErrorEventListener,
  ErrorType,
  removeErrorListener,
  vueCaptureErrorPlugin,
  type AsyncErrorInfo,
  type ErrorInfo,
  type EventErrorInfo,
  type HtmlErrorInfo,
  type VueErrorInfo,
} from "@/utils/capture_error";
import { describe, expect, it } from "vitest";
import { createApp, defineComponent } from "vue";

function sleep(timeout: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, timeout));
}

/**
 * The class not defined, need to realize.
 */
class PromiseRejectionEvent<T> extends Event {
  reason!: Error;
  promise!: Promise<T>;
  constructor(
    type: string,
    {
      reason,
      promise,
    }: {
      reason: Error;
      promise: Promise<T>;
    }
  ) {
    super(type);
    this.reason = reason;
    this.promise = promise;
  }
}

describe.concurrent("Test capture error module.", async () => {
  it.concurrent("Test vue error.", async () => {
    const listenErrors: { [key in ErrorType]?: ErrorInfo } = {};
    function errorListen(error: ErrorInfo) {
      const type = error.type;
      listenErrors[type] = error;
    }
    addErrorEventListener(errorListen);

    const imageUrl = "http://127.0.0.1/image";
    const componentName = "vue-test-component";
    const component = defineComponent({
      name: componentName,
      data() {
        const data: {
          button: HTMLButtonElement | null;
        } = {
          button: null,
        };
        return data;
      },
      methods: {
        vueError() {
          throw new Error("Vue error");
        },
        eventError() {
          if (!this.button) {
            const button = document.createElement("button");
            button.addEventListener("click", function () {
              throw new Error("Event error");
            });
            document.body.append(button);
            this.button = button;
          }
          this.button.click();
        },
        imageError() {
          const image = document.createElement("img");
          image.src = imageUrl;
          document.body.append(image);
          image.dispatchEvent(new Event("error"));
        },
        otherError() {
          window.dispatchEvent(new Event("error"));
        },
        rejectError() {
          const promise = new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              window.dispatchEvent(
                new PromiseRejectionEvent("unhandledrejection", {
                  reason: new Error("Reject error"),
                  promise: promise,
                })
              );
              reject();
            }, 100);
          }).catch(() => null); /// If not capture catch, will bubbling to process unhandledRejection event.
        },
      },
      template: `<div>
      <button @click="vueError" id="vue-error">vue error</button>
      <button @click="eventError" id="event-error">event error</button>
      <button @click="imageError" id="image-error">image error</button>
      <button @click="otherError" id="other-error">other error</button>
      <button @click="rejectError" id="reject-error">reject error</button>
      </div>`,
    });
    createApp(component).use(vueCaptureErrorPlugin).mount(document.body);

    /// Test vue error.
    const vueErrorButton = document.getElementById("vue-error")!;
    vueErrorButton.click();
    const vueError = <VueErrorInfo>listenErrors[ErrorType.vue];
    expect(vueError, "Not captured vue error.").toBeTruthy();
    expect(
      vueError.componentPath,
      "Captured vue error not created vue component."
    ).toContain(componentName);
    expect(
      vueError.message,
      "Captured vue error message isn't created vue error message."
    ).toBe("Vue error");

    /// Test event error.
    const eventErrorButton = document.getElementById("event-error")!;
    eventErrorButton.click();
    await sleep(100);
    const eventError = <EventErrorInfo>listenErrors[ErrorType.event];
    expect(eventError, "Not captured event error.").toBeTruthy();
    expect(
      eventError.message,
      "Captured event error message isn't created event error message."
    ).toBe("Event error");

    expect(
      eventError.eventMessage,
      "Captured event message isn't created event error message."
    ).toBe("Event error");

    /// I don't know has other error event.
    const otherErrorButton = document.getElementById("other-error")!;
    otherErrorButton.click();
    await sleep(100);
    expect(
      listenErrors[ErrorType.otherEvent],
      "Not captured other error event."
    ).toBeTruthy();

    /// Test html error.
    const imageErrorButton = document.getElementById("image-error")!;
    imageErrorButton.click();
    await sleep(100);
    const imageError = <HtmlErrorInfo>listenErrors[ErrorType.html];
    expect(
      imageError.html,
      "Captured html error element not is created image element."
    ).toBe(`<img src="${imageUrl}">`);
    expect(imageError.path, "Captured html error path untrue.").toEqual([
      "img",
      "body",
      "html",
    ]);

    /// Test unhandled rejection.
    const rejectErrorButton = document.getElementById("reject-error")!;
    rejectErrorButton.click();
    await sleep(1000);
    const rejectError = <AsyncErrorInfo>listenErrors[ErrorType.async];
    expect(
      rejectError.message,
      "Capture reject error isn't created reject error."
    ).toBe("Reject error");

    (<Array<ErrorType>>Object.keys(listenErrors)).forEach((key) => {
      delete listenErrors[key];
    });

    /// Test removeErrorListen.
    removeErrorListener(errorListen);
    vueErrorButton.click();
    eventErrorButton.click();
    imageErrorButton.click();
    otherErrorButton.click();
    rejectErrorButton.click();
    await sleep(1000);
    expect(
      Object.keys(listenErrors),
      "Remove error capture listen failed."
    ).toHaveLength(0);
  });
});
