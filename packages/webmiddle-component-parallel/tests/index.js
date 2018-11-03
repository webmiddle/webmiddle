import test from "ava";
import Parallel from "../src/index.js";
import { rootContext, isResource } from "webmiddle";

function range(num) {
  return [...Array(num).keys()];
}

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("main: tasks as object", async t => {
  let firstStart;
  let secondStart;
  let firstEnd;
  let secondEnd;

  const FirstComponent = () =>
    new Promise(resolve => {
      firstStart = Date.now();
      setTimeout(() => {
        firstEnd = Date.now();
        resolve(
          t.context.context.createResource("firstResource", "text/plain", "1")
        );
      }, 100);
    });
  const SecondComponent = () =>
    new Promise(resolve => {
      secondStart = Date.now();
      setTimeout(() => {
        secondEnd = Date.now();
        resolve(
          t.context.context.createResource("secondResource", "text/plain", "2")
        );
      }, 100);
    });

  const output = await t.context.context.evaluate(
    <Parallel
      name="resources"
      tasks={{
        firstResource: <FirstComponent />,
        secondResource: <SecondComponent />
      }}
    />
  );

  t.true(isResource(output));
  t.is(output.name, "resources", "name");
  t.is(output.contentType, "x-webmiddle-type", "contentType");

  t.true(isResource(output.content.firstResource));
  t.is(output.content.firstResource.name, "firstResource");
  t.is(output.content.firstResource.contentType, "text/plain");
  t.is(output.content.firstResource.content, "1");

  t.true(isResource(output.content.secondResource));
  t.is(output.content.secondResource.name, "secondResource");
  t.is(output.content.secondResource.contentType, "text/plain");
  t.is(output.content.secondResource.content, "2");

  t.true(
    firstStart < secondEnd && secondStart < firstEnd,
    "components must run concurrently"
  );
});

test("main: tasks as array", async t => {
  const output = await rootContext.evaluate(
    <Parallel
      name="resources"
      tasks={[1, 2].map((num, index) =>
        rootContext.createResource(
          `resource ${index}`,
          "text/plain",
          `${num} ${index}`
        )
      )}
    />
  );

  t.true(isResource(output));
  t.is(output.name, "resources", "name");
  t.is(output.contentType, "x-webmiddle-type", "contentType");

  t.true(isResource(output.content[0]));
  t.is(output.content[0].name, "resource 0");
  t.is(output.content[0].contentType, "text/plain");
  t.is(output.content[0].content, "1 0");

  t.true(isResource(output.content[1]));
  t.is(output.content[1].name, "resource 1");
  t.is(output.content[1].contentType, "text/plain");
  t.is(output.content[1].content, "2 1");
});

test("limit", async t => {
  const limit = 10;
  let current = 0;
  let overLimit = false;

  const Component = () => {
    current++;
    //console.log('exec', current);
    if (current > limit) {
      overLimit = true;
    }
    return new Promise(resolve => {
      setTimeout(() => {
        current--;
        //console.log('done', current);
        resolve(
          t.context.context.createResource("whatever", "text/plain", "whatever")
        );
      }, 100);
    });
  };

  current = 0;
  overLimit = false;
  await t.context.context.evaluate(
    <Parallel
      name="resources"
      limit={limit}
      tasks={range(100).map(i => (
        <Component name={i} />
      ))}
    />
  );

  t.is(overLimit, false, "with limit");

  current = 0;
  overLimit = false;
  await t.context.context.evaluate(
    <Parallel
      name="resources"
      limit={0}
      tasks={range(100).map(i => (
        <Component name={i} />
      ))}
    />
  );

  t.is(overLimit, true, "without limit");
});

test("expect resource", async t => {
  const Component = () => 10; // a component that doesn't return a resource

  try {
    await t.context.context.evaluate(
      <Parallel name="whatever" tasks={[<Component />]} />
    );
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});
