import Client from "./index";
import webmiddle, { evaluate, createContext } from "webmiddle";

const client = new Client({
  protocol: "http",
  hostname: "localhost",
  port: "3000"
});

const Multiply = client.service("multiply");

evaluate(createContext({ retries: 2 }), <Multiply a={10} b={20} />)
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.log((err && err.stack) || err);
  });
