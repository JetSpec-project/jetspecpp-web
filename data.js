/* JetSpec++ site: the paper's numbers, shared by the page script. Every number is copied from
   the paper (arXiv 2610.19792), except the rows that the comments mark as measured later. */
(function () {
  "use strict";

  // Paper, Table 3: GB200, batch 1, temperature 0, budget 16 (5 for SSD), 128 prompts per benchmark.
  // Columns: tok/s, speedup over AR, tau, round ms, verify ms, exposed ms, GPUs.
  // The "disaggregated" rows are not in the paper: measured on 2026-10-29 on the same setup, with the draft
  // model on a second GPU. Their speedup is over AR measured in the same session (Qwen3-8B 187.3 / 188.2,
  // Qwen3.8-27B 59.6 / 60.5 tok/s). Rows of one method stay next to each other.
  var SPEED = {
    "qwen3-8b/gsm8k": { target: "Qwen3-8B", bench: "GSM8K", rows: [
      ["AR", 182.3, 1.00, 1.00, 5.49, 5.45, 0.04, 1],
      ["DSpark", 744.3, 4.08, 7.34, 9.92, 6.16, 3.76, 1],
      ["DSpark, disaggregated", 774.0, 4.13, 7.42, null, null, null, 2],
      ["DFlash", 620.1, 3.40, 5.87, 9.52, 6.11, 3.42, 1],
      ["DFlash, disaggregated", 625.6, 3.34, 5.87, null, null, null, 2],
      ["SSD", 276.5, 1.52, 4.06, 14.75, 6.25, 8.51, 2],
      ["JetSpec++", 1148.8, 6.30, 7.78, 6.84, 6.23, 0.61, 2]] },
    "qwen3-8b/math500": { target: "Qwen3-8B", bench: "MATH-500", rows: [
      ["AR", 182.7, 1.00, 1.00, 5.47, 5.44, 0.04, 1],
      ["DSpark", 902.1, 4.94, 8.98, 9.95, 6.16, 3.80, 1],
      ["DSpark, disaggregated", 929.3, 4.94, 9.03, null, null, null, 2],
      ["DFlash", 795.5, 4.35, 7.65, 9.63, 6.16, 3.47, 1],
      ["DFlash, disaggregated", 808.4, 4.30, 7.72, null, null, null, 2],
      ["SSD", 282.5, 1.55, 4.20, 14.88, 6.33, 8.55, 2],
      ["JetSpec++", 1361.1, 7.45, 9.41, 6.92, 6.26, 0.66, 2]] },
    "qwen3.8-27b/gsm8k": { target: "Qwen3.8-27B", bench: "GSM8K", rows: [
      ["AR", 60.3, 1.00, 1.00, 16.58, 16.54, 0.04, 1],
      ["DSpark", 249.6, 4.14, 7.93, 31.88, 27.42, 4.46, 1],
      ["DSpark, disaggregated", 264.1, 4.43, 7.89, null, null, null, 2],
      ["JetSpec++", 342.4, 5.68, 9.67, 28.47, 27.76, 0.71, 2]] },
    "qwen3.8-27b/math500": { target: "Qwen3.8-27B", bench: "MATH-500", rows: [
      ["AR", 59.3, 1.00, 1.00, 16.88, 16.83, 0.04, 1],
      ["DSpark", 279.8, 4.72, 8.99, 32.09, 27.57, 4.52, 1],
      ["DSpark, disaggregated", 299.8, 4.96, 9.02, null, null, null, 2],
      ["JetSpec++", 367.2, 6.20, 10.45, 28.47, 27.70, 0.77, 2]] }
  };

  // Paper, Table 1 (Qwen3-8B) and Table 2 (Qwen3.8-27B): acceptance length tau.
  var BENCHES = ["GSM8K", "MATH-500", "AIME25", "HumanEval", "MBPP", "LCB", "MT-Bench"];
  var TAU = {
    "qwen3-8b": {
      "0/16": { "DFlash": [5.91, 7.59, 6.89, 5.16, 4.91, 5.45, 3.24], "DSpark": [7.31, 9.01, 8.35, 6.57, 6.17, 6.92, 3.89], "Domino": [6.91, 8.74, 8.09, 6.06, 5.90, 6.27, 3.74], "JetSpec": [5.90, 7.43, 6.78, 5.28, 4.92, 5.45, 3.17], "JetSpec++ J1-R1": [7.98, 9.63, 8.97, 7.23, 6.73, 7.59, 4.38], "JetSpec++ J3-R3": [9.78, 11.04, 10.49, 8.79, 8.24, 8.95, 5.29] },
      "0/32": { "DFlash": [5.18, 6.67, 6.07, 4.53, 4.31, 4.70, 2.95], "DSpark": [7.06, 8.66, 7.73, 6.25, 5.85, 6.38, 3.77], "Domino": [6.25, 7.96, 7.37, 5.61, 5.29, 5.92, 3.49], "JetSpec": [6.02, 7.81, 7.02, 5.34, 4.96, 5.53, 3.19], "JetSpec++ J1-R1": [8.77, 11.45, 10.42, 7.70, 7.02, 8.29, 4.52], "JetSpec++ J3-R3": [11.83, 14.55, 13.13, 10.27, 9.25, 10.50, 5.51] },
      "1/16": { "DFlash": [5.19, 5.37, 4.25, 4.26, 4.24, 4.78, 2.81], "DSpark": [6.10, 6.13, 4.69, 5.32, 5.18, 6.05, 3.26], "Domino": [5.86, 5.94, 4.79, 4.97, 4.96, 5.50, 3.16], "JetSpec": [5.24, 5.45, 4.30, 4.39, 4.41, 4.95, 2.81], "JetSpec++ J1-R1": [6.88, 6.50, 5.25, 5.84, 5.53, 6.55, 3.51], "JetSpec++ J3-R3": [8.10, 7.18, 5.59, 6.50, 6.31, 7.21, 4.07] },
      "1/32": { "DFlash": [4.70, 4.85, 4.16, 3.97, 3.81, 4.20, 2.64], "DSpark": [5.99, 6.03, 4.67, 5.08, 4.91, 5.54, 3.17], "Domino": [5.47, 5.87, 4.62, 4.68, 4.47, 5.27, 2.96], "JetSpec": [5.34, 5.62, 4.30, 4.47, 4.29, 4.66, 2.76], "JetSpec++ J1-R1": [7.33, 7.24, 5.48, 6.07, 5.80, 7.01, 3.59], "JetSpec++ J3-R3": [9.41, 8.53, 5.77, 7.33, 6.95, 7.81, 4.09] }
    },
    "qwen3.8-27b": {
      "0/16": { "DSpark": [8.02, 8.94, 8.30, 8.19, 7.62, 5.19, 4.00], "JetSpec++ J1-R1": [8.71, 9.53, 8.58, 9.18, 8.41, 5.80, 4.30], "JetSpec++ J3-R3": [10.05, 10.83, 10.15, 10.72, 9.80, 6.93, 4.91] },
      "0/32": { "DSpark": [7.57, 8.49, 7.64, 7.13, 6.96, 4.84, 3.83], "JetSpec++ J1-R1": [9.68, 11.10, 9.82, 10.72, 9.42, 5.94, 4.40], "JetSpec++ J3-R3": [12.35, 14.05, 12.49, 13.47, 11.76, 7.43, 5.15] },
      "1/16": { "DSpark": [6.48, 7.60, 7.08, 6.91, 6.12, 4.29, 3.39], "JetSpec++ J1-R1": [7.84, 7.98, 7.16, 8.07, 6.92, 4.66, 3.55], "JetSpec++ J3-R3": [8.46, 9.00, 7.96, 8.48, 7.80, 5.34, 3.92] },
      "1/32": { "DSpark": [6.42, 7.17, 6.35, 6.25, 5.66, 4.08, 3.23], "JetSpec++ J1-R1": [9.02, 8.87, 7.88, 8.60, 7.38, 4.89, 3.59], "JetSpec++ J3-R3": [10.64, 10.50, 9.03, 9.93, 8.16, 5.67, 4.05] }
    }
  };

  // Batch sizes 1 to 4 on GB200, Qwen3-8B, MATH-500, over the window with every request in flight.
  // Batch size 1 is the paper's Table 3 setup. At batch sizes 2 to 4, JetSpec++ and one-GPU DSpark are the
  // median of three or more runs, and AR is one run. DSpark on two GPUs is one data-parallel run: one replica on
  // each GPU, each replica serves part of the batch, totals summed. It has no value at batch size 1.
  // Rows: method, total tok/s at batch sizes 1 to 4, tok/s per user at batch sizes 1 to 4.
  var BATCH = [
    ["AR", [182.7, 369.9, 548.2, 702.8], [182.7, 185.0, 182.7, 175.7]],
    ["DSpark", [902.1, 1756.4, 2335.2, 3034.0], [902.1, 878.2, 778.4, 758.5]],
    ["DSpark, two GPUs", [null, 1877.2, 2680.6, 3482.3], [null, 938.6, 893.5, 870.6]],
    ["JetSpec++", [1361.1, 2249.4, 3078.4, 3859.1], [1361.1, 1124.7, 1026.1, 964.8]]
  ];

  window.JSPP_DATA = { SPEED: SPEED, BENCHES: BENCHES, TAU: TAU, BATCH: BATCH };
})();
