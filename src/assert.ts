export default function assert(condition: boolean, string?: string): asserts condition {
    if (!condition) {
        // eslint-disable-next-line no-debugger
        debugger;
        throw new Error(string ?? "Assertion failed");
    }
}