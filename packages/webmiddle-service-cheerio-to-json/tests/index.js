import test from "ava";
import CheerioToJson, { helpers } from "../src/index.js";
import { rootContext } from "webmiddle";

const { elMap, elText } = helpers;

const xmlResource = {
  name: "xmlResource",
  contentType: "text/xml",
  content: `
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
};

test("must return a json resource", async t => {
  const output = await rootContext.evaluate(
    <CheerioToJson name="virtual" from={xmlResource}>
      <titles el="title">
        {elMap(el => <title el={el}>{elText()}</title>)}
      </titles>
    </CheerioToJson>
  );

  t.is(output.name, "virtual", "name");
  t.is(output.contentType, "application/json", "contentType");

  t.deepEqual(output.content, {
    root: {
      titles: [
        {
          title: "Everyday Italian"
        },
        {
          title: "Harry Potter"
        }
      ]
    }
  });
});
