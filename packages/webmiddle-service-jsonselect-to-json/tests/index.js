import test from "ava";
import JSONSelectToJson from "../src/index.js";
import webmiddle, { evaluate, createContext } from "webmiddle";

const jsonResource = {
  name: "jsonResource",
  contentType: "application/json",
  content: [
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
};

test.beforeEach(t => {
  t.context.context = createContext();
});

test("must return a json resource", async t => {
  const output = await evaluate(
    createContext(t.context.context),
    <JSONSelectToJson name="virtual" from={jsonResource}>
      <names el=".name">{els => els.map(el => <name>{el}</name>)}</names>
    </JSONSelectToJson>
  );

  t.is(output.name, "virtual", "name");
  t.is(output.contentType, "application/json", "contentType");

  t.deepEqual(output.content, {
    root: {
      names: [
        {
          name: "The Lightning Thief"
        },
        {
          name: "The Sea of Monsters"
        }
      ]
    }
  });
});
