import { useState, useCallback, useRef } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  const draws = [];

  // Detect format
  const isKaggle = header.includes("num1");
  const isLotterywest = header.includes("winning number 1");

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 8) continue;
    try {
      let date, nums, supps;
      if (isKaggle) {
        date = cols[0].trim();
        nums = [1,2,3,4,5,6].map(j => parseInt(cols[j]));
        supps = [parseInt(cols[7]), parseInt(cols[8])];
      } else if (isLotterywest) {
        date = cols[0].trim();
        nums = [1,2,3,4,5,6].map(j => parseInt(cols[j]));
        supps = [parseInt(cols[7]), parseInt(cols[8])];
      } else {
        // generic: date, n1..n6, s1, s2
        date = cols[0].trim();
        nums = [1,2,3,4,5,6].map(j => parseInt(cols[j]));
        supps = [parseInt(cols[7]), parseInt(cols[8] || 0)];
      }
      if (nums.some(isNaN) || nums.some(n => n < 1 || n > 45)) continue;
      draws.push({ date, nums: nums.sort((a,b)=>a-b), supps });
    } catch { continue; }
  }
  return draws;
}

function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...getCombinations(rest, k - 1).map(c => [first, ...c]),
    ...getCombinations(rest, k),
  ];
}

function checkDiv(combo, main, supps) {
  const m = combo.filter(n => main.includes(n)).length;
  const s = combo.filter(n => supps.includes(n)).length;
  if (m === 6) return 1;
  if (m === 5 && s >= 1) return 2;
  if (m === 5) return 3;
  if (m === 4) return 4;
  if (m === 3 && s >= 1) return 5;
  if (m === 1 && s >= 2) return 6;
  return 0;
}

const DIV_PRIZES = { 1: 5000000, 2: 5000, 3: 450, 4: 30, 5: 15, 6: 10 };

function runBacktest(numbers, draws) {
  if (!numbers || numbers.length < 6) return null;
  const combos = getCombinations(numbers, 6);
  const divCounts = {1:0,2:0,3:0,4:0,5:0,6:0};
  let prize = 0;
  const div1Hits = [];

  for (const draw of draws) {
    for (const combo of combos) {
      const div = checkDiv(combo, draw.nums, draw.supps);
      if (div > 0) {
        divCounts[div]++;
        prize += DIV_PRIZES[div];
        if (div === 1) {
          const h = `${draw.date} — ${draw.nums.join(", ")}`;
          if (!div1Hits.includes(h)) div1Hits.push(h);
        }
      }
    }
  }
  const cost = combos.length * 1.35 * draws.length;
  return { combos: combos.length, divCounts, prize, cost, net: prize - cost, div1Hits };
}

function getFrequency(draws) {
  const freq = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  for (const draw of draws) {
    for (const n of draw.nums) freq[n]++;
  }
  return freq;
}

// ── built-in data (2021–2026 recent draws) ───────────────────────────────────
const RECENT_DRAWS = [
  {date:"28/03/2026",nums:[1,2,3,25,29,30],supps:[15,17]},
  {date:"21/03/2026",nums:[11,16,20,27,43,45],supps:[22,39]},
  {date:"14/03/2026",nums:[14,21,27,34,36,40],supps:[5,33]},
  {date:"07/03/2026",nums:[16,17,24,33,35,36],supps:[6,19]},
  {date:"28/02/2026",nums:[7,13,21,31,35,44],supps:[30,34]},
  {date:"21/02/2026",nums:[4,11,26,30,42,43],supps:[27,29]},
  {date:"14/02/2026",nums:[3,6,7,12,14,22],supps:[20,43]},
  {date:"07/02/2026",nums:[3,8,9,27,33,41],supps:[15,25]},
  {date:"31/01/2026",nums:[9,20,33,34,42,45],supps:[7,29]},
  {date:"24/01/2026",nums:[8,22,24,28,29,33],supps:[19,27]},
  {date:"17/01/2026",nums:[8,9,19,35,38,44],supps:[23,33]},
  {date:"10/01/2026",nums:[1,8,23,25,30,41],supps:[32,37]},
  {date:"03/01/2026",nums:[9,10,13,19,21,36],supps:[2,39]},
  {date:"13/12/2025",nums:[6,17,20,28,32,35],supps:[25,41]},
  {date:"06/12/2025",nums:[5,10,17,33,42,45],supps:[31,44]},
  {date:"29/11/2025",nums:[5,10,17,22,36,44],supps:[3,11]},
  {date:"22/11/2025",nums:[7,12,15,31,39,42],supps:[5,8]},
  {date:"15/11/2025",nums:[1,19,33,36,39,41],supps:[20,25]},
  {date:"08/11/2025",nums:[1,13,14,16,28,41],supps:[34,39]},
  {date:"01/11/2025",nums:[13,17,21,28,31,42],supps:[15,36]},
  {date:"25/10/2025",nums:[13,14,23,29,40,41],supps:[1,17]},
  {date:"18/10/2025",nums:[7,10,18,19,32,38],supps:[28,43]},
  {date:"11/10/2025",nums:[9,21,32,33,37,43],supps:[17,30]},
  {date:"04/10/2025",nums:[2,3,10,16,32,42],supps:[11,35]},
  {date:"27/09/2025",nums:[4,14,16,25,29,37],supps:[6,10]},
  {date:"20/09/2025",nums:[5,10,25,26,27,38],supps:[15,34]},
  {date:"13/09/2025",nums:[2,13,15,18,31,40],supps:[26,36]},
  {date:"06/09/2025",nums:[6,10,16,21,42,43],supps:[23,36]},
  {date:"30/08/2025",nums:[4,5,9,10,28,36],supps:[2,14]},
  {date:"23/08/2025",nums:[2,10,28,33,44,45],supps:[8,26]},
  {date:"16/08/2025",nums:[1,6,15,18,23,38],supps:[24,32]},
  {date:"09/08/2025",nums:[4,10,14,40,41,45],supps:[3,6]},
  {date:"02/08/2025",nums:[1,21,24,40,43,45],supps:[9,16]},
  {date:"26/07/2025",nums:[2,17,23,40,42,44],supps:[27,39]},
  {date:"19/07/2025",nums:[7,15,17,22,36,42],supps:[9,34]},
  {date:"12/07/2025",nums:[9,23,29,35,36,37],supps:[20,31]},
  {date:"05/07/2025",nums:[4,6,13,14,17,19],supps:[1,11]},
  {date:"28/06/2025",nums:[21,32,34,39,41,44],supps:[16,22]},
  {date:"21/06/2025",nums:[1,6,10,24,30,42],supps:[16,18]},
  {date:"14/06/2025",nums:[1,6,10,17,19,28],supps:[14,35]},
  {date:"07/06/2025",nums:[11,13,22,26,30,36],supps:[24,45]},
  {date:"31/05/2025",nums:[5,7,9,23,27,45],supps:[13,36]},
  {date:"24/05/2025",nums:[5,13,33,35,36,37],supps:[10,18]},
  {date:"17/05/2025",nums:[9,19,31,37,40,44],supps:[5,11]},
  {date:"10/05/2025",nums:[1,18,25,35,38,45],supps:[4,16]},
  {date:"03/05/2025",nums:[16,27,29,30,34,43],supps:[2,40]},
  {date:"26/04/2025",nums:[1,7,21,32,38,42],supps:[13,24]},
  {date:"19/04/2025",nums:[10,14,19,21,28,44],supps:[23,33]},
  {date:"12/04/2025",nums:[3,6,13,17,22,45],supps:[29,31]},
  {date:"05/04/2025",nums:[3,10,23,27,42,43],supps:[6,18]},
  {date:"29/03/2025",nums:[1,3,17,21,36,41],supps:[24,30]},
  {date:"22/03/2025",nums:[11,16,29,34,42,45],supps:[14,18]},
  {date:"15/03/2025",nums:[3,13,15,16,27,30],supps:[19,33]},
  {date:"08/03/2025",nums:[2,16,18,28,29,38],supps:[4,25]},
  {date:"01/03/2025",nums:[3,6,11,12,13,37],supps:[2,44]},
  {date:"22/02/2025",nums:[2,5,26,28,31,39],supps:[7,8]},
  {date:"15/02/2025",nums:[8,18,19,31,41,43],supps:[9,11]},
  {date:"08/02/2025",nums:[6,15,25,35,40,42],supps:[20,38]},
  {date:"01/02/2025",nums:[1,7,8,12,18,41],supps:[16,32]},
  {date:"25/01/2025",nums:[8,12,15,21,28,34],supps:[3,44]},
  {date:"18/01/2025",nums:[7,11,15,19,34,45],supps:[32,42]},
  {date:"11/01/2025",nums:[6,8,18,19,29,38],supps:[15,45]},
  {date:"04/01/2025",nums:[8,10,19,23,31,33],supps:[13,42]},
  {date:"14/12/2024",nums:[6,7,11,21,30,35],supps:[13,29]},
  {date:"07/12/2024",nums:[1,7,11,13,16,35],supps:[5,14]},
  {date:"30/11/2024",nums:[8,13,16,30,39,41],supps:[28,38]},
  {date:"23/11/2024",nums:[3,6,17,25,40,42],supps:[7,28]},
  {date:"16/11/2024",nums:[5,6,8,29,38,44],supps:[1,9]},
  {date:"09/11/2024",nums:[5,6,30,37,39,43],supps:[17,45]},
  {date:"02/11/2024",nums:[1,3,6,10,18,42],supps:[5,40]},
  {date:"26/10/2024",nums:[1,25,29,35,42,43],supps:[19,31]},
  {date:"19/10/2024",nums:[5,15,22,26,33,43],supps:[4,11]},
  {date:"12/10/2024",nums:[2,8,10,21,28,45],supps:[27,30]},
  {date:"05/10/2024",nums:[13,15,18,24,27,30],supps:[26,41]},
  {date:"28/09/2024",nums:[15,19,29,34,37,40],supps:[6,44]},
  {date:"21/09/2024",nums:[6,21,24,29,32,42],supps:[25,30]},
  {date:"14/09/2024",nums:[6,14,22,32,34,38],supps:[19,41]},
  {date:"07/09/2024",nums:[7,13,15,16,20,38],supps:[26,41]},
  {date:"31/08/2024",nums:[4,6,15,20,32,39],supps:[1,30]},
  {date:"24/08/2024",nums:[5,8,42,43,44,45],supps:[24,32]},
  {date:"17/08/2024",nums:[1,3,15,23,25,41],supps:[11,45]},
  {date:"10/08/2024",nums:[4,10,37,38,42,45],supps:[15,36]},
  {date:"03/08/2024",nums:[10,11,12,13,41,45],supps:[28,40]},
  {date:"27/07/2024",nums:[4,11,20,27,37,45],supps:[10,15]},
  {date:"20/07/2024",nums:[17,23,25,29,30,31],supps:[6,14]},
  {date:"13/07/2024",nums:[1,2,18,21,24,36],supps:[14,27]},
  {date:"06/07/2024",nums:[3,4,15,20,26,44],supps:[7,35]},
  {date:"29/06/2024",nums:[10,21,24,30,44,45],supps:[28,31]},
  {date:"22/06/2024",nums:[2,22,35,37,38,40],supps:[9,44]},
  {date:"15/06/2024",nums:[12,23,34,36,38,40],supps:[8,30]},
  {date:"08/06/2024",nums:[3,13,14,24,30,32],supps:[33,40]},
  {date:"01/06/2024",nums:[5,21,22,28,39,42],supps:[13,29]},
  {date:"25/05/2024",nums:[8,10,22,35,36,38],supps:[11,23]},
  {date:"18/05/2024",nums:[9,13,20,26,32,43],supps:[14,34]},
  {date:"11/05/2024",nums:[17,20,21,31,41,44],supps:[18,37]},
  {date:"04/05/2024",nums:[5,12,14,26,29,42],supps:[9,41]},
  {date:"27/04/2024",nums:[1,7,20,26,34,39],supps:[8,10]},
  {date:"20/04/2024",nums:[6,16,19,25,43,44],supps:[4,14]},
  {date:"13/04/2024",nums:[1,3,16,18,19,25],supps:[7,33]},
  {date:"06/04/2024",nums:[5,6,14,36,37,45],supps:[28,31]},
  {date:"30/03/2024",nums:[9,12,15,42,43,44],supps:[18,36]},
  {date:"23/03/2024",nums:[1,12,16,17,19,32],supps:[27,34]},
  {date:"16/03/2024",nums:[3,17,28,35,40,44],supps:[26,33]},
  {date:"09/03/2024",nums:[2,3,11,17,25,31],supps:[15,24]},
  {date:"02/03/2024",nums:[5,8,15,18,19,30],supps:[7,26]},
  {date:"24/02/2024",nums:[16,17,26,38,39,42],supps:[32,37]},
  {date:"17/02/2024",nums:[7,11,22,25,28,34],supps:[32,35]},
  {date:"10/02/2024",nums:[1,2,12,13,20,42],supps:[3,15]},
  {date:"03/02/2024",nums:[3,11,19,22,23,29],supps:[20,30]},
  {date:"27/01/2024",nums:[5,8,13,24,29,36],supps:[15,40]},
  {date:"20/01/2024",nums:[11,22,27,33,35,37],supps:[1,8]},
  {date:"13/01/2024",nums:[8,33,37,39,40,41],supps:[2,35]},
  {date:"06/01/2024",nums:[12,13,17,34,36,42],supps:[38,41]},
  {date:"30/12/2023",nums:[2,3,11,23,38,39],supps:[22,35]},
  {date:"23/12/2023",nums:[1,20,24,31,37,39],supps:[19,41]},
  {date:"16/12/2023",nums:[8,12,13,17,39,41],supps:[27,32]},
  {date:"09/12/2023",nums:[9,11,25,32,33,44],supps:[2,20]},
  {date:"02/12/2023",nums:[10,14,21,22,23,42],supps:[7,11]},
  {date:"25/11/2023",nums:[17,20,30,36,37,44],supps:[4,19]},
  {date:"18/11/2023",nums:[7,8,15,16,26,31],supps:[6,44]},
  {date:"11/11/2023",nums:[1,2,23,24,28,30],supps:[29,39]},
  {date:"04/11/2023",nums:[1,5,14,15,34,42],supps:[40,45]},
  {date:"28/10/2023",nums:[12,13,14,18,30,35],supps:[2,43]},
  {date:"21/10/2023",nums:[2,7,12,29,30,31],supps:[9,33]},
  {date:"14/10/2023",nums:[7,10,11,23,24,38],supps:[4,14]},
  {date:"07/10/2023",nums:[18,23,25,28,35,37],supps:[8,16]},
  {date:"30/09/2023",nums:[6,20,27,29,43,45],supps:[9,36]},
  {date:"23/09/2023",nums:[4,13,16,21,29,45],supps:[6,11]},
  {date:"16/09/2023",nums:[11,23,27,28,37,41],supps:[1,2]},
  {date:"09/09/2023",nums:[7,9,11,14,15,29],supps:[17,23]},
  {date:"02/09/2023",nums:[9,16,32,37,40,41],supps:[26,30]},
  {date:"26/08/2023",nums:[6,10,18,32,33,37],supps:[21,23]},
  {date:"19/08/2023",nums:[14,16,24,34,41,44],supps:[21,30]},
  {date:"12/08/2023",nums:[5,10,30,32,34,42],supps:[19,45]},
  {date:"05/08/2023",nums:[1,2,18,24,36,43],supps:[9,31]},
  {date:"29/07/2023",nums:[3,14,32,37,42,45],supps:[17,20]},
  {date:"22/07/2023",nums:[1,5,14,26,32,33],supps:[8,37]},
  {date:"15/07/2023",nums:[18,25,31,32,37,39],supps:[12,34]},
  {date:"08/07/2023",nums:[5,26,29,34,37,41],supps:[31,42]},
  {date:"01/07/2023",nums:[6,7,19,21,26,38],supps:[13,36]},
  {date:"24/06/2023",nums:[4,8,21,29,30,37],supps:[38,45]},
  {date:"17/06/2023",nums:[8,24,27,36,39,41],supps:[22,26]},
  {date:"10/06/2023",nums:[2,11,12,23,42,43],supps:[7,44]},
  {date:"03/06/2023",nums:[1,12,24,26,37,41],supps:[25,45]},
  {date:"27/05/2023",nums:[7,8,22,28,34,37],supps:[1,23]},
  {date:"20/05/2023",nums:[2,8,11,12,25,32],supps:[16,22]},
  {date:"13/05/2023",nums:[6,22,23,24,33,36],supps:[18,34]},
  {date:"06/05/2023",nums:[2,8,13,17,30,35],supps:[5,34]},
  {date:"29/04/2023",nums:[4,15,16,18,35,45],supps:[11,17]},
  {date:"22/04/2023",nums:[4,29,32,34,38,41],supps:[11,27]},
  {date:"15/04/2023",nums:[4,16,23,31,39,43],supps:[17,18]},
  {date:"08/04/2023",nums:[4,6,9,11,13,40],supps:[18,20]},
  {date:"01/04/2023",nums:[5,10,25,36,39,45],supps:[8,40]},
  {date:"25/03/2023",nums:[8,9,10,14,39,42],supps:[12,31]},
  {date:"18/03/2023",nums:[1,6,15,21,43,44],supps:[34,42]},
  {date:"11/03/2023",nums:[1,4,9,10,29,42],supps:[7,17]},
  {date:"04/03/2023",nums:[1,9,13,32,33,34],supps:[8,15]},
  {date:"25/02/2023",nums:[4,12,13,15,29,45],supps:[2,27]},
  {date:"18/02/2023",nums:[8,11,16,24,30,34],supps:[18,21]},
  {date:"11/02/2023",nums:[4,7,19,20,21,22],supps:[16,17]},
  {date:"04/02/2023",nums:[11,27,31,34,39,45],supps:[5,28]},
  {date:"28/01/2023",nums:[7,24,27,30,39,44],supps:[5,38]},
  {date:"21/01/2023",nums:[9,10,11,23,32,40],supps:[5,17]},
  {date:"14/01/2023",nums:[11,19,30,37,39,45],supps:[3,21]},
  {date:"07/01/2023",nums:[2,9,11,17,18,38],supps:[37,41]},
  {date:"31/12/2022",nums:[11,20,23,35,42,45],supps:[8,38]},
  {date:"24/12/2022",nums:[4,7,8,24,32,39],supps:[17,34]},
  {date:"17/12/2022",nums:[3,8,28,36,37,41],supps:[9,16]},
  {date:"10/12/2022",nums:[6,14,22,24,35,44],supps:[10,39]},
  {date:"03/12/2022",nums:[4,8,10,12,15,39],supps:[37,45]},
  {date:"26/11/2022",nums:[12,14,22,29,31,45],supps:[11,36]},
  {date:"19/11/2022",nums:[9,12,14,23,31,43],supps:[13,29]},
  {date:"12/11/2022",nums:[3,6,12,18,31,35],supps:[9,34]},
  {date:"05/11/2022",nums:[12,19,26,29,39,45],supps:[13,15]},
  {date:"29/10/2022",nums:[3,6,7,9,22,42],supps:[13,16]},
  {date:"22/10/2022",nums:[7,17,21,24,35,41],supps:[5,23]},
  {date:"15/10/2022",nums:[5,7,11,12,24,40],supps:[15,28]},
  {date:"08/10/2022",nums:[17,20,23,33,37,45],supps:[18,22]},
  {date:"01/10/2022",nums:[9,20,25,30,32,40],supps:[34,35]},
  {date:"24/09/2022",nums:[5,7,10,14,34,41],supps:[4,44]},
  {date:"17/09/2022",nums:[4,7,9,21,23,25],supps:[6,11]},
  {date:"10/09/2022",nums:[2,8,11,31,32,45],supps:[14,41]},
  {date:"03/09/2022",nums:[3,6,10,18,21,39],supps:[41,43]},
  {date:"27/08/2022",nums:[2,3,6,23,41,42],supps:[24,39]},
  {date:"20/08/2022",nums:[6,16,34,35,37,42],supps:[18,40]},
  {date:"13/08/2022",nums:[1,15,20,29,35,38],supps:[8,31]},
  {date:"06/08/2022",nums:[14,15,24,31,33,39],supps:[4,40]},
  {date:"30/07/2022",nums:[8,12,17,21,26,42],supps:[13,35]},
  {date:"23/07/2022",nums:[3,20,24,32,38,40],supps:[5,31]},
  {date:"16/07/2022",nums:[8,11,19,23,35,37],supps:[34,42]},
  {date:"09/07/2022",nums:[6,23,30,37,43,44],supps:[1,45]},
  {date:"02/07/2022",nums:[10,15,17,31,37,42],supps:[7,11]},
  {date:"25/06/2022",nums:[6,16,18,20,25,36],supps:[33,39]},
  {date:"18/06/2022",nums:[1,11,22,27,34,37],supps:[43,44]},
  {date:"11/06/2022",nums:[10,11,19,21,39,45],supps:[25,35]},
  {date:"04/06/2022",nums:[7,8,13,17,23,25],supps:[31,42]},
  {date:"28/05/2022",nums:[15,17,19,28,32,33],supps:[2,24]},
  {date:"21/05/2022",nums:[5,9,13,23,38,41],supps:[4,43]},
  {date:"14/05/2022",nums:[15,20,25,27,35,39],supps:[9,21]},
  {date:"07/05/2022",nums:[6,7,11,13,17,45],supps:[23,43]},
  {date:"30/04/2022",nums:[3,8,10,20,36,42],supps:[9,45]},
  {date:"23/04/2022",nums:[3,23,31,33,39,45],supps:[17,20]},
  {date:"16/04/2022",nums:[11,12,14,15,23,37],supps:[20,42]},
  {date:"09/04/2022",nums:[1,8,19,31,35,40],supps:[15,38]},
  {date:"02/04/2022",nums:[1,4,6,15,21,27],supps:[19,41]},
  {date:"26/03/2022",nums:[2,8,13,21,22,33],supps:[10,27]},
  {date:"19/03/2022",nums:[10,24,32,34,38,43],supps:[6,25]},
  {date:"12/03/2022",nums:[4,29,35,37,40,41],supps:[21,27]},
  {date:"05/03/2022",nums:[2,16,18,19,30,40],supps:[9,28]},
  {date:"26/02/2022",nums:[3,7,16,23,26,34],supps:[17,35]},
  {date:"19/02/2022",nums:[1,5,18,20,23,34],supps:[9,35]},
  {date:"12/02/2022",nums:[13,35,36,37,42,43],supps:[5,15]},
  {date:"05/02/2022",nums:[2,9,10,11,22,37],supps:[6,40]},
  {date:"29/01/2022",nums:[8,9,22,23,34,40],supps:[13,17]},
  {date:"22/01/2022",nums:[1,12,14,21,39,43],supps:[19,32]},
  {date:"15/01/2022",nums:[3,11,19,33,38,42],supps:[13,39]},
  {date:"08/01/2022",nums:[3,17,20,24,27,29],supps:[9,18]},
  {date:"31/12/2021",nums:[8,14,15,20,32,43],supps:[31,35]},
  {date:"25/12/2021",nums:[6,19,21,30,31,42],supps:[15,38]},
  {date:"18/12/2021",nums:[1,19,25,29,36,44],supps:[21,35]},
  {date:"11/12/2021",nums:[6,12,27,35,37,39],supps:[2,19]},
  {date:"04/12/2021",nums:[8,24,31,39,44,45],supps:[21,41]},
  {date:"27/11/2021",nums:[3,5,27,34,41,45],supps:[10,24]},
  {date:"20/11/2021",nums:[9,17,20,21,25,33],supps:[4,19]},
  {date:"13/11/2021",nums:[17,22,26,29,32,40],supps:[12,21]},
  {date:"06/11/2021",nums:[11,15,28,30,33,39],supps:[19,35]},
  {date:"30/10/2021",nums:[4,16,26,29,30,32],supps:[37,43]},
  {date:"23/10/2021",nums:[9,10,16,22,26,32],supps:[17,38]},
  {date:"16/10/2021",nums:[2,7,17,26,27,38],supps:[1,19]},
  {date:"09/10/2021",nums:[18,22,24,34,40,42],supps:[19,37]},
  {date:"02/10/2021",nums:[13,17,26,28,33,44],supps:[18,38]},
  {date:"25/09/2021",nums:[6,28,29,33,36,40],supps:[26,43]},
  {date:"18/09/2021",nums:[5,6,15,18,36,43],supps:[24,29]},
  {date:"11/09/2021",nums:[8,10,17,23,26,34],supps:[36,41]},
  {date:"04/09/2021",nums:[14,29,31,33,44,45],supps:[19,26]},
  {date:"28/08/2021",nums:[17,19,21,22,23,30],supps:[32,43]},
  {date:"21/08/2021",nums:[6,19,34,35,40,43],supps:[22,45]},
  {date:"14/08/2021",nums:[3,9,13,19,24,28],supps:[29,35]},
  {date:"07/08/2021",nums:[5,11,12,22,28,36],supps:[1,9]},
  {date:"31/07/2021",nums:[13,16,18,32,33,41],supps:[9,19]},
  {date:"24/07/2021",nums:[12,16,26,27,30,40],supps:[13,15]},
  {date:"17/07/2021",nums:[2,14,30,32,35,38],supps:[10,45]},
  {date:"10/07/2021",nums:[22,23,28,30,34,38],supps:[16,20]},
  {date:"03/07/2021",nums:[2,7,27,33,37,42],supps:[10,20]},
  {date:"26/06/2021",nums:[1,24,26,32,34,36],supps:[7,27]},
  {date:"19/06/2021",nums:[12,14,30,34,40,41],supps:[15,27]},
  {date:"12/06/2021",nums:[5,13,15,28,37,45],supps:[1,43]},
  {date:"05/06/2021",nums:[1,11,24,32,33,44],supps:[20,35]},
  {date:"29/05/2021",nums:[2,7,16,28,30,42],supps:[22,35]},
  {date:"22/05/2021",nums:[6,7,9,13,23,27],supps:[1,33]},
  {date:"15/05/2021",nums:[5,15,16,19,20,41],supps:[4,21]},
  {date:"08/05/2021",nums:[2,4,9,26,31,41],supps:[18,25]},
  {date:"01/05/2021",nums:[5,14,18,22,31,42],supps:[1,8]},
  {date:"24/04/2021",nums:[2,4,8,31,32,44],supps:[35,36]},
  {date:"17/04/2021",nums:[5,13,17,33,38,44],supps:[22,35]},
  {date:"10/04/2021",nums:[7,8,20,22,26,42],supps:[14,16]},
  {date:"03/04/2021",nums:[1,21,31,38,39,41],supps:[6,43]},
  {date:"27/03/2021",nums:[2,4,12,23,24,35],supps:[15,37]},
  {date:"20/03/2021",nums:[8,9,13,19,22,32],supps:[15,25]},
  {date:"13/03/2021",nums:[15,17,22,27,37,40],supps:[2,4]},
  {date:"06/03/2021",nums:[11,16,26,32,39,42],supps:[6,30]},
  {date:"27/02/2021",nums:[4,6,24,35,42,45],supps:[36,38]},
  {date:"20/02/2021",nums:[3,5,9,26,35,41],supps:[28,45]},
  {date:"13/02/2021",nums:[1,3,4,22,42,43],supps:[24,25]},
  {date:"06/02/2021",nums:[3,6,8,10,12,24],supps:[36,45]},
  {date:"30/01/2021",nums:[3,6,15,20,30,31],supps:[2,26]},
  {date:"23/01/2021",nums:[1,6,8,10,29,40],supps:[31,42]},
];

const PRESETS = [
  { label: "S7 Set 1", nums: "6,7,8,11,13,17,45" },
  { label: "S7 Set 2", nums: "1,9,13,32,33,34,42" },
  { label: "S7 Set 3", nums: "1,6,10,21,24,30,42" },
  { label: "S7 Set 4", nums: "3,11,23,31,33,39,45" },
  { label: "S7 Set 5", nums: "1,2,18,21,24,30,36" },
  { label: "S7 Set 6", nums: "3,6,7,11,13,17,45" },
  { label: "S8 Best A ★", nums: "6,18,19,23,30,37,43,44" },
  { label: "S8 Best B", nums: "1,6,8,10,23,29,31,40" },
  { label: "S8 Best C", nums: "10,20,21,23,25,38,39,43" },
  { label: "S8 Current", nums: "3,6,7,11,13,17,22,45" },
  { label: "S9 Set A", nums: "2,8,12,18,24,30,39,41,42" },
  { label: "S9 Set B", nums: "3,9,11,17,19,22,23,29,37" },
  { label: "S10 Current", nums: "3,6,7,9,11,13,17,22,42,45" },
];

// ── components ────────────────────────────────────────────────────────────────

function NumberBall({ n, highlight }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:32, height:32, borderRadius:"50%",
      background: highlight ? "#00ffb3" : "#1e2533",
      color: highlight ? "#0a0e17" : "#8899bb",
      fontWeight:700, fontSize:13, margin:"2px",
      border: highlight ? "none" : "1px solid #2a3347",
      transition:"all 0.2s",
    }}>{n}</span>
  );
}

function SetInput({ label, value, onChange, onRun, presets, result, loading }) {
  const [showPresets, setShowPresets] = useState(false);
  const numbers = value.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 45);

  return (
    <div style={{
      background:"#111827", border:"1px solid #1e2d3d", borderRadius:12,
      padding:"20px 24px", marginBottom:16,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <span style={{ color:"#4ade80", fontWeight:700, fontSize:13, letterSpacing:2 }}>{label}</span>
        <button onClick={() => setShowPresets(p=>!p)} style={{
          background:"#1e2533", border:"1px solid #2a3347", color:"#8899bb",
          borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer",
        }}>PRESETS ▾</button>
      </div>
      {showPresets && (
        <div style={{
          display:"flex", flexWrap:"wrap", gap:6, marginBottom:12,
          padding:12, background:"#0d1420", borderRadius:8, border:"1px solid #1e2d3d",
        }}>
          {presets.map(p => (
            <button key={p.label} onClick={() => { onChange(p.nums); setShowPresets(false); }} style={{
              background:"#1e2533", border:"1px solid #2a3347", color:"#00ffb3",
              borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer",
            }}>{p.label}</button>
          ))}
        </div>
      )}
      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g. 6,7,11,13,17,45"
          style={{
            flex:1, background:"#0d1420", border:"1px solid #1e2d3d",
            color:"#e2e8f0", borderRadius:8, padding:"10px 14px",
            fontSize:14, outline:"none", fontFamily:"monospace",
          }}
          onKeyDown={e => e.key === "Enter" && onRun()}
        />
        <button onClick={onRun} disabled={loading} style={{
          background: loading ? "#1e2533" : "#00ffb3",
          color: loading ? "#8899bb" : "#0a0e17",
          border:"none", borderRadius:8, padding:"10px 20px",
          fontWeight:700, fontSize:13, cursor: loading ? "not-allowed" : "pointer",
          letterSpacing:1, transition:"all 0.2s",
        }}>{loading ? "..." : "RUN"}</button>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", marginBottom: result ? 12 : 0 }}>
        {numbers.map(n => <NumberBall key={n} n={n} highlight={true} />)}
      </div>
      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }) {
  const { combos, divCounts, prize, cost, net, div1Hits } = result;
  return (
    <div style={{
      background:"#0d1420", border:"1px solid #1e2d3d", borderRadius:8, padding:16,
      marginTop:4,
    }}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:12 }}>
        {[1,2,3,4,5,6].map(d => (
          <div key={d} style={{
            background: d===1 && divCounts[1]>0 ? "#00ffb322" : "#1e2533",
            border: `1px solid ${d===1 && divCounts[1]>0 ? "#00ffb3" : "#2a3347"}`,
            borderRadius:8, padding:"8px 14px", textAlign:"center", minWidth:60,
          }}>
            <div style={{ color:"#8899bb", fontSize:10, letterSpacing:1 }}>DIV {d}</div>
            <div style={{
              color: d===1 && divCounts[1]>0 ? "#00ffb3" : "#e2e8f0",
              fontWeight:700, fontSize:20,
            }}>{divCounts[d]}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:12 }}>
        <Stat label="COMBOS" value={combos} />
        <Stat label="COST" value={`$${cost.toLocaleString("en-AU",{maximumFractionDigits:0})}`} />
        <Stat label="PRIZE" value={`$${prize.toLocaleString("en-AU",{maximumFractionDigits:0})}`} />
        <Stat label="NET" value={`$${net.toLocaleString("en-AU",{maximumFractionDigits:0})}`} color={net >= 0 ? "#00ffb3" : "#f87171"} />
      </div>
      {div1Hits.length > 0 && (
        <div>
          <div style={{ color:"#00ffb3", fontSize:11, letterSpacing:1, marginBottom:6 }}>DIVISION 1 HITS</div>
          {div1Hits.map((h,i) => (
            <div key={i} style={{ color:"#e2e8f0", fontSize:12, padding:"3px 0", borderBottom:"1px solid #1e2d3d" }}>
              🏆 {h}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ color:"#8899bb", fontSize:10, letterSpacing:1 }}>{label}</div>
      <div style={{ color: color || "#e2e8f0", fontWeight:700, fontSize:15 }}>{value}</div>
    </div>
  );
}

// ── CSV Upload component ──────────────────────────────────────────────────────

function CSVUpload({ onLoad, drawCount, dateRange }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    if (!file) return;
    setStatus("loading");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const draws = parseCSV(e.target.result);
        if (draws.length < 10) {
          setStatus("error");
          return;
        }
        onLoad(draws);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
    reader.readAsText(file);
  }, [onLoad]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  return (
    <div style={{
      background:"#111827", border:"1px solid #1e2d3d", borderRadius:12,
      padding:"20px 24px", marginBottom:24,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <span style={{ color:"#4ade80", fontWeight:700, fontSize:13, letterSpacing:2 }}>DATA SOURCE</span>
        <span style={{
          background:"#1e2533", border:"1px solid #2a3347",
          color:"#8899bb", borderRadius:6, padding:"2px 10px", fontSize:11,
        }}>
          {drawCount.toLocaleString()} DRAWS LOADED · {dateRange}
        </span>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
        style={{
          border:`2px dashed ${dragging ? "#00ffb3" : "#2a3347"}`,
          borderRadius:10, padding:"20px 24px",
          textAlign:"center", cursor:"pointer",
          background: dragging ? "#00ffb308" : "#0d1420",
          transition:"all 0.2s",
        }}
      >
        <div style={{ fontSize:28, marginBottom:6 }}>📂</div>
        <div style={{ color:"#e2e8f0", fontWeight:600, fontSize:14, marginBottom:4 }}>
          Drop Kaggle CSV here or click to browse
        </div>
        <div style={{ color:"#8899bb", fontSize:12 }}>
          xlotto-result-saturday.csv · 1986–2021 · Expands history to 2,060 draws
        </div>
        {status === "loading" && <div style={{ color:"#fbbf24", marginTop:8, fontSize:12 }}>Loading...</div>}
        {status === "success" && <div style={{ color:"#00ffb3", marginTop:8, fontSize:12 }}>✅ CSV loaded successfully!</div>}
        {status === "error" && <div style={{ color:"#f87171", marginTop:8, fontSize:12 }}>❌ Could not parse file. Check format.</div>}
        <input
          ref={fileRef} type="file" accept=".csv"
          style={{ display:"none" }}
          onChange={e => processFile(e.target.files[0])}
        />
      </div>

      <div style={{ marginTop:10, color:"#8899bb", fontSize:11 }}>
        💡 After uploading the Kaggle CSV (1986–2021), the app auto-merges it with built-in 2021–2026 data for the full 2,060-draw history.
      </div>
    </div>
  );
}

// ── Frequency tab ─────────────────────────────────────────────────────────────

function FrequencyTab({ draws }) {
  const freq = getFrequency(draws);
  const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
  const max = sorted[0][1];

  return (
    <div>
      <div style={{ color:"#8899bb", fontSize:12, marginBottom:16 }}>
        Number frequency across {draws.length.toLocaleString()} draws
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:8 }}>
        {sorted.map(([n, count], i) => {
          const pct = (count / draws.length * 100).toFixed(1);
          const hot = i < 10;
          const cold = i >= 35;
          return (
            <div key={n} style={{
              background:"#111827", border:`1px solid ${hot ? "#00ffb355" : cold ? "#f8717155" : "#1e2d3d"}`,
              borderRadius:8, padding:"10px 14px",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <NumberBall n={parseInt(n)} highlight={hot} />
              <div style={{ flex:1 }}>
                <div style={{ color: hot ? "#00ffb3" : cold ? "#f87171" : "#e2e8f0", fontWeight:700, fontSize:14 }}>
                  {count}×
                </div>
                <div style={{
                  height:4, background:"#1e2533", borderRadius:2, marginTop:4,
                  overflow:"hidden",
                }}>
                  <div style={{
                    height:"100%", width:`${count/max*100}%`,
                    background: hot ? "#00ffb3" : cold ? "#f87171" : "#4ade80",
                    borderRadius:2, transition:"width 0.5s",
                  }} />
                </div>
                <div style={{ color:"#8899bb", fontSize:10 }}>{pct}% {hot ? "🔥" : cold ? "🧊" : ""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compare tab ───────────────────────────────────────────────────────────────

function CompareTab({ draws }) {
  const [sets, setSets] = useState(["","",""]);
  const [results, setResults] = useState([null,null,null]);
  const [loading, setLoading] = useState(false);

  const runAll = () => {
    setLoading(true);
    setTimeout(() => {
      const res = sets.map(s => {
        const nums = s.split(",").map(x=>parseInt(x.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=45);
        if (nums.length < 6) return null;
        return runBacktest(nums, draws);
      });
      setResults(res);
      setLoading(false);
    }, 50);
  };

  return (
    <div>
      <div style={{ color:"#8899bb", fontSize:12, marginBottom:16 }}>
        Compare up to 3 sets side by side
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        {[0,1,2].map(i => (
          <div key={i}>
            <div style={{ color:"#4ade80", fontSize:12, letterSpacing:1, marginBottom:6 }}>SET {i+1}</div>
            <input
              value={sets[i]}
              onChange={e => setSets(s => { const n=[...s]; n[i]=e.target.value; return n; })}
              placeholder="e.g. 6,7,11,13,17,45"
              style={{
                width:"100%", background:"#0d1420", border:"1px solid #1e2d3d",
                color:"#e2e8f0", borderRadius:8, padding:"10px 14px",
                fontSize:13, outline:"none", fontFamily:"monospace", boxSizing:"border-box",
              }}
            />
          </div>
        ))}
      </div>
      <button onClick={runAll} disabled={loading} style={{
        background: loading ? "#1e2533" : "#00ffb3",
        color: loading ? "#8899bb" : "#0a0e17",
        border:"none", borderRadius:8, padding:"12px 28px",
        fontWeight:700, fontSize:13, cursor: loading ? "not-allowed" : "pointer",
        letterSpacing:1, marginBottom:20,
      }}>{loading ? "RUNNING..." : "▶ COMPARE ALL"}</button>

      {results.some(Boolean) && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {results.map((r, i) => r ? (
            <div key={i} style={{
              background:"#111827", border:"1px solid #1e2d3d",
              borderRadius:10, padding:16,
            }}>
              <div style={{ color:"#4ade80", fontSize:12, letterSpacing:1, marginBottom:10 }}>SET {i+1}</div>
              {[1,2,3].map(d => (
                <div key={d} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #1e2d3d" }}>
                  <span style={{ color:"#8899bb", fontSize:12 }}>Div {d}</span>
                  <span style={{ color: d===1&&r.divCounts[1]>0?"#00ffb3":"#e2e8f0", fontWeight:700 }}>{r.divCounts[d]}</span>
                </div>
              ))}
              <div style={{ marginTop:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"#8899bb", fontSize:12 }}>Net</span>
                  <span style={{ color: r.net>=0?"#00ffb3":"#f87171", fontWeight:700, fontSize:13 }}>
                    ${r.net.toLocaleString("en-AU",{maximumFractionDigits:0})}
                  </span>
                </div>
              </div>
              {r.div1Hits.length > 0 && (
                <div style={{ marginTop:10 }}>
                  {r.div1Hits.map((h,j) => <div key={j} style={{ color:"#00ffb3", fontSize:10, padding:"2px 0" }}>🏆 {h}</div>)}
                </div>
              )}
            </div>
          ) : (
            <div key={i} style={{
              background:"#111827", border:"1px solid #1e2d3d",
              borderRadius:10, padding:16,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"#2a3347", fontSize:13,
            }}>No data</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("backtest");
  const [sets, setSets] = useState(["","",""]);
  const [results, setResults] = useState([null,null,null]);
  const [loading, setLoading] = useState([false,false,false]);
  const [csvDraws, setCsvDraws] = useState(null);

  // Merge CSV draws with recent draws
  const allDraws = useCallback(() => {
    const recent = RECENT_DRAWS;
    if (!csvDraws) return recent;
    // CSV is oldest-first after parsing, recent is newest-first
    // Deduplicate by date
    const recentDates = new Set(recent.map(d => d.date));
    const kaggle = csvDraws.filter(d => !recentDates.has(d.date));
    return [...kaggle, ...recent];
  }, [csvDraws]);

  const draws = allDraws();
  const drawCount = draws.length;
  const dateRange = draws.length > 0
    ? `${draws[0].date} – ${draws[draws.length-1].date}`
    : "";

  const runSet = (i) => {
    const nums = sets[i].split(",").map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=45);
    if (nums.length < 6) return;
    setLoading(l => { const n=[...l]; n[i]=true; return n; });
    setTimeout(() => {
      const res = runBacktest(nums, draws);
      setResults(r => { const n=[...r]; n[i]=res; return n; });
      setLoading(l => { const n=[...l]; n[i]=false; return n; });
    }, 50);
  };

  const runAll = () => {
    [0,1,2].forEach(i => {
      const nums = sets[i].split(",").map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=45);
      if (nums.length >= 6) runSet(i);
    });
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"#0a0e17",
      color:"#e2e8f0",
      fontFamily:"'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Header */}
      <div style={{
        borderBottom:"1px solid #1e2d3d",
        padding:"20px 40px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div>
          <div style={{ color:"#00ffb3", fontWeight:900, fontSize:22, letterSpacing:3 }}>LOTTOEDGE</div>
          <div style={{ color:"#8899bb", fontSize:11, letterSpacing:2 }}>SATURDAY LOTTO BACKTEST ENGINE</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#e2e8f0", fontWeight:700, fontSize:14 }}>{drawCount.toLocaleString()} DRAWS LOADED</div>
          <div style={{ color:"#8899bb", fontSize:11 }}>{dateRange}</div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 24px" }}>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:32 }}>
          {["backtest","frequency","compare"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab===t ? "transparent" : "transparent",
              border: tab===t ? "1px solid #00ffb3" : "1px solid #2a3347",
              color: tab===t ? "#00ffb3" : "#8899bb",
              borderRadius:8, padding:"8px 20px",
              fontWeight:700, fontSize:12, cursor:"pointer",
              letterSpacing:2, fontFamily:"inherit",
              transition:"all 0.2s",
            }}>{t.toUpperCase()}</button>
          ))}
        </div>

        {/* CSV Upload — always visible */}
        <CSVUpload
          onLoad={setCsvDraws}
          drawCount={drawCount}
          dateRange={dateRange}
        />

        {/* Backtest tab */}
        {tab === "backtest" && (
          <div>
            <div style={{ color:"#8899bb", fontSize:12, letterSpacing:1, marginBottom:20, textAlign:"center" }}>
              ENTER UP TO 3 SYSTEM SETS · 6–12 NUMBERS · RANGE 1–45
            </div>
            {[0,1,2].map(i => (
              <SetInput
                key={i}
                label={`SET ${String.fromCharCode(65+i)}${results[i]?.div1Hits?.length > 0 ? " ★" : ""}`}
                value={sets[i]}
                onChange={v => setSets(s => { const n=[...s]; n[i]=v; return n; })}
                onRun={() => runSet(i)}
                presets={PRESETS}
                result={results[i]}
                loading={loading[i]}
              />
            ))}
            <div style={{ textAlign:"center", marginTop:8 }}>
              <button onClick={runAll} style={{
                background:"#00ffb3", color:"#0a0e17",
                border:"none", borderRadius:10, padding:"14px 40px",
                fontWeight:900, fontSize:13, cursor:"pointer",
                letterSpacing:2, fontFamily:"inherit",
              }}>▶ RUN ALL SETS</button>
            </div>
          </div>
        )}

        {/* Frequency tab */}
        {tab === "frequency" && <FrequencyTab draws={draws} />}

        {/* Compare tab */}
        {tab === "compare" && <CompareTab draws={draws} />}

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:48, color:"#2a3347", fontSize:11, letterSpacing:1 }}>
          LOTTOEDGE MVP · SIMULATED DATA · NOT FINANCIAL ADVICE · PRIZE ESTIMATES ONLY
        </div>
      </div>
    </div>
  );
}
