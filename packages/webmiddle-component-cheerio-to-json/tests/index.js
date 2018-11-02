import test from "ava";
import { rootContext, isResource } from "webmiddle";
import CheerioToJson, { $$ } from "../src/index.js";
import isCheerioCollection from "../src/isCheerioCollection";

const xmlResource = rootContext.createResource(
  "xmlResource",
  "text/xml",
  `
    <bookstore>
      <book category="COOKING">
        <title lang="en">Everyday Italian</title>
        <author>Giada De Laurentiis</author>
        <year>2005</year>
        <price>30.00</price>
      </book>
      <book category="CHILDREN">
        <title lang="en">Harry Potter</title>
        <author>J K. Rowling</author>
        <year>2005</year>
        <price>29.99</price>
      </book>
    </bookstore>
  `
);

test("XML: must return a json resource", async t => {
  const output = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={{
        books: $$.within(
          "book",
          $$.map({
            category: $$.attr("category"),
            lang: $$.within("title", $$.attr("lang")),
            title: $$.getFirst("title"),
            author: $$.getFirst("author"),
            year: $$.postprocess($$.getFirst("year"), yearString =>
              parseInt(yearString, 10)
            ),
            price: $$.postprocess($$.getFirst("price"), priceString =>
              parseFloat(priceString)
            )
          })
        )
      }}
    />
  );

  t.true(isResource(output));
  t.is(output.name, "result", "name");
  t.is(output.contentType, "application/json", "contentType");
  t.deepEqual(output.content, {
    books: [
      {
        category: "COOKING",
        lang: "en",
        title: "Everyday Italian",
        author: "Giada De Laurentiis",
        year: 2005,
        price: 30
      },
      {
        category: "CHILDREN",
        lang: "en",
        title: "Harry Potter",
        author: "J K. Rowling",
        year: 2005,
        price: 29.99
      }
    ]
  });
});

test("Functions should be called correctly (top level)", async t => {
  let fnArgs;
  await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={(...args) => {
        fnArgs = args;
      }}
    />
  );

  t.is(fnArgs.length, 3);
  const [rootEl, $, options] = fnArgs;

  t.true(isCheerioCollection(rootEl));
  t.is(rootEl[0].type, "root");

  t.is(typeof $.root, "function");

  t.is(options.context._isContext, true);
});

test("Functions should be called correctly (inner level)", async t => {
  let fnArgs;
  await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={{
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
    />
  );

  t.is(fnArgs.length, 3);
  const [rootEl, $, options] = fnArgs;

  t.true(isCheerioCollection(rootEl));
  t.is(rootEl[0].type, "root");

  t.is(typeof $.root, "function");

  t.is(options.context._isContext, true);
});

test("Functions should be called correctly (function returning function)", async t => {
  let fnArgs;
  await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={() => () => (...args) => {
        fnArgs = args;
      }}
    />
  );

  t.is(fnArgs.length, 3);
  const [rootEl, $, options] = fnArgs;

  t.true(isCheerioCollection(rootEl));
  t.is(rootEl[0].type, "root");

  t.is(typeof $.root, "function");

  t.is(options.context._isContext, true);
});

test("Promises should be awaited (top level)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={Promise.resolve().then(() => "foo")}
    />
  );

  t.is(result.content, "foo");
});

test("Promises should be awaited (inner level)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={{
        foo: {
          bar: {
            some: {
              more: [false, Promise.resolve().then(() => "foo")]
            }
          }
        }
      }}
    />
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
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={<Sum a={10} b={20} />}
    />
  );

  t.is(result.content, 30);
});

test("Components should be evaluated correctly (inner level)", async t => {
  const Sum = ({ a, b }) => a + b;

  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={{
        foo: {
          bar: {
            some: {
              more: [false, <Sum a={10} b={20} />]
            }
          }
        }
      }}
    />
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
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={() => {
        throw new Error("expected");
      }}
    />
  );

  t.is(result.content, null);
});

test("Should return null content if is undefined", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="result" from={xmlResource} content={() => undefined} />
  );

  t.is(result.content, null);
});

test("DomNode root", async t => {
  let domNode;
  let $;
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={(el, parser) => {
        domNode = el[0];
        $ = parser;
        return domNode;
      }}
    />
  );

  t.is(result.content, $(domNode).val() || $(domNode).text());
});

test("DomNode tag", async t => {
  let domNode;
  let $;
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={(el, $cheerio) => {
        domNode = el.find("book")[0];
        $ = $cheerio;
        return domNode;
      }}
    />
  );

  t.is(result.content, $(domNode).val() || $(domNode).text());
});

test("CheerioCollection", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={el => el.find("title")}
    />
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("Array", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={() => [["foo"], "some"]}
    />
  );

  t.deepEqual(result.content, [["foo"], "some"]);
});

test("Object", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={{ foo: { some: "bar" } }}
    />
  );

  t.deepEqual(result.content, { foo: { some: "bar" } });
});

test("$$: string selector", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="result" from={xmlResource} content={$$("title")} />
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$: element selector", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={el => $$(el.find("title"))}
    />
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$: function selector", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={el => $$($$.getFirst("title"))}
    />
  );

  t.deepEqual(result.content, ["Everyday Italian"]);
});

test("$$: selector as object (should be wrapped in a collection)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={el => $$({ foo: "bar" })}
    />
  );

  t.deepEqual(result.content, [{ foo: "bar" }]);
});

test("$$.within: function selector (returns cheerio collection)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within($$("book"), $$.attr("category"))}
    />
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.within: function selector (returns dom array)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(el => [el.find("book")[0]], $$.attr("category"))}
    />
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.within: function selector (returns single dom element)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(el => el.find("book")[0], $$.attr("category"))}
    />
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.within: function selector (returns single string)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(() => "COOKING", el => el.get()[0])}
    />
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.attr", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within("book", $$.attr("category"))}
    />
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.get", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within("title", $$.get())}
    />
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$.get: zero", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within("title", $$.get(0))}
    />
  );

  t.deepEqual(result.content, "Everyday Italian");
});

test("$$.get: zero (on collections of plain javascript values)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within($$(["title"]), $$.get(0))}
    />
  );

  t.deepEqual(result.content, "title");
});

test("$$.get: one", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within("title", $$.get(1))}
    />
  );

  t.deepEqual(result.content, "Harry Potter");
});

test("$$.getFirst: no argumnet", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within("title", $$.getFirst())}
    />
  );

  t.deepEqual(result.content, "Everyday Italian");
});

test("$$.getFirst: with string argumnet", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.getFirst("title")}
    />
  );

  t.deepEqual(result.content, "Everyday Italian");
});

test("$$.getFirst: with function argumnet", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.getFirst($$("title"))}
    />
  );

  t.deepEqual(result.content, "Everyday Italian");
});

test("$$.map", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(
        "title",
        $$.map({
          title: $$.get(0)
        })
      )}
    />
  );

  t.deepEqual(result.content, [
    { title: "Everyday Italian" },
    { title: "Harry Potter" }
  ]);
});

test("$$.map: strings shouldn't be treated as string selectors", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(
        $$(["title", "book"]),
        $$.map({
          title: $$.get(0)
        })
      )}
    />
  );

  t.deepEqual(result.content, [{ title: "title" }, { title: "book" }]);
});

test("$$.map: empty selector", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(
        $$([]),
        $$.map({
          title: $$.get(0)
        })
      )}
    />
  );

  t.deepEqual(result.content, []);
});

test("$$.map: empty body", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within($$(["title", "book"]), $$.map())}
    />
  );

  t.deepEqual(result.content, [null, null]);
});

test("$$.filter", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(
        "title",
        $$.filter(titleEl => titleEl.text().search(/italian/i) >= 0)
      )}
    />
  );

  t.deepEqual(result.content, ["Everyday Italian"]);
});

test("$$.filter: strings shouldn't be treated as string selectors", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(
        $$(["title", "book"]),
        $$.filter(stringEl => stringEl[0] === "book")
      )}
    />
  );

  t.deepEqual(result.content, ["book"]);
});

test("$$.filter: no condition", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within($$(["title", "book"]), $$.filter())}
    />
  );

  t.deepEqual(result.content, null);
});

test("$$.pipe", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within(
        "title",
        $$.pipe(
          $$.filter(titleEl => titleEl.text().search(/italian/i) >= 0),
          $$.map(titleEl => titleEl.text().toUpperCase())
        )
      )}
    />
  );

  t.deepEqual(result.content, ["EVERYDAY ITALIAN"]);
});

test("$$.pipe: empty tasks: should return the sourceEl", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within("title", $$.pipe())}
    />
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$.pipe: one task", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.within("title", $$.pipe($$.get(0)))}
    />
  );

  t.deepEqual(result.content, ["Everyday Italian"]);
});

test("$$.postprocess", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.postprocess($$("title"), titles =>
        titles.reduce((obj, title) => {
          const key = title.replace(/ /g, "_").toUpperCase();
          obj[key] = () => title; // function should be processed
          return obj;
        }, {})
      )}
    />
  );

  t.deepEqual(result.content, {
    EVERYDAY_ITALIAN: "Everyday Italian",
    HARRY_POTTER: "Harry Potter"
  });
});

test("$$.postprocess: undefined body", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.postprocess(undefined, () => "COOKING")}
    />
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.postprocess: undefined postProcessFn", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson
      name="result"
      from={xmlResource}
      content={$$.postprocess($$("title"))}
    />
  );

  t.deepEqual(result.content, null);
});
