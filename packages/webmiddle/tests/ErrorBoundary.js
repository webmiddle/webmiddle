// HACK: transpile JSX by using the src webmiddle object
// instead that the compiled one obtained by the default require('webmiddle')
import webmiddle from "../src/index.js";
global.webmiddle = webmiddle;

import test from "ava";
import { rootContext, ErrorBoundary } from "../src/index.js";

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("should evaluate child normally if there arent errors (string)", async t => {
  const output = await t.context.context.evaluate(
    <ErrorBoundary try={"success"} />
  );

  t.is(output, "success");
});

test("should evaluate child normally if there arent errors (function)", async t => {
  const output = await t.context.context.evaluate(
    <ErrorBoundary try={() => "success"} />
  );

  t.is(output, "success");
});

test("should evaluate child normally if there arent errors (promise)", async t => {
  const output = await t.context.context.evaluate(
    <ErrorBoundary try={Promise.resolve("success")} />
  );

  t.is(output, "success");
});

test("should evaluate child normally if there arent errors (virtual)", async t => {
  const Component = ({ str }) => str;

  const output = await t.context.context.evaluate(
    <ErrorBoundary try={<Component str="success" />} />
  );

  t.is(output, "success");
});

test("should default to zero retries and no catch", async t => {
  let tries = 0;

  await t.throwsAsync(
    t.context.context.evaluate(
      <ErrorBoundary
        try={() => {
          tries++;
          throw new Error("expected fail");
        }}
      />
    )
  );

  t.is(tries, 1);
});

test("zero retries", async t => {
  let tries = 0;
  const retries = 0;

  await t.throwsAsync(
    t.context.context.evaluate(
      <ErrorBoundary
        retries={retries}
        try={() => {
          tries++;
          throw new Error("expected fail");
        }}
      />
    )
  );

  t.is(tries, retries + 1);
});

test("positive retries", async t => {
  let tries = 0;
  const retries = 3;

  await t.throwsAsync(
    t.context.context.evaluate(
      <ErrorBoundary
        retries={retries}
        try={() => {
          tries++;
          throw new Error("expected fail");
        }}
      />
    )
  );

  t.is(tries, retries + 1);
});

test("unlimited retries", async t => {
  let tries = 0;
  const retries = -1;

  await t.throwsAsync(
    t.context.context.evaluate(
      <ErrorBoundary
        retries={retries}
        isRetryable={() => tries < 3}
        try={() => {
          tries++;
          throw new Error("expected fail");
        }}
      />
    )
  );

  t.is(tries, 3);
});

test("isRetryable: false", async t => {
  let tries = 0;
  const retries = 3;

  await t.throwsAsync(
    t.context.context.evaluate(
      <ErrorBoundary
        retries={retries}
        isRetryable={() => false}
        try={() => {
          tries++;
          throw new Error("expected fail");
        }}
      />
    )
  );

  t.is(tries, 1);
});

test("isRetryable as a function returning a promise", async t => {
  let tries = 0;
  const retries = 3;

  await t.throwsAsync(
    t.context.context.evaluate(
      <ErrorBoundary
        retries={retries}
        isRetryable={() => Promise.resolve(true)}
        try={() => {
          tries++;
          throw new Error("expected fail");
        }}
      />
    )
  );

  t.is(tries, retries + 1);
});

test("catch as a string", async t => {
  let tries = 0;

  const output = await t.context.context.evaluate(
    <ErrorBoundary
      catch={"fallback"}
      try={() => {
        tries++;
        throw new Error("expected fail");
      }}
    />
  );

  t.is(tries, 1);
  t.is(output, "fallback");
});

test("catch as a function returning a promise", async t => {
  let tries = 0;

  const output = await t.context.context.evaluate(
    <ErrorBoundary
      catch={() => Promise.resolve("fallback")}
      try={() => {
        tries++;
        throw new Error("expected fail");
      }}
    />
  );

  t.is(tries, 1);
  t.is(output, "fallback");
});

test("catch as a virtual", async t => {
  let tries = 0;

  const Component = ({ str }) => str;

  const output = await t.context.context.evaluate(
    <ErrorBoundary
      try={() => {
        tries++;
        throw new Error("expected fail");
      }}
      catch={<Component str="fallback" />}
    />
  );

  t.is(tries, 1);
  t.is(output, "fallback");
});

test("retries + catch", async t => {
  let tries = 0;
  const retries = 3;

  const output = await t.context.context.evaluate(
    <ErrorBoundary
      retries={retries}
      catch={"fallback"}
      try={() => {
        tries++;
        throw new Error("expected fail");
      }}
    />
  );

  t.is(tries, retries + 1);
  t.is(output, "fallback");
});
