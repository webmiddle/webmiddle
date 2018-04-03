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

const server = new Server({
  multiply: ({ a, b }) => textResource(a * b),
  divide: ({ a, b }) => delay(60000).then(() => textResource(a / b))
});
server.start();
