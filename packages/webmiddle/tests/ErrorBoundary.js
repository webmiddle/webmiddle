// HACK: transpile JSX by using the src webmiddle object
// instead that the compiled one obtained by the default require('webmiddle')
import webmiddle from "../src/index.js";
global.webmiddle = webmiddle;

import test from "ava";
import { rootContext, ErrorBoundary } from "../src/index.js";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("should throw without exactly one child", async t => {
  await t.throws(t.context.context.evaluate(<ErrorBoundary />));

  await t.throws(
    t.context.context.evaluate(
      <ErrorBoundary>
        {"first"}
        {"second"}
      </ErrorBoundary>
    )
  );
});

test("should evaluate child normally if there arent errors (string)", async t => {
  const output = await t.context.context.evaluate(
    <ErrorBoundary>{"success"}</ErrorBoundary>
  );

  t.is(output, "success");
});

test("should evaluate child normally if there arent errors (function)", async t => {
  const output = await t.context.context.evaluate(
    <ErrorBoundary>{() => "success"}</ErrorBoundary>
  );

  t.is(output, "success");
});

test("should evaluate child normally if there arent errors (promise)", async t => {
  const output = await t.context.context.evaluate(
    <ErrorBoundary>{Promise.resolve("success")}</ErrorBoundary>
  );

  t.is(output, "success");
});

test("should evaluate child normally if there arent errors (virtual)", async t => {
  const Service = ({ str }) => str;

  const output = await t.context.context.evaluate(
    <ErrorBoundary>
      <Service str="success" />
    </ErrorBoundary>
  );

  t.is(output, "success");
});

test("should default to zero retries and no handleCatch", async t => {
  let tries = 0;

  await t.throws(
    t.context.context.evaluate(
      <ErrorBoundary>
        {() => {
          tries++;
          throw new Error("expected fail");
        }}
      </ErrorBoundary>
    )
  );

  t.is(tries, 1);
});

test("zero retries", async t => {
  let tries = 0;
  const retries = 0;

  await t.throws(
    t.context.context.evaluate(
      <ErrorBoundary retries={retries}>
        {() => {
          tries++;
          throw new Error("expected fail");
        }}
      </ErrorBoundary>
    )
  );

  t.is(tries, retries + 1);
});

test("positive retries", async t => {
  let tries = 0;
  const retries = 3;

  await t.throws(
    t.context.context.evaluate(
      <ErrorBoundary retries={retries}>
        {() => {
          tries++;
          throw new Error("expected fail");
        }}
      </ErrorBoundary>
    )
  );

  t.is(tries, retries + 1);
});

test("unlimited retries", async t => {
  let tries = 0;
  const retries = -1;

  await t.throws(
    t.context.context.evaluate(
      <ErrorBoundary retries={retries} isRetryable={() => tries < 3}>
        {() => {
          tries++;
          throw new Error("expected fail");
        }}
      </ErrorBoundary>
    )
  );

  t.is(tries, 3);
});

test("isRetryable: false", async t => {
  let tries = 0;
  const retries = 3;

  await t.throws(
    t.context.context.evaluate(
      <ErrorBoundary retries={retries} isRetryable={() => false}>
        {() => {
          tries++;
          throw new Error("expected fail");
        }}
      </ErrorBoundary>
    )
  );

  t.is(tries, 1);
});

test("isRetryable as a function returning a promise", async t => {
  let tries = 0;
  const retries = 3;

  await t.throws(
    t.context.context.evaluate(
      <ErrorBoundary
        retries={retries}
        isRetryable={() => Promise.resolve(true)}
      >
        {() => {
          tries++;
          throw new Error("expected fail");
        }}
      </ErrorBoundary>
    )
  );

  t.is(tries, retries + 1);
});

test("handleCatch as a string", async t => {
  let tries = 0;

  const output = await t.context.context.evaluate(
    <ErrorBoundary handleCatch={"fallback"}>
      {() => {
        tries++;
        throw new Error("expected fail");
      }}
    </ErrorBoundary>
  );

  t.is(tries, 1);
  t.is(output, "fallback");
});

test("handleCatch as a function returning a promise", async t => {
  let tries = 0;

  const output = await t.context.context.evaluate(
    <ErrorBoundary handleCatch={() => Promise.resolve("fallback")}>
      {() => {
        tries++;
        throw new Error("expected fail");
      }}
    </ErrorBoundary>
  );

  t.is(tries, 1);
  t.is(output, "fallback");
});

test("handleCatch as a virtual", async t => {
  let tries = 0;

  const Service = ({ str }) => str;

  const output = await t.context.context.evaluate(
    <ErrorBoundary handleCatch={<Service str="fallback" />}>
      {() => {
        tries++;
        throw new Error("expected fail");
      }}
    </ErrorBoundary>
  );

  t.is(tries, 1);
  t.is(output, "fallback");
});

test("retries + handleCatch", async t => {
  let tries = 0;
  const retries = 3;

  const output = await t.context.context.evaluate(
    <ErrorBoundary retries={retries} handleCatch={"fallback"}>
      {() => {
        tries++;
        throw new Error("expected fail");
      }}
    </ErrorBoundary>
  );

  t.is(tries, retries + 1);
  t.is(output, "fallback");
});
