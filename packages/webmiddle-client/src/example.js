import Client from "./index";
import WebMiddle, { evaluate, createContext } from "webmiddle";

const client = new Client({
  protocol: "http",
  hostname: "localhost",
  port: "3000"
});

const Multiply = client.service("multiply");

const webmiddle = new WebMiddle();
evaluate(createContext(webmiddle, { retries: 2 }), <Multiply a={10} b={20} />)
  .then(result => {
    console.log(result);
  })
  .catch(err => {
    console.log((err && err.stack) || err);
  });
