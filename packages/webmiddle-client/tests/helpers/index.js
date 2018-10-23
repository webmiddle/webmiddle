import test from "ava";
import { rootContext, isResource } from "webmiddle";
import Server from "webmiddle-server";
import Client from "../../src";

export default function run(protocol) {
  // NOTE: make sure this is not the same port used in webmiddle-server tests
  // (and in any other test that starts webmiddle-server)
  const PORT = 4000 + (protocol === "ws" ? 1 : 0);
  const API_KEY = "justAnyStringHere012";

  const server = new Server(
    {
      "math/sum": ({ a, b }) =>
        rootContext.createResource(
          "result",
          "text/plain",
          // without Number() a + b would be a string concatenation in GET requests!
          String(Number(a) + Number(b))
        ),

      "math/multiply": ({ a, b }) =>
        rootContext.createResource(
          "result",
          "text/plain",
          String(Number(a) * Number(b))
        ),

      "math/divide": ({ a, b }) =>
        rootContext.createResource(
          "result",
          "text/plain",
          String(Number(a) / Number(b))
        ),

      returnOption: ({ optionName }, context) => context.options[optionName]
    },
    {
      port: PORT,
      apiKey: API_KEY,
      contextOptions: { base: "default option" }
    }
  );
  server.start();

  const createClient = ({ apiKey = API_KEY } = {}) => {
    return new Client({
      protocol,
      hostname: "localhost",
      port: PORT,
      apiKey
    });
  };

  test.beforeEach(async t => {
    t.context.client = createClient();
  });

  test("retrieved service paths", async t => {
    const servicePaths = await t.context.client.requestServicePaths();
    t.deepEqual(servicePaths, {
      "math/sum": { name: "math/sum", description: null },
      "math/multiply": { name: "math/multiply", description: null },
      "math/divide": { name: "math/divide", description: null },
      returnOption: { name: "returnOption", description: null }
    });
  });

  test("execute remote service", async t => {
    const Sum = t.context.client.service("math/sum");

    const resource = await rootContext
      .extend({
        networkRetries: 2,
        expectResource: true
      })
      .evaluate(<Sum a={10} b={20} />);

    t.true(isResource(resource));
    t.is(resource.contentType, "text/plain");
    t.is(resource.content, "30");
  });

  test("execute remove service: should fail when sending invalid authorization", async t => {
    const wrongClient = createClient({ apiKey: "wrongString" });
    const WrongSum = wrongClient.service("math/sum");
    await t.throwsAsync(
      rootContext
        .extend({
          networkRetries: 2,
          expectResource: true
        })
        .evaluate(<WrongSum a={10} b={20} />)
    );

    const validClient = createClient({ apiKey: API_KEY });
    const ValidSum = validClient.service("math/sum");
    await t.notThrowsAsync(
      rootContext
        .extend({
          networkRetries: 2,
          expectResource: true
        })
        .evaluate(<ValidSum a={10} b={20} />)
    );
  });

  test("execute remote service with options", async t => {
    const ReturnOption = t.context.client.service("returnOption");

    const resource = await rootContext
      .extend({
        networkRetries: 2,
        expectResource: false, // the content is wrapped into a Resource later by the component (TODO: change this?)
        whatever: "you got it!"
      })
      .evaluate(<ReturnOption optionName="whatever" />);

    t.true(isResource(resource));
    t.is(resource.contentType, "x-webmiddle-any");
    t.is(resource.content, "you got it!");
  });

  test("execute remote service with default options", async t => {
    const ReturnOption = t.context.client.service("returnOption");

    const resource = await rootContext
      .extend({
        networkRetries: 2,
        expectResource: false // the content is wrapped into a Resource later by the component (TODO: change this?)
      })
      .evaluate(<ReturnOption optionName="base" />);

    t.true(isResource(resource));
    t.is(resource.contentType, "x-webmiddle-any");
    t.is(resource.content, "default option");
  });
}
