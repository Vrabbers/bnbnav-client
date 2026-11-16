import "./index.css";
import App from "./app.tsx";
import { render } from "preact";
import { i18nReady } from "./i18n.ts";

i18nReady
    .then(() => {
        render(<App />, document.getElementById("root")!);
    })
    .catch(() => {
        document.getElementById("root")!.innerText =
            "Something has gone wrong loading translations...";
    });
