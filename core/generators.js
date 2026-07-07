// Prozedurale Aufgaben-Generatoren - erzeugen bei jedem Quizstart frische Rechenaufgaben
export const GENERATORS = {

  // ---- Binär → Dezimal ----
  binToDec: function(){
    const n = Math.floor(Math.random()*254)+1;
    const bin = n.toString(2).padStart(8,'0');
    const pretty = bin.slice(0,4)+' '+bin.slice(4);
    return {t:"IT-Mathe", type:"in", q:`Wandle die Binärzahl ${pretty} in eine Dezimalzahl um.`,
      a:[String(n)], p:"Dezimal", h:"Stellenwerte: 128 64 32 16 8 4 2 1",
      e:`${pretty} = ${n}. Gesetzte Bits aufaddieren.`};
  },

  // ---- Dezimal → Binär ----
  decToBin: function(){
    const n = Math.floor(Math.random()*254)+1;
    const bin = n.toString(2).padStart(8,'0');
    const pretty = bin.slice(0,4)+' '+bin.slice(4);
    return {t:"IT-Mathe", type:"in", q:`Wandle die Dezimalzahl ${n} in eine 8-Bit-Binärzahl um.`,
      a:[bin, pretty, bin.replace(/^0+/,'')], p:"8 Bit", h:"größte Zweierpotenzen abziehen",
      e:`${n} = ${pretty} (binär).`};
  },

  // ---- Dezimal → Hex ----
  decToHex: function(){
    const n = Math.floor(Math.random()*254)+1;
    const hex = n.toString(16).toUpperCase();
    return {t:"IT-Mathe", type:"in", q:`Wandle die Dezimalzahl ${n} in Hexadezimal um.`,
      a:[hex, hex.toLowerCase(), '0x'+hex.toLowerCase(), '0x'+hex], p:"Hex", h:"durch 16 teilen, Rest = letzte Stelle",
      e:`${n} = ${hex} (hex).`};
  },

  // ---- Hex → Dezimal ----
  hexToDec: function(){
    const n = Math.floor(Math.random()*254)+1;
    const hex = n.toString(16).toUpperCase();
    return {t:"IT-Mathe", type:"in", q:`Wandle die Hexzahl ${hex} in eine Dezimalzahl um.`,
      a:[String(n)], p:"Dezimal", h:"erste Stelle ×16 + zweite Stelle",
      e:`${hex} = ${n} (dezimal).`};
  },

  // ---- Subnetz: Hostanzahl ----
  subnetHosts: function(){
    const pfx = [25,26,27,28,29,30][Math.floor(Math.random()*6)];
    const hosts = Math.pow(2, 32-pfx) - 2;
    return {t:"Subnetting", type:"in", q:`Wie viele nutzbare Hosts hat ein /${pfx}-Subnetz?`,
      a:[String(hosts)], p:"Anzahl", h:"2^(32−Präfix) − 2",
      e:`2^(32−${pfx}) = ${Math.pow(2,32-pfx)} Adressen, minus Netz und Broadcast = ${hosts} Hosts.`};
  },

  // ---- Subnetz: Maske aus Präfix ----
  subnetMask: function(){
    const pfx = [8,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30][Math.floor(Math.random()*16)];
    let bits = '1'.repeat(pfx) + '0'.repeat(32-pfx);
    let octets = [];
    for(let i=0;i<4;i++){ octets.push(parseInt(bits.slice(i*8,i*8+8),2)); }
    const mask = octets.join('.');
    return {t:"Subnetting", type:"in", q:`Wie lautet die Subnetzmaske für /${pfx} in Dezimalschreibweise?`,
      a:[mask], p:"x.x.x.x", h:"Präfix-Bits auf 1, dann in Dezimal je Oktett",
      e:`/${pfx} → ${mask}.`};
  },

  // ---- Subnetz: Netzadresse aus IP ----
  subnetNetwork: function(){
    const pfx = [25,26,27,28][Math.floor(Math.random()*4)];
    const block = Math.pow(2, 32-pfx); // Magic Number im letzten Oktett
    const third = Math.floor(Math.random()*256);
    const hostPart = Math.floor(Math.random()*256);
    const netLast = Math.floor(hostPart/block)*block;
    const ip = `192.168.${third}.${hostPart}`;
    const net = `192.168.${third}.${netLast}`;
    return {t:"Subnetting", type:"in", q:`Zu welcher Netzadresse gehört ${ip} bei /${pfx}?`,
      a:[net, String(netLast)], p:"Netzadresse", h:`Magic Number ${block} (256−Maske)`,
      e:`/${pfx} → ${block}er-Schritte. ${hostPart} liegt im Block ab ${netLast} → Netz ${net}.`};
  },

  // ---- Subnetz: Broadcast aus IP ----
  subnetBroadcast: function(){
    const pfx = [25,26,27,28][Math.floor(Math.random()*4)];
    const block = Math.pow(2, 32-pfx);
    const third = Math.floor(Math.random()*256);
    const hostPart = Math.floor(Math.random()*256);
    const netLast = Math.floor(hostPart/block)*block;
    const bcLast = netLast + block - 1;
    const ip = `10.0.${third}.${hostPart}`;
    const bc = `10.0.${third}.${bcLast}`;
    return {t:"Subnetting", type:"in", q:`Wie lautet die Broadcastadresse zum Host ${ip} bei /${pfx}?`,
      a:[bc, String(bcLast)], p:"Broadcastadresse", h:`Netz + ${block} − 1`,
      e:`Netz beginnt bei .${netLast}, Broadcast = .${bcLast} → ${bc}.`};
  },

  // ---- Subnetz: Anzahl Subnetze ----
  subnetCount: function(){
    const base = [24,16][Math.floor(Math.random()*2)];
    const add = [1,2,3,4][Math.floor(Math.random()*4)];
    const newPfx = base + add;
    const count = Math.pow(2, add);
    return {t:"Subnetting", type:"in", q:`Wie viele /${newPfx}-Subnetze passen in ein /${base}-Netz?`,
      a:[String(count)], p:"Anzahl", h:"2^(neuer Präfix − alter Präfix)",
      e:`${newPfx}−${base} = ${add} Bit → 2^${add} = ${count} Subnetze.`};
  },

  // ---- Datenmenge: Übertragungsdauer ----
  transferTime: function(){
    const sizeMB = [100,200,250,500,750,1000][Math.floor(Math.random()*6)];
    const rate = [10,20,25,50,100][Math.floor(Math.random()*5)];
    const sec = (sizeMB*8)/rate;
    return {t:"IT-Mathe", type:"in", q:`Eine ${sizeMB}-MB-Datei wird mit ${rate} Mbit/s übertragen. Dauer in Sekunden? (1 Byte = 8 Bit)`,
      a:[String(sec), sec+'s'], p:"Sekunden", h:"MB × 8 = Mbit, dann ÷ Rate",
      e:`${sizeMB} MB × 8 = ${sizeMB*8} Mbit; ${sizeMB*8} ÷ ${rate} = ${sec} s. Falle: Byte→Bit ×8!`};
  },

  // ---- Energie: Tagesverbrauch ----
  energyDay: function(){
    const watt = [50,100,150,200,250,300,500][Math.floor(Math.random()*7)];
    const hours = [4,5,6,8,10,12][Math.floor(Math.random()*6)];
    const kwh = (watt*hours)/1000;
    return {t:"Energiekosten", type:"in", q:`Ein Gerät mit ${watt} W läuft ${hours} h pro Tag. Verbrauch pro Tag in kWh?`,
      a:[String(kwh), kwh.toFixed(1), String(kwh).replace('.',',')], p:"kWh", h:"W × h ÷ 1000",
      e:`${watt} × ${hours} = ${watt*hours} Wh = ${kwh} kWh.`};
  },

  // ---- Energie: Kosten ----
  energyCost: function(){
    const kwh = [1,2,3,4,5,10][Math.floor(Math.random()*6)];
    const price = [0.25,0.30,0.35,0.40][Math.floor(Math.random()*4)];
    const cost = (kwh*price).toFixed(2);
    return {t:"Energiekosten", type:"in", q:`${kwh} kWh bei ${price.toFixed(2).replace('.',',')} €/kWh – Kosten in Euro?`,
      a:[cost, cost.replace('.',','), parseFloat(cost).toString()], p:"Euro", h:"kWh × Preis",
      e:`${kwh} × ${price.toFixed(2).replace('.',',')} = ${cost.replace('.',',')} €.`};
  },

  // ---- Prozent: Rabatt ----
  discount: function(){
    const price = [50,80,100,120,150,200,250][Math.floor(Math.random()*7)];
    const pct = [5,10,15,20,25,30][Math.floor(Math.random()*6)];
    const result = price - (price*pct/100);
    return {t:"Handelskalkulation", type:"in", q:`Listenpreis ${price} €, ${pct}% Rabatt. Zielpreis in Euro?`,
      a:[String(result), result+'€', result+' €', String(result).replace('.',',')], p:"Euro", h:"Preis − Rabatt%",
      e:`${price} − ${pct}% (${price*pct/100} €) = ${result} €.`};
  },

  // ---- Prozent: USt ----
  vat: function(){
    const net = [50,100,150,200,300,500,1000][Math.floor(Math.random()*7)];
    const gross = net*1.19;
    return {t:"Handelskalkulation", type:"in", q:`Nettopreis ${net} €, 19% USt. Bruttopreis in Euro?`,
      a:[String(gross), gross.toFixed(2), gross.toFixed(2).replace('.',','), String(gross).replace('.',',')], p:"Euro", h:"netto × 1,19",
      e:`${net} × 1,19 = ${gross.toFixed(2).replace('.',',')} €.`};
  },

  // ---- RAID-Kapazität ----
  raidCap: function(){
    const disks = [3,4,5,6][Math.floor(Math.random()*4)];
    const size = [1,2,4][Math.floor(Math.random()*3)];
    const level = [0,1,5][Math.floor(Math.random()*3)];
    let cap, expl;
    if(level===0){ cap=disks*size; expl=`RAID 0: alle Platten nutzbar = ${disks}×${size} = ${cap} TB.`; }
    else if(level===1){ cap=size; expl=`RAID 1: Spiegelung, nur die Größe einer Platte = ${cap} TB.`; }
    else { cap=(disks-1)*size; expl=`RAID 5: (n−1)×Größe = ${disks-1}×${size} = ${cap} TB (eine Platte für Parität).`; }
    const disksTxt = level===1 ? 2 : disks;
    const capFinal = level===1 ? size : cap;
    return {t:"RAID", type:"in", q:`RAID ${level} mit ${disksTxt} Platten à ${size} TB – Nettokapazität in TB? (nur Zahl)`,
      a:[String(capFinal), capFinal+'tb', capFinal+' tb'], p:"TB", h:level===1?"Spiegelung":(level===0?"alle Platten":"(n−1)×Größe"),
      e:level===1?`RAID 1: Spiegelung von 2 Platten = ${size} TB nutzbar.`:expl};
  }

};
