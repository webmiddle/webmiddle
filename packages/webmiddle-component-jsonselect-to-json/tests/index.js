import test from "ava";
import { rootContext, isResource } from "webmiddle";
import JSONSelectToJson, { $$ } from "../src/index.js";

const jsonResource = rootContext.createResource(
  "jsonResource",
  "application/json",
  [
    {
      id: "978-0641723445",
      cat: ["book", "hardcover"],
      name: "The Lightning Thief",
      author: "Rick Riordan",
      series_t: "Percy Jackson and the Olympians",
      sequence_i: 1,
      genre_s: "fantasy",
      inStock: true,
      price: 12.5,
      pages_i: 384
    },
    {
      id: "978-1423103349",
      cat: ["book", "paperback"],
      name: "The Sea of Monsters",
      author: "Rick Riordan",
      series_t: "Percy Jackson and the Olympians",
      sequence_i: 2,
      genre_s: "fantasy",
      inStock: true,
      price: 6.49,
      pages_i: 304
    }
  ]
);

test.beforeEach(t => {
  t.context.context = rootContext;
});

test("Must return a json resource", async t => {
  const output = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {{
        books: $$.within(
          ":root > *",
          $$.map({
            name: $$.within(".name", $$.get(0)),
            genre: $$.within(
              ".genre_s",
              $$.postprocess($$.get(0), genreString =>
                genreString.toUpperCase()
              )
            )
          })
        )
      }}
    </JSONSelectToJson>
  );

  t.true(isResource(output));
  t.is(output.name, "result", "name");
  t.is(output.contentType, "application/json", "contentType");
  t.deepEqual(output.content, {
    books: [
      {
        name: "The Lightning Thief",
        genre: "FANTASY"
      },
      {
        name: "The Sea of Monsters",
        genre: "FANTASY"
      }
    ]
  });
});

test("Should throw when children length isn't exactly one", async t => {
  await t.throwsAsync(
    rootContext.evaluate(<JSONSelectToJson name="result" from={jsonResource} />)
  );

  await t.throwsAsync(
    rootContext.evaluate(
      <JSONSelectToJson name="result" from={jsonResource}>
        {() => {}}
        {() => {}}
      </JSONSelectToJson>
    )
  );

  await t.notThrowsAsync(
    rootContext.evaluate(
      <JSONSelectToJson name="result" from={jsonResource}>
        {() => {}}
      </JSONSelectToJson>
    )
  );
});

test("Functions should be called correctly (top level)", async t => {
  let fnArgs;
  await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {(...args) => {
        fnArgs = args;
      }}
    </JSONSelectToJson>
  );

  t.is(fnArgs.length, 3);
  const [rootEl, JSONSelect, options] = fnArgs;

  t.true(Array.isArray(rootEl));
  t.is(rootEl.length, 1);
  t.is(rootEl[0], jsonResource.content);

  t.is(typeof JSONSelect.match, "function");

  t.is(options.context._isContext, true);
});

test("Functions should be called correctly (inner level)", async t => {
  let fnArgs;
  await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {{
        foo: {
          bar: {
            some: {
              more: [
                false,
                (...args) => {
                  fnArgs = args;
                }
              ]
            }
          }
        }
      }}
    </JSONSelectToJson>
  );

  t.is(fnArgs.length, 3);
  const [rootEl, JSONSelect, options] = fnArgs;

  t.true(Array.isArray(rootEl));
  t.is(rootEl.length, 1);
  t.is(rootEl[0], jsonResource.content);

  t.is(typeof JSONSelect.match, "function");

  t.is(options.context._isContext, true);
});

test("Functions should be called correctly (function returning function)", async t => {
  let fnArgs;
  await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {() => () => (...args) => {
        fnArgs = args;
      }}
    </JSONSelectToJson>
  );

  t.is(fnArgs.length, 3);
  const [rootEl, JSONSelect, options] = fnArgs;

  t.true(Array.isArray(rootEl));
  t.is(rootEl.length, 1);
  t.is(rootEl[0], jsonResource.content);

  t.is(typeof JSONSelect.match, "function");

  t.is(options.context._isContext, true);
});

test("Promises should be awaited (top level)", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {Promise.resolve().then(() => "foo")}
    </JSONSelectToJson>
  );

  t.is(result.content, "foo");
});

test("Promises should be awaited (inner level)", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {{
        foo: {
          bar: {
            some: {
              more: [false, Promise.resolve().then(() => "foo")]
            }
          }
        }
      }}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, {
    foo: {
      bar: {
        some: {
          more: [false, "foo"]
        }
      }
    }
  });
});

test("Components should be evaluated correctly (top level)", async t => {
  const Sum = ({ a, b }) => a + b;

  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      <Sum a={10} b={20} />
    </JSONSelectToJson>
  );

  t.is(result.content, 30);
});

test("Components should be evaluated correctly (inner level)", async t => {
  const Sum = ({ a, b }) => a + b;

  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {{
        foo: {
          bar: {
            some: {
              more: [false, <Sum a={10} b={20} />]
            }
          }
        }
      }}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, {
    foo: {
      bar: {
        some: {
          more: [false, 30]
        }
      }
    }
  });
});

test("Should return null content in case of exception", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {() => {
        throw new Error("expected");
      }}
    </JSONSelectToJson>
  );

  t.is(result.content, null);
});

test("Should return null content if is undefined", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {() => undefined}
    </JSONSelectToJson>
  );

  t.is(result.content, null);
});

test("Root value", async t => {
  let rootValue;
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {el => {
        rootValue = el[0];
        return rootValue;
      }}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, rootValue);
});

test("Collection", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {el => el}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, [jsonResource.content]);
});

test("Array", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {() => [["foo"], "some"]}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, [["foo"], "some"]);
});

test("Object", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {{ foo: { some: "bar" } }}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, { foo: { some: "bar" } });
});

test("$$: string selector", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$(".name")}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["The Lightning Thief", "The Sea of Monsters"]);
});

test("$$.find", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.find(".name")}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["The Lightning Thief", "The Sea of Monsters"]);
});

test("$$.within: function selector (returns collection)", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within($$.find(".name"), $$.get(0))}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, "The Lightning Thief");
});

test("$$.within: function selector (returns single value)", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(() => "COOKING", $$.get(0))}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.get", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(".name", $$.get())}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["The Lightning Thief", "The Sea of Monsters"]);
});

test("$$.get: zero", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(".name", $$.get(0))}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, "The Lightning Thief");
});

test("$$.get: zero (on collections of plain javascript values)", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within($$(["title"]), $$.get(0))}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, "title");
});

test("$$.get: one", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(".name", $$.get(1))}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, "The Sea of Monsters");
});

test("$$.map", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(
        ".name",
        $$.map({
          title: $$.get(0)
        })
      )}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, [
    { title: "The Lightning Thief" },
    { title: "The Sea of Monsters" }
  ]);
});

test("$$.map: strings shouldn't be treated as string selectors", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(
        $$(["title", "book"]),
        $$.map({
          title: $$.get(0)
        })
      )}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, [{ title: "title" }, { title: "book" }]);
});

test("$$.map: empty selector", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(
        $$([]),
        $$.map({
          title: $$.get(0)
        })
      )}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, []);
});

test("$$.map: empty body", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within($$(["title", "book"]), $$.map())}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, [null, null]);
});

test("$$.filter", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(
        ".name",
        $$.filter(nameEl => nameEl[0].search(/monsters/i) >= 0)
      )}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["The Sea of Monsters"]);
});

test("$$.filter: strings shouldn't be treated as string selectors", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(
        $$(["title", "book"]),
        $$.filter(stringEl => stringEl[0] === "book")
      )}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["book"]);
});

test("$$.filter: no condition", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within($$(["title", "book"]), $$.filter())}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, null);
});

test("$$.pipe", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(
        ".name",
        $$.pipe(
          $$.filter(nameEl => nameEl[0].search(/monsters/i) >= 0),
          $$.map(nameEl => nameEl[0].toUpperCase())
        )
      )}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["THE SEA OF MONSTERS"]);
});

test("$$.pipe: empty tasks: should return the sourceEl", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(".name", $$.pipe())}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["The Lightning Thief", "The Sea of Monsters"]);
});

test("$$.pipe: one task", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.within(".name", $$.pipe($$.get(0)))}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, ["The Lightning Thief"]);
});

test("$$.postprocess", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.postprocess($$(".name"), titles =>
        titles.reduce((obj, title) => {
          const key = title.replace(/ /g, "_").toUpperCase();
          obj[key] = () => title; // function should be processed
          return obj;
        }, {})
      )}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, {
    THE_LIGHTNING_THIEF: "The Lightning Thief",
    THE_SEA_OF_MONSTERS: "The Sea of Monsters"
  });
});

test("$$.postprocess: undefined body", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.postprocess(undefined, () => "COOKING")}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.postprocess: undefined postProcessFn", async t => {
  const result = await rootContext.evaluate(
    <JSONSelectToJson name="result" from={jsonResource}>
      {$$.postprocess($$("title"))}
    </JSONSelectToJson>
  );

  t.deepEqual(result.content, null);
});
