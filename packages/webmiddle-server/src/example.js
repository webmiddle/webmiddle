import WebMiddle from "webmiddle";
import Server from "./index";

const textResource = (content, name = "result") => ({
  name,
  contentType: "text/plain",
  content:
    typeof content !== "undefined" && content !== null
      ? String(content)
      : content
});

const delay = time => new Promise(resolve => setTimeout(resolve, time));

const parentWebmiddle = new WebMiddle({
  services: {
    divide: ({ a, b }) => delay(60000).then(() => textResource(a / b))
  }
});

const webmiddle = new WebMiddle({
  parent: parentWebmiddle,
  services: {
    multiply: ({ a, b }) => textResource(a * b)
  }
});

const server = new Server(webmiddle);
server.start();
