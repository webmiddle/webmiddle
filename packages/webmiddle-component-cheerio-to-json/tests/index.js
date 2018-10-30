import test from "ava";
import { rootContext, isResource } from "webmiddle";
import CheerioToJson, { $$ } from "../src/index.js";
import isCheerioCollection from "../src/isCheerioCollection";
import isDomNode from "../src/isDomNode";

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

test("Should throw when children length isn't exactly one", async t => {
  await t.throwsAsync(
    rootContext.evaluate(<CheerioToJson name="virtual" from={xmlResource} />)
  );

  await t.throwsAsync(
    rootContext.evaluate(
      <CheerioToJson name="virtual" from={xmlResource}>
        {() => {}}
        {() => {}}
      </CheerioToJson>
    )
  );

  await t.notThrowsAsync(
    rootContext.evaluate(
      <CheerioToJson name="virtual" from={xmlResource}>
        {() => {}}
      </CheerioToJson>
    )
  );
});

test("XML: must return a json resource", async t => {
  const output = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {{
        books: $$.within(
          "book",
          $$.map({
            category: $$.attr("category"),
            lang: $$.within("title", $$.attr("lang")),
            title: $$.within("title", $$.value()),
            author: $$.within("author", $$.value()),
            year: $$.within(
              "year",
              $$.postprocess($$.value(), yearString => parseInt(yearString, 10))
            ),
            price: $$.within(
              "price",
              $$.postprocess($$.value(), priceString => parseFloat(priceString))
            )
          })
        )
      }}
    </CheerioToJson>
  );

  t.true(isResource(output));
  t.is(output.name, "virtual", "name");
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
    <CheerioToJson name="virtual" from={xmlResource}>
      {(...args) => {
        fnArgs = args;
      }}
    </CheerioToJson>
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
    <CheerioToJson name="virtual" from={xmlResource}>
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
    </CheerioToJson>
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
    <CheerioToJson name="virtual" from={xmlResource}>
      {() => () => (...args) => {
        fnArgs = args;
      }}
    </CheerioToJson>
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
    <CheerioToJson name="virtual" from={xmlResource}>
      {Promise.resolve().then(() => "foo")}
    </CheerioToJson>
  );

  t.is(result.content, "foo");
});

test("Promises should be awaited (inner level)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {{
        foo: {
          bar: {
            some: {
              more: [false, Promise.resolve().then(() => "foo")]
            }
          }
        }
      }}
    </CheerioToJson>
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
    <CheerioToJson name="virtual" from={xmlResource}>
      <Sum a={10} b={20} />
    </CheerioToJson>
  );

  t.is(result.content, 30);
});

test("Components should be evaluated correctly (inner level)", async t => {
  const Sum = ({ a, b }) => a + b;

  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {{
        foo: {
          bar: {
            some: {
              more: [false, <Sum a={10} b={20} />]
            }
          }
        }
      }}
    </CheerioToJson>
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
    <CheerioToJson name="virtual" from={xmlResource}>
      {() => {
        throw new Error("expected");
      }}
    </CheerioToJson>
  );

  t.is(result.content, null);
});

test("Should return null content if is undefined", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {() => undefined}
    </CheerioToJson>
  );

  t.is(result.content, null);
});

test("DomNode root", async t => {
  let domNode;
  let $;
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {(el, parser) => {
        domNode = el[0];
        $ = parser;
        return domNode;
      }}
    </CheerioToJson>
  );

  t.is(result.content, $(domNode).val() || $(domNode).text());
});

test("DomNode tag", async t => {
  let domNode;
  let $;
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {(el, $cheerio) => {
        domNode = el.find("book")[0];
        $ = $cheerio;
        return domNode;
      }}
    </CheerioToJson>
  );

  t.is(result.content, $(domNode).val() || $(domNode).text());
});

test("CheerioCollection", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {el => el.find("title")}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("Array", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {() => [["foo"], "some"]}
    </CheerioToJson>
  );

  t.deepEqual(result.content, [["foo"], "some"]);
});

test("Object", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {{ foo: { some: "bar" } }}
    </CheerioToJson>
  );

  t.deepEqual(result.content, { foo: { some: "bar" } });
});

test("$$: string selector", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$("title")}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$: element selector", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {el => $$(el.find("title"))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$.find", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.find("title")}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$.within: function selector (returns cheerio collection)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within($$.find("book"), $$.attr("category"))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.within: function selector (returns dom array)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within(el => [el.find("book")[0]], $$.attr("category"))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.within: function selector (returns single dom element)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within(el => el.find("book")[0], $$.attr("category"))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.within: function selector (returns single string)", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within(() => "COOKING", el => el.get()[0])}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.attr", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within("book", $$.attr("category"))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.value", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within("title", $$.value())}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "Everyday Italian");
});

test("$$.value: on collections of plain javascript values", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within($$(["title"]), $$.value)}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "title");
});

test("$$.map", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within("title", $$.map($$.value()))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$.map: strings shouldn't be treated as string selectors", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within($$(["title", "book"]), $$.map($$.value()))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["title", "book"]);
});

test("$$.map: empty selector", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within($$([]), $$.map($$.value()))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, []);
});

test("$$.map: empty body", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within($$(["title", "book"]), $$.map())}
    </CheerioToJson>
  );

  t.deepEqual(result.content, [null, null]);
});

test("$$.filter", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within(
        "title",
        $$.filter(titleEl => titleEl.text().search(/italian/i) >= 0)
      )}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian"]);
});

test("$$.filter: strings shouldn't be treated as string selectors", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within(
        $$(["title", "book"]),
        $$.filter(stringEl => stringEl[0] === "book")
      )}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["book"]);
});

test("$$.filter: no condition", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within($$(["title", "book"]), $$.filter())}
    </CheerioToJson>
  );

  t.deepEqual(result.content, null);
});

test("$$.pipe", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within(
        "title",
        $$.pipe(
          $$.filter(titleEl => titleEl.text().search(/italian/i) >= 0),
          $$.map(titleEl => titleEl.text().toUpperCase())
        )
      )}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["EVERYDAY ITALIAN"]);
});

test("$$.pipe: empty tasks: should return the sourceEl", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within("title", $$.pipe())}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian", "Harry Potter"]);
});

test("$$.pipe: one task", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.within("title", $$.pipe($$.value()))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, ["Everyday Italian"]);
});

test("$$.postprocess", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.postprocess($$("title"), titles =>
        titles.reduce((obj, title) => {
          const key = title.replace(/ /g, "_").toUpperCase();
          obj[key] = () => title; // function should be processed
          return obj;
        }, {})
      )}
    </CheerioToJson>
  );

  t.deepEqual(result.content, {
    EVERYDAY_ITALIAN: "Everyday Italian",
    HARRY_POTTER: "Harry Potter"
  });
});

test("$$.postprocess: undefined body", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.postprocess(undefined, () => "COOKING")}
    </CheerioToJson>
  );

  t.deepEqual(result.content, "COOKING");
});

test("$$.postprocess: undefined postProcessFn", async t => {
  const result = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      {$$.postprocess($$("title"))}
    </CheerioToJson>
  );

  t.deepEqual(result.content, null);
});
