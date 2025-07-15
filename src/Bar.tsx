import { useRef, useState } from "preact/hooks";

export function Bar() {
    const [st, setSt] = useState(-100);
    const dialogRef = useRef<HTMLDialogElement>(null);

    return (
        <>
            <button
                onClick={() => {
                    setSt(() => {
                        dialogRef.current?.showModal();
                        return st + 1;
                    });
                }}
            >
                {st}
            </button>
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
        </>
    );
}
