import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";

const loaders = import.meta.glob<Record<string, string>>(
    "./assets/locales/*/translation.json",
    { import: "default" },
);

const languageFiles = new Map(
    Object.keys(loaders).map((path) => {
        const split = path.split("/");
        return [split[split.length - 2], path];
    }),
);

const languages = [...languageFiles.keys()];

console.log(languageFiles);

export const i18nReady = i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    // HACK: namespaces not supported, always assume default "translation" ns
    .use(
        resourcesToBackend<string, string>((lang: string, _ns: string) => {
            const languageFile = languageFiles.get(lang);
            if (!languageFile) throw new Error(`Missing translations: ${lang}`);
            const loader = loaders[languageFile];
            return loader();
        }),
    )
    .init({
        supportedLngs: languages,
        fallbackLng: "en",
        interpolation: { escapeValue: false },
        detection: {
            order: ["querystring", "localStorage", "navigator"],
        },
    });

export default i18next;
