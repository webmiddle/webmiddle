import test from 'ava';
import VirtualToJson from '../src/index.js';
import WebMiddle, { evaluate, createContext } from 'webmiddle';

const virtualResource = {
  name: 'virtualResource',
  contentType: 'application/x-webmiddle-virtual',
  content:
    {
      "type": "root",
      "attributes": {},
      "children": [
        [
          [
            {
              "type": "id",
              "attributes": {},
              "children": [
                "978-0641723445"
              ]
            },
            {
              "type": "cat",
              "attributes": {},
              "children": [
                [
                  "book",
                  "hardcover"
                ]
              ]
            },
            {
              "type": "name",
              "attributes": {},
              "children": [
                "The Lightning Thief"
              ]
            },
            {
              "type": "author",
              "attributes": {},
              "children": [
                "Rick Riordan"
              ]
            },
            {
              "type": "series_t",
              "attributes": {},
              "children": [
                "Percy Jackson and the Olympians"
              ]
            },
            {
              "type": "sequence_i",
              "attributes": {},
              "children": [
                1
              ]
            },
            {
              "type": "genre_s",
              "attributes": {},
              "children": [
                "fantasy"
              ]
            },
            {
              "type": "inStock",
              "attributes": {},
              "children": [
                true
              ]
            },
            {
              "type": "price",
              "attributes": {},
              "children": [
                12.5
              ]
            },
            {
              "type": "pages_i",
              "attributes": {},
              "children": [
                384
              ]
            }
          ],
          [
            {
              "type": "id",
              "attributes": {},
              "children": [
                "978-1423103349"
              ]
            },
            {
              "type": "cat",
              "attributes": {},
              "children": [
                [
                  "book",
                  "paperback"
                ]
              ]
            },
            {
              "type": "name",
              "attributes": {},
              "children": [
                "The Sea of Monsters"
              ]
            },
            {
              "type": "author",
              "attributes": {},
              "children": [
                "Rick Riordan"
              ]
            },
            {
              "type": "series_t",
              "attributes": {},
              "children": [
                "Percy Jackson and the Olympians"
              ]
            },
            {
              "type": "sequence_i",
              "attributes": {},
              "children": [
                2
              ]
            },
            {
              "type": "genre_s",
              "attributes": {},
              "children": [
                "fantasy"
              ]
            },
            {
              "type": "inStock",
              "attributes": {},
              "children": [
                true
              ]
            },
            {
              "type": "price",
              "attributes": {},
              "children": [
                6.49
              ]
            },
            {
              "type": "pages_i",
              "attributes": {},
              "children": [
                304
              ]
            }
          ]
        ]
      ]
    }
  ,
};

test.beforeEach(t => {
  t.context.webmiddle = new WebMiddle();
});

test('fullConversion', async t => {
  const output = await evaluate(createContext(t.context.webmiddle),
    <VirtualToJson
      name="virtual"
      from={virtualResource}
      fullConversion
    />
  );

  t.deepEqual(output.content, {
    root: [
      {
        "id" : "978-0641723445",
        "cat" : ["book","hardcover"],
        "name" : "The Lightning Thief",
        "author" : "Rick Riordan",
        "series_t" : "Percy Jackson and the Olympians",
        "sequence_i" : 1,
        "genre_s" : "fantasy",
        "inStock" : true,
        "price" : 12.50,
        "pages_i" : 384
      },
      {
        "id" : "978-1423103349",
        "cat" : ["book","paperback"],
        "name" : "The Sea of Monsters",
        "author" : "Rick Riordan",
        "series_t" : "Percy Jackson and the Olympians",
        "sequence_i" : 2,
        "genre_s" : "fantasy",
        "inStock" : true,
        "price" : 6.49,
        "pages_i" : 304
      }
    ],
  });
});
