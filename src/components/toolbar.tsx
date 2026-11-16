import type { Signal } from "@preact/signals";
import { useRef, useState } from "preact/hooks";
import type { Vector2 } from "../math/vector2";
import { useTranslation } from "react-i18next";

export function Toolbar({ position }: { position: Signal<Vector2> }) {
    const { t } = useTranslation();
    const [st, setSt] = useState(-100);
    const dialogRef = useRef<HTMLDialogElement>(null);

    return (
        <div>
            <button
                onClick={() => {
                    setSt(() => {
                        dialogRef.current!.showModal();
                        return st + 1;
                    });
                }}
            >
                {st}
            </button>

            <p>
                {t("COORDINATES", {
                    x: position.value.x,
                    z: position.value.y,
                    maximumFractionDigits: 2,
                })}
            </p>

            <dialog ref={dialogRef}>
                <div>Ich bin ein berliner!</div>
                <button
                    onClick={() => {
                        setSt(() => {
                            dialogRef.current?.close();
                            return st * -1;
                        });
                    }}
                    autofocus
                >
                    {st}
                </button>
            </dialog>
        </div>
    );
}
