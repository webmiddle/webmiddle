import test from "ava";
import { rootContext } from "webmiddle";
import Server from "webmiddle-server";
import Client from "../../src";

export default function run(protocol) {
  // NOTE: make sure this is not the same port used in webmiddle-server tests
  // (and in any other test that starts webmiddle-server)
  const PORT = 4000 + (protocol === "ws" ? 1 : 0);

  const server = new Server(
    {
      "math/sum": ({ a, b }) => ({
        name: "result",
        contentType: "text/plain",
        // without Number() a + b would be a string concatenation in GET requests!
        content: String(Number(a) + Number(b))
      }),

      "math/multiply": ({ a, b }) => ({
        name: "result",
        contentType: "text/plain",
        content: String(Number(a) * Number(b))
      }),

      "math/divide": ({ a, b }) => ({
        name: "result",
        contentType: "text/plain",
        content: String(Number(a) / Number(b))
      }),

      returnOption: ({ optionName }, context) => context.options[optionName]
    },
    {
      port: PORT,
      contextOptions: { base: "default option" }
    }
  );
  server.start();

  test.beforeEach(async t => {
    t.context.client = new Client({
      protocol,
      hostname: "localhost",
      port: PORT
    });
  });

  test("retrieved service paths", async t => {
    const servicePaths = await t.context.client.requestServicePaths();
    t.deepEqual(servicePaths, [
      "math/sum",
      "math/multiply",
      "math/divide",
      "returnOption"
    ]);
  });

  test("execute remote service", async t => {
    const Sum = t.context.client.service("math/sum");

    const resource = await rootContext
      .extend({
        networkRetries: 2
      })
      .evaluate(<Sum a={10} b={20} />);
    t.is(resource.contentType, "text/plain");
    t.is(resource.content, "30");
  });

  test("execute remote service with options", async t => {
    const ReturnOption = t.context.client.service("returnOption");

    const resource = await rootContext
      .extend({
        networkRetries: 2,
        whatever: "you got it!"
      })
      .evaluate(<ReturnOption optionName="whatever" />);

    t.is(resource.contentType, "x-webmiddle-any");
    t.is(resource.content, "you got it!");
  });

  test("execute remote service with default options", async t => {
    const ReturnOption = t.context.client.service("returnOption");

    const resource = await rootContext
      .extend({
        networkRetries: 2
      })
      .evaluate(<ReturnOption optionName="base" />);

    t.is(resource.contentType, "x-webmiddle-any");
    t.is(resource.content, "default option");
  });
}
