// config.js – Metadaten (klein, immer geladen). Die eigentlichen Fragen liegen in src/data/*.js
// und werden per dynamischem import() erst geladen, wenn eine Kategorie gebraucht wird.

// Welche Kategorie liegt in welcher Datei? Der Loader importiert nur bei Bedarf.
export const CATEGORIES = {
  net: {
    label: "Netzwerktechnik",
    load: () => import("../data/net.js"),
    topics: ["OSI-Modell","IP-Adressen","Subnetting","IPv6","Protokolle/Ports","DHCP","DNS","ARP","NAT/PAT","Firewall","VLAN","VPN","WLAN","ICMP/Tools","Verkabelung","MAC-Adressen"]
  },
  sys: {
    label: "Hardware & Systeme",
    load: () => import("../data/sys.js"),
    topics: ["CPU/Hardware","Arbeitsspeicher","Massenspeicher","RAID","NAS/SAN","Betriebssysteme","Virtualisierung","Cloud Computing","Serverdienste"]
  },
  sec: {
    label: "IT-Sicherheit & Recht",
    load: () => import("../data/sec.js"),
    topics: ["IT-Sicherheit","Malware","Angriffe","Verschlüsselung","DSGVO","BSI-Grundschutz","Backup","OS-Härtung","Logging","Schutzbedarf"]
  },
  dev: {
    label: "Datenbanken & Programmierung",
    load: () => import("../data/dev.js"),
    topics: ["ER-Modell","Normalisierung","SQL","Pseudocode","Schreibtischtest","UML-Anwendungsfall","UML-Klassendiagramm","UML-Aktivitätsdiagramm"]
  },
  biz: {
    label: "Wirtschaft & Projekt",
    load: () => import("../data/biz.js"),
    topics: ["IT-Mathe","Energiekosten","Handelskalkulation","Nutzwertanalyse","Leasing/Darlehen","Kaufvertrag/Recht","Projektmanagement","Pflichten-/Lastenheft","Netzplan/Gantt","SMART","4-Ohren-Modell","Marktformen","Schulungen","QR-Code","Englischer Text"]
  }
};

// Welches Thema wird von welchen Generatoren bedient (für unbegrenzte Rechenaufgaben)
export const GEN_BY_TOPIC = {
  "IT-Mathe": ["binToDec","decToBin","decToHex","hexToDec","transferTime"],
  "Subnetting": ["subnetHosts","subnetMask","subnetNetwork","subnetBroadcast","subnetCount"],
  "Energiekosten": ["energyDay","energyCost"],
  "Handelskalkulation": ["discount","vat"],
  "RAID": ["raidCap"]
};

// Schnelles Nachschlagen: Thema -> Kategorie-Key
export const TOPIC_TO_CAT = (() => {
  const m = {};
  for (const [key, def] of Object.entries(CATEGORIES)) {
    def.topics.forEach(t => { m[t] = key; });
  }
  return m;
})();

// Statische Fragenzahl pro Thema – fürs Anzeigen der Badges OHNE alle Daten zu laden.
// (Wird einmalig generiert; bei Änderungen an den Daten neu eintragen oder per Build-Skript erzeugen.)
export const STATIC_COUNTS = {
  "OSI-Modell":9,"IP-Adressen":8,"Subnetting":14,"IPv6":10,"Protokolle/Ports":11,"DHCP":3,"DNS":5,"ARP":3,"NAT/PAT":3,"Firewall":3,"VLAN":4,"VPN":4,"WLAN":4,"ICMP/Tools":4,"Verkabelung":6,"MAC-Adressen":3,"CPU/Hardware":7,"Arbeitsspeicher":4,"Massenspeicher":2,"RAID":7,"NAS/SAN":2,"Betriebssysteme":10,"Virtualisierung":4,"Cloud Computing":6,"Serverdienste":3,"IT-Sicherheit":6,"Malware":4,"Angriffe":6,"Verschlüsselung":6,"DSGVO":7,"BSI-Grundschutz":4,"Backup":6,"OS-Härtung":2,"Logging":1,"Schutzbedarf":1,"ER-Modell":7,"Normalisierung":4,"SQL":12,"Pseudocode":6,"Schreibtischtest":2,"UML-Anwendungsfall":2,"UML-Klassendiagramm":2,"UML-Aktivitätsdiagramm":2,"IT-Mathe":15,"Energiekosten":4,"Handelskalkulation":5,"Nutzwertanalyse":4,"Leasing/Darlehen":4,"Kaufvertrag/Recht":4,"Projektmanagement":4,"Pflichten-/Lastenheft":3,"Netzplan/Gantt":3,"SMART":1,"4-Ohren-Modell":2,"Marktformen":2,"Schulungen":1,"QR-Code":2,"Englischer Text":6
}; // automatisch generiert via build-counts
