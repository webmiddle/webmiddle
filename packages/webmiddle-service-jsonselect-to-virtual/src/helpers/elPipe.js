export function elPipe(tasks) {
  return el => tasks.reduce((currValue, task) => task(currValue), el);
}
