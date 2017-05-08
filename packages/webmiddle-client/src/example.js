import webmiddleClient from './index';
import WebMiddle, { evaluate, createContext } from 'webmiddle';

webmiddleClient({
  protocol: 'http',
  hostname: 'localhost',
  port: '3000',
})
.then(webmiddleRemote => {
  const Multiply = webmiddleRemote.service('multiply');

  evaluate(createContext(webmiddleRemote, { retries: 2 }),
    <Multiply
      a={10}
      b={20}
    />
  ).then(result => {
    console.log(result);
  });
})
.catch(err => {
  console.log(err && err.stack || err);
});
