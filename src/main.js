// main.js – Einstiegspunkt. Lädt nur das UI-Modul; Fragendaten kommen später lazy.
import { renderFilter } from "./core/ui.js";

renderFilter();

// Added Theme switch logic
const themeSwitch = document.getElementById('checkbox');
const currentTheme = localStorage.getItem('theme');
const htmlElement = document.documentElement;

if (currentTheme) {
  htmlElement.setAttribute('data-theme', currentTheme);
  if (currentTheme === 'dark') {
    themeSwitch.checked = true;
  }
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  htmlElement.setAttribute('data-theme', 'dark');
  themeSwitch.checked = true;
}

function switchTheme(e) {
  if (e.target.checked) {
    htmlElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    htmlElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
}

themeSwitch.addEventListener('change', switchTheme);
// Added Theme switch logic End