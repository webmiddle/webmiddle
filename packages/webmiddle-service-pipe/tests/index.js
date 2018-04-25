import test from "ava";
import Pipe from "../src/index.js";
import { rootContext, isResource } from "webmiddle";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("main", async t => {
  const FirstService = () =>
    t.context.context.createResource("firstResource", "text/plain", "10");
  const SecondService = ({ num }) =>
    t.context.context.createResource(
      "secondResource",
      "text/plain",
      (num * 10).toString()
    );

  const output = await t.context.context.evaluate(
    <Pipe>
      <FirstService />

      {({ firstResource }) => (
        <SecondService
          name="secondResource"
          num={parseInt(firstResource.content, 10)}
        />
      )}
    </Pipe>
  );

  t.true(isResource(output));
  t.is(output.name, "secondResource", "must return the last resource");
  t.is(output.content, "100", "must pipe resources through listed services");
});

test("expect resource", async t => {
  const Service = () => 10; // a service that doesn't return a resource

  try {
    await t.context.context.evaluate(
      <Pipe>
        <Service />
      </Pipe>
    );
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});
