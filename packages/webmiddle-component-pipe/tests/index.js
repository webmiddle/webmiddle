import test from "ava";
import Pipe from "../src/index.js";
import { rootContext, isResource } from "webmiddle";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("main", async t => {
  const FirstComponent = () =>
    t.context.context.createResource("firstResource", "text/plain", "10");
  const SecondComponent = ({ num }) =>
    t.context.context.createResource(
      "secondResource",
      "text/plain",
      (num * 10).toString()
    );

  const output = await t.context.context.evaluate(
    <Pipe>
      <FirstComponent />

      {firstResource => (
        <SecondComponent num={parseInt(firstResource.content, 10)} />
      )}
    </Pipe>
  );

  t.true(isResource(output));
  t.is(output.name, "secondResource", "must return the last resource");
  t.is(output.content, "100", "must pipe resources through listed components");
});

test("does not expect resource", async t => {
  const Component = () => 10; // a component that doesn't return a resource

  try {
    await t.context.context.evaluate(
      <Pipe>
        <Component />
      </Pipe>
    );
    t.pass();
  } catch (e) {
    t.fail();
  }
});
