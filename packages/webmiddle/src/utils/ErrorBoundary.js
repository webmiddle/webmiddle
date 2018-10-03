import PropTypes from "proptypes"; // explicit import because of circular dependency with index

function Catch({ handler, err }) {
  if (typeof handler === "function") handler = handler(err);
  return handler;
}

// Separate Try component makes sure the callStateInfo
// contains a visible "Try" component call
function Try({ children }) {
  return children[0];
}

const trueFn = () => true;

// TODO: use evaluate for isRetryable and catch?
export default function ErrorBoundary(
  { children, retries, isRetryable, handleCatch },
  context
) {
  if (children.length !== 1) {
    throw new Error("ErrorBoundary MUST get exactly one child!");
  }

  retries = typeof retries === "undefined" ? 0 : retries;
  isRetryable = typeof isRetryable === "undefined" ? trueFn : isRetryable;

  const tryNext = async tries => {
    try {
      return await context.evaluate(<Try>{children}</Try>);
    } catch (err) {
      console.error(err instanceof Error ? err.stack : err);

      // Note: still use the old context in case of error
      // since the tries should show as a list in the callState

      if (!(await isRetryable(err))) throw err;

      if (tries === retries + 1) {
        // last resort
        if (typeof handleCatch === "undefined") throw err;
        return <Catch err={err} handler={handleCatch} />;
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
  children: PropTypes.array.isRequired,
  retries: PropTypes.number,
  isRetryable: PropTypes.func,
  handleCatch: PropTypes.any
};
