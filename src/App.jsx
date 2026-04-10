import { useState, useCallback, useRef } from "react";

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const draws = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < 7) continue;
    try {
      const date = cols[0].trim();
      const nums = [1,2,3,4,5,6].map(j => parseInt(cols[j]));
      const supps = cols.length >= 9 ? [parseInt(cols[7]), parseInt(cols[8])] : [0,0];
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
  return [...getCombinations(rest, k-1).map(c=>[first,...c]), ...getCombinations(rest, k)];
}

function checkDiv(combo, main, supps) {
  const m = combo.filter(n=>main.includes(n)).length;
  const s = combo.filter(n=>supps.includes(n)).length;
  if (m===6) return 1;
  if (m===5&&s>=1) return 2;
  if (m===5) return 3;
  if (m===4) return 4;
  if (m===3&&s>=1) return 5;
  if (m===1&&s>=2) return 6;
  return 0;
}

function runBacktest(numbers, draws, prize1) {
  if (!numbers || numbers.length < 6) return null;
  const combos = getCombinations(numbers, 6);
  const prizes = {1:prize1, 2:prize1===1000000?6000:5000, 3:450, 4:30, 5:15, 6:10};
  const divCounts = {1:0,2:0,3:0,4:0,5:0,6:0};
  let prize=0; const div1Hits=[];
  for (const draw of draws) {
    for (const combo of combos) {
      const div = checkDiv(combo, draw.nums, draw.supps);
      if (div > 0) {
        divCounts[div]++;
        prize += prizes[div];
        if (div===1) {
          const h = `${draw.date} — ${draw.nums.join(", ")}`;
          if (!div1Hits.includes(h)) div1Hits.push(h);
        }
      }
    }
  }
  const costPerDraw = combos.length * 1.35;
  return { combos:combos.length, divCounts, prize, cost:costPerDraw*draws.length, net:prize-costPerDraw*draws.length, div1Hits, costPerDraw };
}

function getFrequency(draws) {
  const freq = {};
  for (let i=1;i<=45;i++) freq[i]=0;
  for (const draw of draws) for (const n of draw.nums) freq[n]++;
  return freq;
}

// Saturday Lotto recent draws 2021–2026
const SAT_RECENT = [
  {date:"28/03/2026",nums:[1,2,3,25,29,30],supps:[15,17]},{date:"21/03/2026",nums:[11,16,20,27,43,45],supps:[22,39]},
  {date:"14/03/2026",nums:[14,21,27,34,36,40],supps:[5,33]},{date:"07/03/2026",nums:[16,17,24,33,35,36],supps:[6,19]},
  {date:"28/02/2026",nums:[7,13,21,31,35,44],supps:[30,34]},{date:"21/02/2026",nums:[4,11,26,30,42,43],supps:[27,29]},
  {date:"14/02/2026",nums:[3,6,7,12,14,22],supps:[20,43]},{date:"07/02/2026",nums:[3,8,9,27,33,41],supps:[15,25]},
  {date:"31/01/2026",nums:[9,20,33,34,42,45],supps:[7,29]},{date:"24/01/2026",nums:[8,22,24,28,29,33],supps:[19,27]},
  {date:"17/01/2026",nums:[8,9,19,35,38,44],supps:[23,33]},{date:"10/01/2026",nums:[1,8,23,25,30,41],supps:[32,37]},
  {date:"03/01/2026",nums:[9,10,13,19,21,36],supps:[2,39]},{date:"13/12/2025",nums:[6,17,20,28,32,35],supps:[25,41]},
  {date:"06/12/2025",nums:[5,10,17,33,42,45],supps:[31,44]},{date:"29/11/2025",nums:[5,10,17,22,36,44],supps:[3,11]},
  {date:"22/11/2025",nums:[7,12,15,31,39,42],supps:[5,8]},{date:"15/11/2025",nums:[1,19,33,36,39,41],supps:[20,25]},
  {date:"08/11/2025",nums:[1,13,14,16,28,41],supps:[34,39]},{date:"01/11/2025",nums:[13,17,21,28,31,42],supps:[15,36]},
  {date:"25/10/2025",nums:[13,14,23,29,40,41],supps:[1,17]},{date:"18/10/2025",nums:[7,10,18,19,32,38],supps:[28,43]},
  {date:"11/10/2025",nums:[9,21,32,33,37,43],supps:[17,30]},{date:"04/10/2025",nums:[2,3,10,16,32,42],supps:[11,35]},
  {date:"27/09/2025",nums:[4,14,16,25,29,37],supps:[6,10]},{date:"20/09/2025",nums:[5,10,25,26,27,38],supps:[15,34]},
  {date:"13/09/2025",nums:[2,13,15,18,31,40],supps:[26,36]},{date:"06/09/2025",nums:[6,10,16,21,42,43],supps:[23,36]},
  {date:"30/08/2025",nums:[4,5,9,10,28,36],supps:[2,14]},{date:"23/08/2025",nums:[2,10,28,33,44,45],supps:[8,26]},
  {date:"16/08/2025",nums:[1,6,15,18,23,38],supps:[24,32]},{date:"09/08/2025",nums:[4,10,14,40,41,45],supps:[3,6]},
  {date:"02/08/2025",nums:[1,21,24,40,43,45],supps:[9,16]},{date:"26/07/2025",nums:[2,17,23,40,42,44],supps:[27,39]},
  {date:"19/07/2025",nums:[7,15,17,22,36,42],supps:[9,34]},{date:"12/07/2025",nums:[9,23,29,35,36,37],supps:[20,31]},
  {date:"05/07/2025",nums:[4,6,13,14,17,19],supps:[1,11]},{date:"28/06/2025",nums:[21,32,34,39,41,44],supps:[16,22]},
  {date:"21/06/2025",nums:[1,6,10,24,30,42],supps:[16,18]},{date:"14/06/2025",nums:[1,6,10,17,19,28],supps:[14,35]},
  {date:"07/06/2025",nums:[11,13,22,26,30,36],supps:[24,45]},{date:"31/05/2025",nums:[5,7,9,23,27,45],supps:[13,36]},
  {date:"24/05/2025",nums:[5,13,33,35,36,37],supps:[10,18]},{date:"17/05/2025",nums:[9,19,31,37,40,44],supps:[5,11]},
  {date:"10/05/2025",nums:[1,18,25,35,38,45],supps:[4,16]},{date:"03/05/2025",nums:[16,27,29,30,34,43],supps:[2,40]},
  {date:"26/04/2025",nums:[1,7,21,32,38,42],supps:[13,24]},{date:"19/04/2025",nums:[10,14,19,21,28,44],supps:[23,33]},
  {date:"12/04/2025",nums:[3,6,13,17,22,45],supps:[29,31]},{date:"05/04/2025",nums:[3,10,23,27,42,43],supps:[6,18]},
  {date:"29/03/2025",nums:[1,3,17,21,36,41],supps:[24,30]},{date:"22/03/2025",nums:[11,16,29,34,42,45],supps:[14,18]},
  {date:"15/03/2025",nums:[3,13,15,16,27,30],supps:[19,33]},{date:"08/03/2025",nums:[2,16,18,28,29,38],supps:[4,25]},
  {date:"01/03/2025",nums:[3,6,11,12,13,37],supps:[2,44]},{date:"22/02/2025",nums:[2,5,26,28,31,39],supps:[7,8]},
  {date:"15/02/2025",nums:[8,18,19,31,41,43],supps:[9,11]},{date:"08/02/2025",nums:[6,15,25,35,40,42],supps:[20,38]},
  {date:"01/02/2025",nums:[1,7,8,12,18,41],supps:[16,32]},{date:"25/01/2025",nums:[8,12,15,21,28,34],supps:[3,44]},
  {date:"18/01/2025",nums:[7,11,15,19,34,45],supps:[32,42]},{date:"11/01/2025",nums:[6,8,18,19,29,38],supps:[15,45]},
  {date:"04/01/2025",nums:[8,10,19,23,31,33],supps:[13,42]},{date:"14/12/2024",nums:[6,7,11,21,30,35],supps:[13,29]},
  {date:"07/12/2024",nums:[1,7,11,13,16,35],supps:[5,14]},{date:"30/11/2024",nums:[8,13,16,30,39,41],supps:[28,38]},
  {date:"23/11/2024",nums:[3,6,17,25,40,42],supps:[7,28]},{date:"16/11/2024",nums:[5,6,8,29,38,44],supps:[1,9]},
  {date:"09/11/2024",nums:[5,6,30,37,39,43],supps:[17,45]},{date:"02/11/2024",nums:[1,3,6,10,18,42],supps:[5,40]},
  {date:"26/10/2024",nums:[1,25,29,35,42,43],supps:[19,31]},{date:"19/10/2024",nums:[5,15,22,26,33,43],supps:[4,11]},
  {date:"12/10/2024",nums:[2,8,10,21,28,45],supps:[27,30]},{date:"05/10/2024",nums:[13,15,18,24,27,30],supps:[26,41]},
  {date:"28/09/2024",nums:[15,19,29,34,37,40],supps:[6,44]},{date:"21/09/2024",nums:[6,21,24,29,32,42],supps:[25,30]},
  {date:"14/09/2024",nums:[6,14,22,32,34,38],supps:[19,41]},{date:"07/09/2024",nums:[7,13,15,16,20,38],supps:[26,41]},
  {date:"31/08/2024",nums:[4,6,15,20,32,39],supps:[1,30]},{date:"24/08/2024",nums:[5,8,42,43,44,45],supps:[24,32]},
  {date:"17/08/2024",nums:[1,3,15,23,25,41],supps:[11,45]},{date:"10/08/2024",nums:[4,10,37,38,42,45],supps:[15,36]},
  {date:"03/08/2024",nums:[10,11,12,13,41,45],supps:[28,40]},{date:"27/07/2024",nums:[4,11,20,27,37,45],supps:[10,15]},
  {date:"20/07/2024",nums:[17,23,25,29,30,31],supps:[6,14]},{date:"13/07/2024",nums:[1,2,18,21,24,36],supps:[14,27]},
  {date:"06/07/2024",nums:[3,4,15,20,26,44],supps:[7,35]},{date:"29/06/2024",nums:[10,21,24,30,44,45],supps:[28,31]},
  {date:"22/06/2024",nums:[2,22,35,37,38,40],supps:[9,44]},{date:"15/06/2024",nums:[12,23,34,36,38,40],supps:[8,30]},
  {date:"08/06/2024",nums:[3,13,14,24,30,32],supps:[33,40]},{date:"01/06/2024",nums:[5,21,22,28,39,42],supps:[13,29]},
  {date:"25/05/2024",nums:[8,10,22,35,36,38],supps:[11,23]},{date:"18/05/2024",nums:[9,13,20,26,32,43],supps:[14,34]},
  {date:"11/05/2024",nums:[17,20,21,31,41,44],supps:[18,37]},{date:"04/05/2024",nums:[5,12,14,26,29,42],supps:[9,41]},
  {date:"27/04/2024",nums:[1,7,20,26,34,39],supps:[8,10]},{date:"20/04/2024",nums:[6,16,19,25,43,44],supps:[4,14]},
  {date:"13/04/2024",nums:[1,3,16,18,19,25],supps:[7,33]},{date:"06/04/2024",nums:[5,6,14,36,37,45],supps:[28,31]},
  {date:"23/01/2021",nums:[1,6,8,10,29,40],supps:[31,42]},{date:"07/05/2022",nums:[6,7,11,13,17,45],supps:[23,43]},
  {date:"23/04/2022",nums:[3,23,31,33,39,45],supps:[17,20]},{date:"29/10/2022",nums:[3,6,7,9,22,42],supps:[13,16]},
  {date:"09/07/2022",nums:[6,23,30,37,43,44],supps:[1,45]},{date:"17/12/2022",nums:[3,8,28,36,37,41],supps:[9,16]},
  {date:"12/04/2025",nums:[3,6,13,17,22,45],supps:[29,31]},{date:"02/11/2024",nums:[1,3,6,10,18,42],supps:[5,40]},
  {date:"03/02/2024",nums:[3,11,19,22,23,29],supps:[20,30]},{date:"21/06/2025",nums:[1,6,10,24,30,42],supps:[16,18]},
];

// Millionaire Medley — ALL 294 draws since inception (20 May 2024)
const MM_DRAWS = [
  {date:"20/05/2024",nums:[3, 9, 25, 30, 31, 35],supps:[43, 15]},
  {date:"22/05/2024",nums:[3, 16, 20, 21, 32, 36],supps:[35, 43]},
  {date:"24/05/2024",nums:[2, 7, 9, 10, 25, 36],supps:[32, 3]},
  {date:"27/05/2024",nums:[4, 5, 27, 36, 39, 41],supps:[35, 24]},
  {date:"29/05/2024",nums:[5, 7, 9, 11, 29, 40],supps:[17, 3]},
  {date:"31/05/2024",nums:[1, 11, 14, 26, 27, 37],supps:[21, 9]},
  {date:"03/06/2024",nums:[5, 24, 26, 32, 33, 44],supps:[36, 28]},
  {date:"05/06/2024",nums:[13, 14, 19, 22, 23, 35],supps:[8, 2]},
  {date:"07/06/2024",nums:[5, 7, 10, 22, 34, 44],supps:[21, 11]},
  {date:"10/06/2024",nums:[16, 21, 26, 34, 36, 42],supps:[17, 38]},
  {date:"12/06/2024",nums:[10, 13, 19, 27, 29, 36],supps:[38, 30]},
  {date:"14/06/2024",nums:[1, 3, 4, 9, 18, 20],supps:[10, 12]},
  {date:"17/06/2024",nums:[3, 7, 24, 28, 38, 44],supps:[32, 13]},
  {date:"19/06/2024",nums:[3, 20, 25, 41, 43, 44],supps:[11, 1]},
  {date:"21/06/2024",nums:[11, 24, 28, 35, 37, 45],supps:[2, 39]},
  {date:"24/06/2024",nums:[5, 8, 12, 17, 29, 41],supps:[11, 37]},
  {date:"26/06/2024",nums:[15, 17, 28, 29, 37, 39],supps:[16, 41]},
  {date:"28/06/2024",nums:[23, 26, 29, 35, 42, 43],supps:[22, 3]},
  {date:"01/07/2024",nums:[5, 7, 11, 13, 15, 29],supps:[20, 38]},
  {date:"03/07/2024",nums:[4, 16, 21, 25, 30, 31],supps:[35, 27]},
  {date:"05/07/2024",nums:[2, 6, 11, 16, 23, 43],supps:[24, 41]},
  {date:"08/07/2024",nums:[10, 11, 16, 21, 27, 44],supps:[26, 4]},
  {date:"10/07/2024",nums:[5, 7, 21, 26, 31, 44],supps:[37, 25]},
  {date:"12/07/2024",nums:[2, 11, 21, 26, 30, 45],supps:[8, 37]},
  {date:"15/07/2024",nums:[6, 8, 14, 18, 25, 26],supps:[11, 27]},
  {date:"17/07/2024",nums:[2, 4, 11, 29, 30, 34],supps:[10, 20]},
  {date:"19/07/2024",nums:[19, 21, 27, 33, 41, 43],supps:[15, 37]},
  {date:"22/07/2024",nums:[10, 16, 26, 28, 35, 37],supps:[22, 44]},
  {date:"24/07/2024",nums:[3, 16, 27, 28, 40, 44],supps:[22, 38]},
  {date:"26/07/2024",nums:[9, 22, 27, 29, 36, 40],supps:[6, 2]},
  {date:"29/07/2024",nums:[1, 12, 15, 19, 25, 27],supps:[21, 18]},
  {date:"31/07/2024",nums:[2, 17, 23, 31, 33, 41],supps:[24, 20]},
  {date:"02/08/2024",nums:[16, 21, 27, 28, 30, 39],supps:[33, 26]},
  {date:"05/08/2024",nums:[1, 6, 17, 19, 24, 28],supps:[27, 2]},
  {date:"07/08/2024",nums:[11, 13, 14, 29, 35, 38],supps:[27, 10]},
  {date:"09/08/2024",nums:[16, 17, 20, 21, 30, 43],supps:[33, 3]},
  {date:"12/08/2024",nums:[17, 19, 26, 27, 32, 42],supps:[2, 20]},
  {date:"14/08/2024",nums:[4, 8, 9, 23, 39, 41],supps:[24, 29]},
  {date:"16/08/2024",nums:[2, 15, 20, 24, 37, 40],supps:[10, 17]},
  {date:"19/08/2024",nums:[15, 19, 20, 24, 33, 38],supps:[35, 13]},
  {date:"21/08/2024",nums:[3, 5, 15, 24, 36, 44],supps:[32, 14]},
  {date:"23/08/2024",nums:[11, 15, 29, 38, 42, 43],supps:[37, 34]},
  {date:"26/08/2024",nums:[5, 25, 26, 32, 38, 45],supps:[8, 2]},
  {date:"28/08/2024",nums:[7, 8, 12, 22, 32, 43],supps:[18, 45]},
  {date:"30/08/2024",nums:[6, 14, 21, 32, 36, 42],supps:[25, 43]},
  {date:"02/09/2024",nums:[15, 24, 32, 35, 37, 44],supps:[22, 13]},
  {date:"04/09/2024",nums:[9, 22, 31, 35, 42, 45],supps:[21, 3]},
  {date:"06/09/2024",nums:[4, 5, 16, 20, 22, 26],supps:[8, 24]},
  {date:"09/09/2024",nums:[4, 8, 12, 16, 27, 43],supps:[9, 38]},
  {date:"11/09/2024",nums:[6, 19, 21, 35, 41, 44],supps:[22, 40]},
  {date:"13/09/2024",nums:[6, 7, 24, 27, 36, 41],supps:[11, 18]},
  {date:"16/09/2024",nums:[4, 15, 20, 30, 31, 36],supps:[45, 27]},
  {date:"18/09/2024",nums:[2, 4, 18, 23, 24, 30],supps:[26, 40]},
  {date:"20/09/2024",nums:[6, 11, 14, 22, 27, 35],supps:[21, 8]},
  {date:"23/09/2024",nums:[7, 11, 23, 33, 36, 43],supps:[3, 21]},
  {date:"25/09/2024",nums:[9, 12, 16, 17, 39, 44],supps:[23, 42]},
  {date:"27/09/2024",nums:[1, 10, 18, 24, 35, 36],supps:[44, 20]},
  {date:"30/09/2024",nums:[1, 11, 20, 25, 27, 42],supps:[37, 24]},
  {date:"02/10/2024",nums:[3, 14, 33, 40, 43, 45],supps:[20, 21]},
  {date:"04/10/2024",nums:[6, 12, 13, 16, 21, 25],supps:[24, 9]},
  {date:"07/10/2024",nums:[9, 15, 17, 25, 37, 40],supps:[42, 21]},
  {date:"09/10/2024",nums:[7, 13, 14, 29, 39, 43],supps:[1, 23]},
  {date:"11/10/2024",nums:[5, 12, 13, 14, 17, 31],supps:[24, 4]},
  {date:"14/10/2024",nums:[1, 17, 18, 36, 42, 44],supps:[24, 10]},
  {date:"16/10/2024",nums:[5, 20, 25, 26, 39, 42],supps:[36, 17]},
  {date:"18/10/2024",nums:[4, 28, 29, 30, 37, 42],supps:[41, 19]},
  {date:"21/10/2024",nums:[3, 4, 13, 18, 22, 25],supps:[16, 6]},
  {date:"23/10/2024",nums:[15, 25, 26, 30, 41, 45],supps:[29, 19]},
  {date:"25/10/2024",nums:[2, 12, 30, 39, 41, 43],supps:[25, 26]},
  {date:"28/10/2024",nums:[1, 15, 29, 38, 41, 42],supps:[8, 30]},
  {date:"30/10/2024",nums:[3, 6, 7, 11, 28, 35],supps:[5, 44]},
  {date:"01/11/2024",nums:[2, 20, 25, 26, 35, 43],supps:[27, 18]},
  {date:"04/11/2024",nums:[4, 6, 8, 15, 36, 37],supps:[3, 40]},
  {date:"06/11/2024",nums:[18, 23, 25, 30, 39, 42],supps:[17, 34]},
  {date:"08/11/2024",nums:[3, 15, 19, 24, 33, 45],supps:[20, 41]},
  {date:"11/11/2024",nums:[1, 7, 16, 18, 22, 38],supps:[2, 33]},
  {date:"13/11/2024",nums:[4, 15, 18, 19, 31, 34],supps:[2, 7]},
  {date:"15/11/2024",nums:[9, 24, 28, 30, 32, 41],supps:[18, 25]},
  {date:"18/11/2024",nums:[11, 22, 28, 31, 32, 41],supps:[21, 5]},
  {date:"20/11/2024",nums:[3, 13, 17, 23, 34, 37],supps:[41, 35]},
  {date:"22/11/2024",nums:[1, 10, 20, 26, 27, 35],supps:[17, 33]},
  {date:"25/11/2024",nums:[8, 12, 14, 17, 39, 42],supps:[23, 25]},
  {date:"27/11/2024",nums:[7, 17, 19, 29, 31, 39],supps:[1, 37]},
  {date:"29/11/2024",nums:[2, 10, 19, 27, 39, 41],supps:[16, 20]},
  {date:"02/12/2024",nums:[4, 5, 12, 15, 22, 34],supps:[13, 28]},
  {date:"04/12/2024",nums:[4, 17, 22, 35, 36, 42],supps:[44, 5]},
  {date:"06/12/2024",nums:[9, 10, 25, 29, 43, 45],supps:[4, 26]},
  {date:"09/12/2024",nums:[5, 7, 18, 30, 39, 40],supps:[41, 17]},
  {date:"11/12/2024",nums:[14, 17, 24, 28, 31, 43],supps:[1, 20]},
  {date:"13/12/2024",nums:[10, 16, 29, 38, 41, 44],supps:[40, 23]},
  {date:"16/12/2024",nums:[6, 10, 20, 29, 35, 41],supps:[21, 12]},
  {date:"18/12/2024",nums:[2, 12, 15, 22, 40, 45],supps:[42, 9]},
  {date:"20/12/2024",nums:[7, 14, 15, 20, 31, 45],supps:[42, 4]},
  {date:"23/12/2024",nums:[5, 15, 16, 26, 28, 30],supps:[14, 9]},
  {date:"25/12/2024",nums:[6, 7, 11, 33, 37, 40],supps:[12, 31]},
  {date:"27/12/2024",nums:[28, 31, 35, 36, 39, 41],supps:[34, 27]},
  {date:"30/12/2024",nums:[8, 9, 27, 29, 35, 43],supps:[6, 23]},
  {date:"01/01/2025",nums:[10, 12, 28, 32, 36, 39],supps:[45, 11]},
  {date:"03/01/2025",nums:[6, 14, 27, 32, 35, 37],supps:[39, 29]},
  {date:"06/01/2025",nums:[1, 2, 11, 28, 30, 39],supps:[4, 35]},
  {date:"08/01/2025",nums:[7, 19, 27, 35, 36, 37],supps:[22, 34]},
  {date:"10/01/2025",nums:[6, 19, 25, 29, 30, 32],supps:[18, 38]},
  {date:"13/01/2025",nums:[25, 28, 31, 37, 42, 45],supps:[22, 11]},
  {date:"15/01/2025",nums:[4, 12, 20, 23, 32, 35],supps:[16, 25]},
  {date:"17/01/2025",nums:[4, 10, 15, 23, 25, 35],supps:[43, 9]},
  {date:"20/01/2025",nums:[3, 8, 15, 29, 36, 38],supps:[42, 44]},
  {date:"22/01/2025",nums:[5, 9, 17, 22, 35, 43],supps:[33, 36]},
  {date:"24/01/2025",nums:[1, 9, 17, 20, 21, 37],supps:[35, 45]},
  {date:"27/01/2025",nums:[9, 10, 14, 31, 36, 37],supps:[29, 11]},
  {date:"29/01/2025",nums:[6, 11, 13, 17, 22, 42],supps:[25, 28]},
  {date:"31/01/2025",nums:[2, 20, 23, 34, 35, 42],supps:[4, 31]},
  {date:"03/02/2025",nums:[3, 7, 18, 26, 28, 38],supps:[9, 17]},
  {date:"05/02/2025",nums:[2, 6, 8, 9, 20, 31],supps:[44, 11]},
  {date:"07/02/2025",nums:[5, 7, 23, 26, 30, 32],supps:[15, 10]},
  {date:"10/02/2025",nums:[9, 11, 12, 29, 30, 37],supps:[8, 20]},
  {date:"12/02/2025",nums:[7, 14, 15, 20, 26, 34],supps:[23, 30]},
  {date:"14/02/2025",nums:[1, 4, 16, 38, 44, 45],supps:[14, 31]},
  {date:"17/02/2025",nums:[5, 21, 26, 30, 31, 35],supps:[27, 19]},
  {date:"19/02/2025",nums:[1, 17, 31, 39, 43, 44],supps:[7, 45]},
  {date:"21/02/2025",nums:[7, 10, 14, 21, 23, 34],supps:[41, 25]},
  {date:"24/02/2025",nums:[1, 2, 12, 16, 17, 26],supps:[11, 4]},
  {date:"26/02/2025",nums:[8, 10, 25, 26, 35, 44],supps:[16, 43]},
  {date:"28/02/2025",nums:[8, 12, 22, 23, 30, 39],supps:[25, 36]},
  {date:"03/03/2025",nums:[4, 6, 8, 15, 21, 42],supps:[33, 7]},
  {date:"05/03/2025",nums:[4, 19, 26, 33, 34, 38],supps:[14, 35]},
  {date:"07/03/2025",nums:[5, 6, 16, 19, 38, 41],supps:[2, 15]},
  {date:"10/03/2025",nums:[7, 14, 17, 21, 27, 33],supps:[41, 6]},
  {date:"12/03/2025",nums:[21, 24, 28, 34, 39, 40],supps:[31, 6]},
  {date:"14/03/2025",nums:[5, 8, 13, 18, 22, 37],supps:[9, 7]},
  {date:"17/03/2025",nums:[9, 38, 41, 42, 44, 45],supps:[28, 30]},
  {date:"19/03/2025",nums:[19, 24, 25, 31, 35, 45],supps:[34, 2]},
  {date:"21/03/2025",nums:[11, 12, 14, 17, 19, 24],supps:[45, 29]},
  {date:"24/03/2025",nums:[1, 2, 3, 16, 22, 31],supps:[41, 14]},
  {date:"26/03/2025",nums:[5, 10, 19, 21, 36, 41],supps:[27, 15]},
  {date:"28/03/2025",nums:[16, 32, 33, 39, 41, 44],supps:[38, 30]},
  {date:"31/03/2025",nums:[6, 18, 24, 34, 38, 43],supps:[13, 16]},
  {date:"02/04/2025",nums:[5, 9, 11, 29, 31, 37],supps:[33, 4]},
  {date:"04/04/2025",nums:[3, 9, 24, 29, 40, 42],supps:[14, 4]},
  {date:"07/04/2025",nums:[2, 3, 6, 8, 33, 41],supps:[39, 37]},
  {date:"09/04/2025",nums:[15, 27, 29, 30, 35, 36],supps:[4, 38]},
  {date:"11/04/2025",nums:[12, 14, 20, 23, 40, 43],supps:[37, 6]},
  {date:"14/04/2025",nums:[7, 10, 14, 25, 34, 36],supps:[11, 1]},
  {date:"16/04/2025",nums:[1, 5, 6, 20, 22, 42],supps:[43, 26]},
  {date:"18/04/2025",nums:[1, 20, 36, 37, 38, 44],supps:[17, 23]},
  {date:"21/04/2025",nums:[5, 11, 12, 13, 18, 30],supps:[8, 27]},
  {date:"23/04/2025",nums:[3, 10, 11, 18, 20, 37],supps:[22, 32]},
  {date:"25/04/2025",nums:[8, 10, 17, 29, 36, 40],supps:[7, 3]},
  {date:"28/04/2025",nums:[8, 12, 28, 29, 36, 45],supps:[6, 31]},
  {date:"30/04/2025",nums:[12, 26, 32, 41, 43, 45],supps:[38, 42]},
  {date:"02/05/2025",nums:[3, 14, 19, 32, 34, 41],supps:[36, 20]},
  {date:"05/05/2025",nums:[1, 7, 20, 30, 39, 40],supps:[26, 3]},
  {date:"07/05/2025",nums:[4, 6, 13, 15, 26, 38],supps:[7, 33]},
  {date:"09/05/2025",nums:[3, 17, 26, 29, 32, 42],supps:[33, 35]},
  {date:"12/05/2025",nums:[7, 24, 28, 29, 35, 40],supps:[27, 13]},
  {date:"14/05/2025",nums:[15, 22, 24, 32, 40, 43],supps:[10, 44]},
  {date:"16/05/2025",nums:[1, 2, 8, 10, 21, 23],supps:[16, 6]},
  {date:"19/05/2025",nums:[13, 27, 31, 38, 40, 42],supps:[23, 26]},
  {date:"21/05/2025",nums:[5, 6, 17, 23, 29, 36],supps:[14, 2]},
  {date:"23/05/2025",nums:[3, 11, 24, 25, 26, 37],supps:[17, 41]},
  {date:"26/05/2025",nums:[2, 6, 10, 20, 31, 35],supps:[40, 3]},
  {date:"28/05/2025",nums:[12, 17, 19, 23, 25, 37],supps:[35, 1]},
  {date:"30/05/2025",nums:[6, 15, 28, 32, 34, 36],supps:[30, 25]},
  {date:"02/06/2025",nums:[4, 24, 25, 31, 36, 41],supps:[14, 42]},
  {date:"04/06/2025",nums:[11, 12, 21, 22, 34, 36],supps:[4, 30]},
  {date:"06/06/2025",nums:[15, 16, 20, 41, 43, 44],supps:[42, 40]},
  {date:"09/06/2025",nums:[2, 22, 25, 27, 33, 34],supps:[40, 38]},
  {date:"11/06/2025",nums:[6, 20, 24, 34, 36, 42],supps:[9, 18]},
  {date:"13/06/2025",nums:[11, 15, 16, 23, 32, 35],supps:[43, 5]},
  {date:"16/06/2025",nums:[7, 11, 18, 27, 29, 41],supps:[35, 24]},
  {date:"18/06/2025",nums:[13, 18, 24, 32, 35, 39],supps:[1, 28]},
  {date:"20/06/2025",nums:[4, 5, 13, 19, 26, 37],supps:[9, 17]},
  {date:"23/06/2025",nums:[4, 6, 7, 24, 29, 39],supps:[31, 40]},
  {date:"25/06/2025",nums:[5, 14, 32, 33, 34, 39],supps:[22, 8]},
  {date:"27/06/2025",nums:[2, 8, 21, 27, 28, 45],supps:[24, 39]},
  {date:"30/06/2025",nums:[15, 16, 33, 38, 40, 41],supps:[2, 10]},
  {date:"02/07/2025",nums:[18, 20, 22, 26, 43, 45],supps:[3, 36]},
  {date:"04/07/2025",nums:[3, 7, 14, 21, 23, 33],supps:[26, 5]},
  {date:"07/07/2025",nums:[11, 13, 27, 29, 31, 36],supps:[6, 37]},
  {date:"09/07/2025",nums:[7, 14, 22, 32, 37, 42],supps:[13, 41]},
  {date:"11/07/2025",nums:[9, 24, 28, 30, 37, 38],supps:[3, 16]},
  {date:"14/07/2025",nums:[4, 5, 9, 40, 42, 45],supps:[6, 2]},
  {date:"16/07/2025",nums:[3, 26, 29, 34, 35, 36],supps:[41, 5]},
  {date:"18/07/2025",nums:[7, 9, 20, 26, 35, 36],supps:[38, 23]},
  {date:"21/07/2025",nums:[4, 12, 13, 15, 33, 44],supps:[7, 19]},
  {date:"23/07/2025",nums:[3, 16, 20, 29, 39, 44],supps:[11, 32]},
  {date:"25/07/2025",nums:[3, 6, 27, 29, 31, 45],supps:[5, 24]},
  {date:"28/07/2025",nums:[22, 25, 31, 36, 39, 42],supps:[18, 13]},
  {date:"30/07/2025",nums:[1, 17, 20, 27, 35, 39],supps:[21, 16]},
  {date:"01/08/2025",nums:[2, 20, 22, 27, 28, 34],supps:[7, 3]},
  {date:"04/08/2025",nums:[7, 19, 34, 38, 44, 45],supps:[20, 13]},
  {date:"06/08/2025",nums:[8, 10, 20, 28, 31, 32],supps:[23, 22]},
  {date:"08/08/2025",nums:[1, 9, 13, 29, 34, 44],supps:[41, 28]},
  {date:"11/08/2025",nums:[5, 10, 11, 13, 17, 39],supps:[35, 45]},
  {date:"13/08/2025",nums:[5, 11, 14, 17, 24, 36],supps:[16, 1]},
  {date:"15/08/2025",nums:[15, 20, 23, 25, 26, 36],supps:[11, 1]},
  {date:"18/08/2025",nums:[6, 13, 16, 38, 43, 44],supps:[40, 10]},
  {date:"20/08/2025",nums:[2, 4, 9, 14, 20, 26],supps:[39, 36]},
  {date:"22/08/2025",nums:[4, 6, 13, 17, 29, 32],supps:[5, 15]},
  {date:"25/08/2025",nums:[4, 6, 10, 23, 37, 41],supps:[11, 36]},
  {date:"27/08/2025",nums:[12, 15, 24, 31, 33, 42],supps:[19, 23]},
  {date:"29/08/2025",nums:[6, 9, 19, 24, 36, 39],supps:[26, 37]},
  {date:"01/09/2025",nums:[7, 8, 27, 31, 40, 44],supps:[16, 42]},
  {date:"03/09/2025",nums:[10, 11, 23, 34, 38, 43],supps:[30, 31]},
  {date:"05/09/2025",nums:[3, 14, 17, 26, 32, 38],supps:[11, 42]},
  {date:"08/09/2025",nums:[7, 12, 16, 21, 25, 42],supps:[20, 32]},
  {date:"10/09/2025",nums:[3, 14, 20, 22, 31, 45],supps:[37, 29]},
  {date:"12/09/2025",nums:[4, 5, 16, 22, 26, 43],supps:[40, 9]},
  {date:"15/09/2025",nums:[4, 23, 34, 39, 41, 42],supps:[45, 14]},
  {date:"17/09/2025",nums:[17, 20, 22, 23, 42, 44],supps:[35, 18]},
  {date:"19/09/2025",nums:[11, 30, 32, 33, 37, 45],supps:[21, 1]},
  {date:"22/09/2025",nums:[2, 3, 10, 13, 27, 41],supps:[24, 5]},
  {date:"24/09/2025",nums:[17, 19, 22, 28, 35, 43],supps:[33, 20]},
  {date:"26/09/2025",nums:[7, 24, 26, 28, 36, 39],supps:[2, 8]},
  {date:"29/09/2025",nums:[11, 16, 26, 27, 28, 35],supps:[15, 22]},
  {date:"01/10/2025",nums:[3, 7, 16, 22, 24, 37],supps:[20, 33]},
  {date:"03/10/2025",nums:[18, 24, 36, 41, 43, 44],supps:[6, 32]},
  {date:"06/10/2025",nums:[23, 24, 35, 39, 40, 43],supps:[30, 37]},
  {date:"08/10/2025",nums:[12, 29, 30, 35, 40, 44],supps:[31, 37]},
  {date:"10/10/2025",nums:[6, 7, 20, 36, 44, 45],supps:[26, 24]},
  {date:"13/10/2025",nums:[11, 14, 16, 17, 27, 28],supps:[2, 7]},
  {date:"15/10/2025",nums:[10, 13, 25, 31, 32, 36],supps:[22, 26]},
  {date:"17/10/2025",nums:[2, 11, 22, 33, 40, 43],supps:[27, 39]},
  {date:"20/10/2025",nums:[3, 10, 13, 30, 31, 44],supps:[5, 7]},
  {date:"22/10/2025",nums:[1, 3, 5, 30, 34, 41],supps:[27, 8]},
  {date:"24/10/2025",nums:[3, 11, 15, 22, 23, 37],supps:[41, 13]},
  {date:"27/10/2025",nums:[1, 6, 11, 14, 26, 44],supps:[17, 2]},
  {date:"29/10/2025",nums:[5, 7, 10, 20, 22, 35],supps:[27, 45]},
  {date:"31/10/2025",nums:[5, 13, 16, 26, 41, 42],supps:[34, 23]},
  {date:"03/11/2025",nums:[13, 14, 23, 25, 29, 45],supps:[31, 8]},
  {date:"05/11/2025",nums:[7, 15, 18, 26, 27, 37],supps:[19, 44]},
  {date:"07/11/2025",nums:[3, 6, 16, 23, 30, 31],supps:[13, 18]},
  {date:"10/11/2025",nums:[3, 5, 22, 28, 31, 38],supps:[26, 14]},
  {date:"12/11/2025",nums:[11, 15, 33, 34, 35, 45],supps:[8, 37]},
  {date:"14/11/2025",nums:[11, 15, 28, 31, 34, 44],supps:[9, 20]},
  {date:"17/11/2025",nums:[2, 4, 5, 7, 11, 37],supps:[30, 22]},
  {date:"19/11/2025",nums:[13, 25, 26, 35, 42, 43],supps:[24, 5]},
  {date:"21/11/2025",nums:[4, 5, 10, 20, 26, 40],supps:[14, 24]},
  {date:"24/11/2025",nums:[4, 15, 17, 18, 20, 44],supps:[7, 11]},
  {date:"26/11/2025",nums:[8, 16, 27, 36, 43, 44],supps:[31, 30]},
  {date:"28/11/2025",nums:[8, 24, 25, 30, 39, 43],supps:[21, 1]},
  {date:"01/12/2025",nums:[1, 6, 8, 30, 36, 38],supps:[43, 5]},
  {date:"03/12/2025",nums:[2, 15, 22, 35, 37, 38],supps:[39, 6]},
  {date:"05/12/2025",nums:[8, 9, 11, 16, 23, 33],supps:[34, 1]},
  {date:"08/12/2025",nums:[6, 12, 26, 37, 39, 40],supps:[24, 7]},
  {date:"10/12/2025",nums:[2, 10, 15, 26, 33, 38],supps:[19, 14]},
  {date:"12/12/2025",nums:[2, 10, 15, 36, 39, 45],supps:[25, 38]},
  {date:"15/12/2025",nums:[8, 9, 14, 23, 27, 33],supps:[4, 3]},
  {date:"17/12/2025",nums:[7, 14, 17, 29, 36, 45],supps:[12, 32]},
  {date:"19/12/2025",nums:[2, 3, 5, 17, 25, 38],supps:[9, 7]},
  {date:"22/12/2025",nums:[5, 14, 20, 22, 37, 40],supps:[8, 28]},
  {date:"24/12/2025",nums:[11, 19, 28, 36, 39, 41],supps:[45, 44]},
  {date:"26/12/2025",nums:[7, 13, 19, 33, 36, 44],supps:[39, 1]},
  {date:"29/12/2025",nums:[6, 7, 27, 30, 38, 42],supps:[19, 34]},
  {date:"31/12/2025",nums:[2, 6, 9, 22, 40, 42],supps:[28, 27]},
  {date:"02/01/2026",nums:[8, 15, 23, 31, 36, 39],supps:[21, 5]},
  {date:"05/01/2026",nums:[6, 22, 25, 29, 38, 41],supps:[5, 30]},
  {date:"07/01/2026",nums:[1, 13, 18, 26, 28, 30],supps:[2, 44]},
  {date:"09/01/2026",nums:[4, 5, 9, 15, 29, 36],supps:[19, 17]},
  {date:"12/01/2026",nums:[10, 15, 16, 23, 29, 42],supps:[43, 4]},
  {date:"14/01/2026",nums:[2, 11, 15, 35, 36, 43],supps:[44, 31]},
  {date:"16/01/2026",nums:[4, 9, 15, 40, 42, 44],supps:[36, 41]},
  {date:"19/01/2026",nums:[17, 28, 29, 33, 36, 39],supps:[23, 44]},
  {date:"21/01/2026",nums:[20, 27, 35, 40, 42, 44],supps:[30, 6]},
  {date:"23/01/2026",nums:[1, 2, 20, 23, 32, 37],supps:[39, 19]},
  {date:"26/01/2026",nums:[2, 4, 13, 17, 26, 39],supps:[19, 15]},
  {date:"28/01/2026",nums:[19, 26, 29, 37, 42, 43],supps:[35, 24]},
  {date:"30/01/2026",nums:[3, 7, 8, 12, 29, 44],supps:[19, 31]},
  {date:"02/02/2026",nums:[14, 30, 32, 34, 37, 40],supps:[16, 9]},
  {date:"04/02/2026",nums:[1, 12, 13, 14, 18, 22],supps:[25, 20]},
  {date:"06/02/2026",nums:[1, 17, 20, 31, 32, 43],supps:[14, 11]},
  {date:"09/02/2026",nums:[12, 17, 23, 27, 30, 38],supps:[2, 11]},
  {date:"11/02/2026",nums:[5, 15, 26, 27, 40, 41],supps:[16, 32]},
  {date:"13/02/2026",nums:[17, 21, 24, 35, 39, 44],supps:[45, 38]},
  {date:"16/02/2026",nums:[9, 14, 20, 24, 36, 42],supps:[6, 5]},
  {date:"18/02/2026",nums:[2, 5, 9, 14, 22, 32],supps:[12, 21]},
  {date:"20/02/2026",nums:[6, 24, 26, 31, 37, 42],supps:[13, 20]},
  {date:"23/02/2026",nums:[13, 15, 18, 23, 29, 33],supps:[10, 1]},
  {date:"25/02/2026",nums:[18, 21, 30, 33, 38, 45],supps:[9, 24]},
  {date:"27/02/2026",nums:[11, 18, 22, 25, 29, 43],supps:[16, 7]},
  {date:"02/03/2026",nums:[6, 8, 15, 27, 33, 36],supps:[22, 9]},
  {date:"04/03/2026",nums:[4, 13, 16, 40, 43, 45],supps:[15, 7]},
  {date:"06/03/2026",nums:[1, 9, 22, 30, 32, 44],supps:[25, 7]},
  {date:"09/03/2026",nums:[1, 9, 16, 19, 23, 25],supps:[10, 14]},
  {date:"11/03/2026",nums:[4, 25, 27, 31, 36, 42],supps:[10, 24]},
  {date:"13/03/2026",nums:[14, 25, 33, 36, 37, 45],supps:[42, 29]},
  {date:"16/03/2026",nums:[3, 11, 16, 19, 34, 43],supps:[37, 23]},
  {date:"18/03/2026",nums:[10, 11, 26, 31, 38, 43],supps:[21, 18]},
  {date:"20/03/2026",nums:[7, 9, 10, 17, 18, 37],supps:[2, 6]},
  {date:"23/03/2026",nums:[7, 12, 14, 19, 20, 21],supps:[27, 13]},
  {date:"25/03/2026",nums:[15, 21, 32, 34, 39, 40],supps:[23, 11]},
  {date:"27/03/2026",nums:[8, 10, 11, 28, 35, 36],supps:[34, 41]},
  {date:"30/03/2026",nums:[5, 7, 13, 19, 26, 27],supps:[29, 18]},
  {date:"01/04/2026",nums:[11, 14, 20, 30, 38, 42],supps:[12, 1]},
  {date:"03/04/2026",nums:[13, 28, 39, 40, 41, 43],supps:[2, 22]}
];

// Presets
const SAT_PRESETS = [
  {group:"S7 Confirmed",label:"S7 #1 ★",nums:"6,7,8,11,13,17,45"},
  {group:"S7 Confirmed",label:"S7 #2 ★",nums:"1,9,13,32,33,34,42"},
  {group:"S7 Confirmed",label:"S7 #3 ★",nums:"1,6,10,21,24,30,42"},
  {group:"S7 Confirmed",label:"S7 #4 ★",nums:"3,11,23,31,33,39,45"},
  {group:"S7 Confirmed",label:"S7 #5 ★",nums:"1,2,18,21,24,30,36"},
  {group:"S7 Confirmed",label:"S7 #6 ★",nums:"3,6,7,11,13,17,45"},
  {group:"S8 Best",label:"S8A Best",nums:"6,18,19,23,30,37,43,44"},
  {group:"S8 Best",label:"S8B Best",nums:"1,6,8,10,23,29,31,40"},
  {group:"S8 Best",label:"S8C Best",nums:"10,20,21,23,25,38,39,43"},
  {group:"S9 Kane",label:"S9 #1",nums:"1,6,8,10,23,29,31,38,40"},
  {group:"S9 Kane",label:"S9 #2",nums:"2,8,12,18,24,30,39,41,42"},
  {group:"S9 Kane",label:"S9 #3",nums:"3,9,11,17,19,22,23,29,37"},
  {group:"S9 Kane",label:"S9 #4",nums:"3,8,9,24,28,36,37,38,41"},
  {group:"S9 Kane",label:"S9 #5",nums:"10,19,20,21,23,25,38,39,43"},
  {group:"S9 Kane",label:"S9 #6",nums:"1,3,6,8,10,18,29,40,42"},
  {group:"S10",label:"S10 Current",nums:"3,6,7,9,11,13,17,22,42,45"},
];

const MM_PRESETS = [
  {group:"S8 Confirmed",label:"S8A ★★",nums:"4,24,25,27,31,36,41,42"},
  {group:"S8 Confirmed",label:"S8B ★★",nums:"6,9,14,20,24,34,36,42"},
  {group:"S8 Confirmed",label:"S8C ★★",nums:"19,23,26,29,35,37,42,43"},
  {group:"S9 Kane",label:"S9A ★★★",nums:"4,5,10,16,20,22,26,40,43"},
  {group:"S9 Kane",label:"S9B ★★★",nums:"4,5,16,18,20,22,26,43,45"},
  {group:"S7 Portfolio",label:"S7 #1 ★★",nums:"4,5,16,20,22,26,43"},
  {group:"S7 Portfolio",label:"S7 #2",nums:"6,9,14,20,24,36,42"},
  {group:"S7 Portfolio",label:"S7 #3",nums:"6,9,20,24,34,36,42"},
  {group:"S7 Portfolio",label:"S7 #4",nums:"4,24,25,27,31,36,42"},
  {group:"S7 Portfolio",label:"S7 #5",nums:"4,24,25,31,36,41,42"},
  {group:"S7 Portfolio",label:"S7 #6",nums:"4,5,16,22,26,40,43"},
  {group:"S7 Portfolio",label:"S7 #7",nums:"4,5,9,16,22,26,43"},
  {group:"S10",label:"S10 Best ★★★",nums:"4,5,24,25,27,31,36,39,41,42"},
];

function NumberBall({n,highlight,size=32}) {
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",justifyContent:"center",
      width:size,height:size,borderRadius:"50%",
      background:highlight?"var(--acc)":"#151f30",
      color:highlight?"#070c18":"#5a6f96",
      fontWeight:800,fontSize:size>28?13:11,margin:"2px",
      border:highlight?"none":"1px solid #1e2d44",flexShrink:0,
    }}>{n}</span>
  );
}

function ResultCard({result,label1}) {
  const {combos,divCounts,prize,cost,net,div1Hits,costPerDraw}=result;
  return (
    <div style={{background:"#0a1020",border:"1px solid #1e2d44",borderRadius:10,padding:14,marginTop:8}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
        {[1,2,3,4,5,6].map(d=>(
          <div key={d} style={{
            background:d===1&&divCounts[1]>0?"var(--acc-dim)":"#111827",
            border:`1px solid ${d===1&&divCounts[1]>0?"var(--acc)":"#1e2d44"}`,
            borderRadius:8,padding:"7px 10px",textAlign:"center",minWidth:46,
          }}>
            <div style={{color:"#5a6f96",fontSize:8,letterSpacing:1.5}}>DIV {d}</div>
            <div style={{color:d===1&&divCounts[1]>0?"var(--acc)":"#e2e8f0",fontWeight:800,fontSize:17}}>{divCounts[d]}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:10}}>
        {[["COMBOS",combos],["$/DRAW",`$${costPerDraw.toFixed(2)}`],["PRIZE",`$${prize.toLocaleString("en-AU",{maximumFractionDigits:0})}`],["NET",`$${net.toLocaleString("en-AU",{maximumFractionDigits:0})}`,net>=0?"var(--acc)":"#f87171"]].map(([l,v,c])=>(
          <div key={l}>
            <div style={{color:"#5a6f96",fontSize:8,letterSpacing:1.5}}>{l}</div>
            <div style={{color:c||"#e2e8f0",fontWeight:700,fontSize:12}}>{v}</div>
          </div>
        ))}
      </div>
      {div1Hits.length>0&&(
        <div>
          <div style={{color:"var(--acc)",fontSize:8,letterSpacing:1.5,marginBottom:6}}>{label1} DIV 1 WINS</div>
          {div1Hits.map((h,i)=>(
            <div key={i} style={{color:"#e2e8f0",fontSize:11,padding:"3px 0",borderBottom:"1px solid #1e2d44"}}>🏆 {h}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function SetInput({label,value,onChange,onRun,presets,result,loading,label1}) {
  const [showP,setShowP]=useState(false);
  const numbers=value.split(",").map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=45);
  const groups={};
  presets.forEach(p=>{if(!groups[p.group])groups[p.group]=[];groups[p.group].push(p);});
  return (
    <div style={{background:"#0f1926",border:"1px solid #1e2d44",borderRadius:12,padding:"16px 20px",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{color:"var(--acc)",fontWeight:800,fontSize:10,letterSpacing:2}}>{label}</span>
        <button onClick={()=>setShowP(p=>!p)} style={{background:"#1e2d44",border:"none",color:"#5a6f96",borderRadius:6,padding:"3px 10px",fontSize:9,cursor:"pointer",letterSpacing:1}}>
          PRESETS {showP?"▴":"▾"}
        </button>
      </div>
      {showP&&(
        <div style={{background:"#0a1020",borderRadius:8,border:"1px solid #1e2d44",padding:10,marginBottom:10}}>
          {Object.entries(groups).map(([group,items])=>(
            <div key={group} style={{marginBottom:8}}>
              <div style={{color:"#5a6f96",fontSize:8,letterSpacing:1.5,marginBottom:5}}>{group}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {items.map(p=>(
                  <button key={p.label} onClick={()=>{onChange(p.nums);setShowP(false);}} style={{
                    background:"#111827",border:"1px solid var(--acc-dim)",color:"var(--acc)",
                    borderRadius:6,padding:"4px 9px",fontSize:9,cursor:"pointer",
                  }}>{p.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder="e.g. 4,24,25,27,31,36,41,42"
          onKeyDown={e=>e.key==="Enter"&&onRun()}
          style={{flex:1,background:"#0a1020",border:"1px solid #1e2d44",color:"#e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:12,outline:"none",fontFamily:"monospace"}}
        />
        <button onClick={onRun} disabled={loading} style={{
          background:loading?"#1e2d44":"var(--acc)",color:loading?"#5a6f96":"#070c18",
          border:"none",borderRadius:8,padding:"9px 20px",fontWeight:800,fontSize:10,cursor:loading?"not-allowed":"pointer",letterSpacing:1.5,fontFamily:"inherit",
        }}>{loading?"...":"RUN"}</button>
      </div>
      <div style={{display:"flex",flexWrap:"wrap"}}>
        {numbers.map(n=><NumberBall key={n} n={n} highlight />)}
      </div>
      {result&&<ResultCard result={result} label1={label1} />}
    </div>
  );
}

function CSVUpload({onLoad,drawCount,dateRange,isMM}) {
  const [drag,setDrag]=useState(false);
  const [status,setStatus]=useState(null);
  const ref=useRef();
  const process=useCallback(file=>{
    if(!file)return;
    setStatus("loading");
    const r=new FileReader();
    r.onload=e=>{
      try{const d=parseCSV(e.target.result);if(d.length<10){setStatus("error");return;}onLoad(d);setStatus("success");}
      catch{setStatus("error");}
    };
    r.readAsText(file);
  },[onLoad]);

  if(isMM) return (
    <div style={{background:"#0f1926",border:"1px solid #1e2d44",borderRadius:10,padding:"12px 16px",marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:"var(--acc)",fontWeight:800,fontSize:9,letterSpacing:2}}>DATA</span>
        <span style={{color:"#e2e8f0",fontSize:10}}>{drawCount} draws · {dateRange}</span>
        <span style={{color:"#5a6f96",fontSize:9}}>· Full MM history since inception loaded</span>
      </div>
    </div>
  );

  return (
    <div style={{background:"#0f1926",border:"1px solid #1e2d44",borderRadius:10,padding:"14px 16px",marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span style={{color:"var(--acc)",fontWeight:800,fontSize:9,letterSpacing:2}}>DATA SOURCE</span>
        <span style={{color:"#5a6f96",fontSize:9}}>{drawCount.toLocaleString()} DRAWS · {dateRange}</span>
      </div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);process(e.dataTransfer.files[0])}}
        onClick={()=>ref.current.click()}
        style={{border:`2px dashed ${drag?"var(--acc)":"#1e2d44"}`,borderRadius:8,padding:"12px 16px",cursor:"pointer",background:drag?"var(--acc-dim)":"#0a1020",textAlign:"center"}}>
        <div style={{color:"#e2e8f0",fontSize:11,fontWeight:600}}>📂 Drop Kaggle CSV (1986–2021) → expands to 2,060 draws</div>
        <div style={{color:"#5a6f96",fontSize:9,marginTop:3}}>xlotto-result-saturday.csv</div>
        {status==="loading"&&<div style={{color:"#fbbf24",fontSize:9,marginTop:4}}>Loading...</div>}
        {status==="success"&&<div style={{color:"var(--acc)",fontSize:9,marginTop:4}}>✅ Full 2,060 draw history loaded</div>}
        {status==="error"&&<div style={{color:"#f87171",fontSize:9,marginTop:4}}>❌ Parse error — check file format</div>}
        <input ref={ref} type="file" accept=".csv" style={{display:"none"}} onChange={e=>process(e.target.files[0])} />
      </div>
    </div>
  );
}

function FrequencyTab({draws}) {
  const freq=getFrequency(draws);
  const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]);
  const max=sorted[0][1];
  return (
    <div>
      <div style={{color:"#5a6f96",fontSize:10,marginBottom:14}}>{draws.length.toLocaleString()} draws analysed</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:7}}>
        {sorted.map(([n,count],i)=>{
          const hot=i<10,cold=i>=35,pct=(count/draws.length*100).toFixed(1);
          return (
            <div key={n} style={{background:"#0f1926",border:`1px solid ${hot?"var(--acc-dim)":cold?"#f8717133":"#1e2d44"}`,borderRadius:8,padding:"8px 10px",display:"flex",alignItems:"center",gap:8}}>
              <NumberBall n={parseInt(n)} highlight={hot} size={27} />
              <div style={{flex:1}}>
                <div style={{color:hot?"var(--acc)":cold?"#f87171":"#e2e8f0",fontWeight:700,fontSize:12}}>{count}×</div>
                <div style={{height:3,background:"#1e2d44",borderRadius:2,overflow:"hidden",marginTop:3}}>
                  <div style={{height:"100%",width:`${count/max*100}%`,background:hot?"var(--acc)":cold?"#f87171":"#4ade80",borderRadius:2}} />
                </div>
                <div style={{color:"#5a6f96",fontSize:8}}>{pct}% {hot?"🔥":cold?"🧊":""}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [game,setGame]=useState("sat");
  const [tab,setTab]=useState("backtest");
  const [sets,setSets]=useState(["","",""]);
  const [results,setResults]=useState([null,null,null]);
  const [loading,setLoading]=useState([false,false,false]);
  const [csvDraws,setCsvDraws]=useState(null);

  const satDraws=useCallback(()=>{
    if(!csvDraws)return SAT_RECENT;
    const rd=new Set(SAT_RECENT.map(d=>d.date));
    return [...csvDraws.filter(d=>!rd.has(d.date)),...SAT_RECENT];
  },[csvDraws]);

  const currentDraws=game==="sat"?satDraws():MM_DRAWS;
  const prize1=game==="sat"?5000000:1000000;
  const label1=game==="sat"?"SAT LOTTO $5M":"MM $1M";
  const presets=game==="sat"?SAT_PRESETS:MM_PRESETS;
  const accent=game==="sat"?"#00d68f":"#f5a623";
  const dateRange=currentDraws.length>0?`${currentDraws[0].date} – ${currentDraws[currentDraws.length-1].date}`:"";

  const runSet=i=>{
    const nums=sets[i].split(",").map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=45);
    if(nums.length<6)return;
    setLoading(l=>{const n=[...l];n[i]=true;return n;});
    setTimeout(()=>{
      const res=runBacktest(nums,currentDraws,prize1);
      setResults(r=>{const n=[...r];n[i]=res;return n;});
      setLoading(l=>{const n=[...l];n[i]=false;return n;});
    },50);
  };

  const runAll=()=>[0,1,2].forEach(i=>{
    const nums=sets[i].split(",").map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=45);
    if(nums.length>=6)runSet(i);
  });

  const switchGame=g=>{setGame(g);setSets(["","",""]);setResults([null,null,null]);};

  return (
    <div style={{minHeight:"100vh",background:"#070c18",color:"#e2e8f0",fontFamily:"'JetBrains Mono','Fira Code',monospace","--acc":accent,"--acc-dim":accent+"22"}}>
      {/* Header */}
      <div style={{borderBottom:"1px solid #1e2d44",padding:"16px 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:"var(--acc)",fontWeight:900,fontSize:19,letterSpacing:4}}>LOTTOEDGE</div>
          <div style={{color:"#5a6f96",fontSize:8,letterSpacing:3}}>BACKTEST ENGINE</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"#e2e8f0",fontWeight:700,fontSize:12}}>{currentDraws.length.toLocaleString()} DRAWS</div>
          <div style={{color:"#5a6f96",fontSize:8}}>{dateRange}</div>
          <div style={{color:"var(--acc)",fontSize:8,marginTop:2}}>{game==="sat"?"PRIZE $5–6M · SAT WEEKLY":"PRIZE $1M · MON/WED/FRI"}</div>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"24px 16px"}}>
        {/* Game switcher */}
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {[{id:"sat",label:"SATURDAY LOTTO",sub:"$5–6M shared · 1 draw/week"},{id:"mm",label:"MILLIONAIRE MEDLEY",sub:"$1M guaranteed · Mon/Wed/Fri"}].map(g=>(
            <button key={g.id} onClick={()=>switchGame(g.id)} style={{
              flex:1,padding:"11px 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",textAlign:"left",
              background:game===g.id?"var(--acc-dim)":"#0f1926",
              border:`2px solid ${game===g.id?"var(--acc)":"#1e2d44"}`,
              color:game===g.id?"var(--acc)":"#5a6f96",transition:"all 0.2s",
            }}>
              <div style={{fontWeight:800,fontSize:10,letterSpacing:1.5}}>{g.label}</div>
              <div style={{fontSize:8,marginTop:2,opacity:0.7}}>{g.sub}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,marginBottom:20}}>
          {["backtest","frequency"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              background:"transparent",border:`1px solid ${tab===t?"var(--acc)":"#1e2d44"}`,
              color:tab===t?"var(--acc)":"#5a6f96",borderRadius:8,padding:"6px 16px",
              fontWeight:700,fontSize:9,cursor:"pointer",letterSpacing:2,fontFamily:"inherit",
            }}>{t.toUpperCase()}</button>
          ))}
        </div>

        <CSVUpload onLoad={setCsvDraws} drawCount={currentDraws.length} dateRange={dateRange} isMM={game==="mm"} />

        {tab==="backtest"&&(
          <div>
            <div style={{color:"#5a6f96",fontSize:9,letterSpacing:1.5,textAlign:"center",marginBottom:16}}>
              ENTER UP TO 3 SYSTEM SETS · 6–12 NUMBERS · RANGE 1–45
            </div>
            {[0,1,2].map(i=>(
              <SetInput key={`${game}-${i}`}
                label={`SET ${String.fromCharCode(65+i)}${results[i]?.div1Hits?.length>0?" ★":""}`}
                value={sets[i]} onChange={v=>setSets(s=>{const n=[...s];n[i]=v;return n;})}
                onRun={()=>runSet(i)} presets={presets} result={results[i]}
                loading={loading[i]} label1={label1}
              />
            ))}
            <div style={{textAlign:"center",marginTop:14}}>
              <button onClick={runAll} style={{
                background:"var(--acc)",color:"#070c18",border:"none",borderRadius:10,
                padding:"13px 40px",fontWeight:900,fontSize:10,cursor:"pointer",letterSpacing:2,fontFamily:"inherit",
              }}>▶ RUN ALL SETS</button>
            </div>
          </div>
        )}

        {tab==="frequency"&&<FrequencyTab draws={currentDraws} />}

        <div style={{textAlign:"center",marginTop:40,color:"#1e2d44",fontSize:8,letterSpacing:2}}>
          LOTTOEDGE · SIMULATED DATA · NOT FINANCIAL ADVICE · PRIZE ESTIMATES ONLY
        </div>
      </div>
    </div>
  );
}

