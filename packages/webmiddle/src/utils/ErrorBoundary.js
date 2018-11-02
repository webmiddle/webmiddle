import PropTypes from "proptypes"; // explicit import because of circular dependency with index

function Catch({ handler, err }) {
  if (typeof handler === "function") handler = handler(err);
  return handler;
}

// Separate Try component makes sure the call state
// contains a visible "Try" component call
function Try({ handler }) {
  return handler;
}

const trueFn = () => true;

// TODO: use evaluate for isRetryable and catch?
export default function ErrorBoundary(props, context) {
  const retries = typeof props.retries === "undefined" ? 0 : props.retries;
  const isRetryable =
    typeof props.isRetryable === "undefined" ? trueFn : props.isRetryable;

  const tryNext = async tries => {
    try {
      return await context.evaluate(<Try handler={props.try} />);
    } catch (err) {
      console.error(err instanceof Error ? err.stack : err);

      // Note: still use the old context in case of error
      // since the tries should show as a list in the call state

      if (!(await isRetryable(err))) throw err;

      if (tries === retries + 1) {
        // last resort
        if (typeof props.catch === "undefined") throw err;
        return <Catch err={err} handler={props.catch} />;
      }

      const retriesLeft = retries - (tries - 1);
      console.log(
        "Retries left:",
        retriesLeft < 0 ? "(infinity)" : retriesLeft,
        "Tries",
        tries
      );
      return tryNext(tries + 1);
    }
  };
  return tryNext(1);
}

ErrorBoundary.propTypes = {
  retries: PropTypes.number,
  isRetryable: PropTypes.func,
  try: PropTypes.any.isRequired,
  catch: PropTypes.any
};
