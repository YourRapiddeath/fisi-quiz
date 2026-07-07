// main.js – Einstiegspunkt. Setzt das gespeicherte Theme und rendert die Themenauswahl.
// Fragendaten werden vom UI/Loader erst bei Bedarf (dynamisches import()) geladen.
import { renderFilter, applyTheme } from "./core/ui.js";

applyTheme();
renderFilter();
