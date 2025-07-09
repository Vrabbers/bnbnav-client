import { useState } from "preact/hooks";

export function Bar() {
    const [st, setSt] = useState(-100);

    return (<>
        <button onClick={() => { setSt(st + 1) }}>{st}</button>
    </>);
}