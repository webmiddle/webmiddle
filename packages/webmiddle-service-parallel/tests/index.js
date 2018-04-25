import test from "ava";
import Parallel from "../src/index.js";
import { rootContext, isResource } from "webmiddle";

function range(num) {
  return [...Array(num).keys()];
}

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("main", async t => {
  let firstStart;
  let secondStart;
  let firstEnd;
  let secondEnd;

  const FirstService = () =>
    new Promise(resolve => {
      firstStart = Date.now();
      setTimeout(() => {
        firstEnd = Date.now();
        resolve(
          t.context.context.createResource("firstResource", "text/plain", "1")
        );
      }, 100);
    });
  const SecondService = () =>
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
    <Parallel name="resources">
      <FirstService />
      <SecondService />
    </Parallel>
  );

  t.true(isResource(output));
  t.is(output.name, "resources", "name");
  t.is(output.contentType, "application/json", "contentType");

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
    "services must run concurrently"
  );
});

test("expect resource", async t => {
  const Service = () => 10; // a service that doesn't return a resource

  try {
    await t.context.context.evaluate(
      <Parallel name="whatever">
        <Service />
      </Parallel>
    );
    t.fail("expected rejection");
  } catch (e) {
    t.pass();
  }
});

test("limit", async t => {
  const limit = 10;
  let current = 0;
  let overLimit = false;

  const Service = () => {
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
    <Parallel name="resources" limit={limit}>
      {range(100).map(i => <Service name={i} />)}
    </Parallel>
  );

  t.is(overLimit, false, "with limit");

  current = 0;
  overLimit = false;
  await t.context.context.evaluate(
    <Parallel name="resources" limit={0}>
      {range(100).map(i => <Service name={i} />)}
    </Parallel>
  );

  t.is(overLimit, true, "without limit");
});
