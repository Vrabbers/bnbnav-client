import "./App.css"
import { Bar } from "./Bar.tsx";
import { useState } from "preact/hooks";

export default function App() {
    const [st, setSt] = useState(0);

    return (
        <div className="app">
            <Bar />
            <button onClick={() => { setSt(st + 1) }}>{st}</button>
        </div>
    );
}