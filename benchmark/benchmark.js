const jsEscape = require('./js-impl');
const { escapeTextForBrowser: rustEscape } = require('../index');
const fs = require('fs');
const path = require('path');

// 测试数据生成函数
function generateTestData() {
  return {
    // 不需要转义的情况
    noEscape: [
      "普通文本，没有特殊字符",
      "1234567890",
      "abcdefghijklmnopqrstuvwxyz",
      "这是一段中文文本",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      // 长文本
      "普通文本，没有特殊字符".repeat(100),
    ],
    
    // 需要转义的情况
    needEscape: [
      "<div>HTML 标签</div>",
      "引号 \" 和 ' 需要转义",
      "特殊字符: & < > \" '",
      // 混合内容
      "这是<b>加粗</b>的文本，包含\"引号\"和'单引号'以及&符号",
      // 长文本，包含转义字符
      "这是<b>加粗</b>的文本，包含\"引号\"和'单引号'以及&符号".repeat(50),
    ],
    
    // 边缘情况
    edge: [
      "", // 空字符串
      "<", // 单个需要转义的字符
      "<>", // 只有需要转义的字符
      "<<<<<", // 连续需要转义的字符
      "&quot;&amp;&#x27;&lt;&gt;", // 已经转义的内容
    ],
    
    // 数字和布尔值
    primitives: [
      123,
      0,
      -1,
      true,
      false,
    ]
  };
}

// 运行基准测试
function runBenchmark() {
  const testData = generateTestData();
  const results = {};
  
  // 测试每种情况
  for (const [category, texts] of Object.entries(testData)) {
    results[category] = {
      js: { time: 0, ops: 0 },
      rust: { time: 0, ops: 0 }
    };
    
    // 预热
    for (const text of texts) {
      jsEscape(text);
      rustEscape(text);
    }
    
    // JS 实现测试
    const jsStart = process.hrtime.bigint();
    const iterations = 100000; // 每个文本重复测试的次数
    
    for (let i = 0; i < iterations; i++) {
      for (const text of texts) {
        jsEscape(text);
      }
    }
    
    const jsEnd = process.hrtime.bigint();
    const jsTime = Number(jsEnd - jsStart) / 1e6; // 转换为毫秒
    
    // Rust 实现测试
    const rustStart = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
      for (const text of texts) {
        rustEscape(text);
      }
    }
    
    const rustEnd = process.hrtime.bigint();
    const rustTime = Number(rustEnd - rustStart) / 1e6; // 转换为毫秒
    
    // 计算每秒操作数
    const totalOps = iterations * texts.length;
    const jsOps = totalOps / (jsTime / 1000);
    const rustOps = totalOps / (rustTime / 1000);
    
    results[category].js = { time: jsTime, ops: jsOps };
    results[category].rust = { time: rustTime, ops: rustOps };
  }
  
  return results;
}

// 运行测试并输出结果
console.log("开始性能测试...");
const results = runBenchmark();

console.log("\n性能测试结果:");
console.log("=".repeat(80));
console.log("| 测试类别 | 实现 | 耗时 (ms) | 每秒操作数 | 性能比较 |");
console.log("|" + "-".repeat(10) + "|" + "-".repeat(8) + "|" + "-".repeat(12) + "|" + "-".repeat(14) + "|" + "-".repeat(10) + "|");

for (const [category, data] of Object.entries(results)) {
  const jsTime = data.js.time.toFixed(2);
  const rustTime = data.rust.time.toFixed(2);
  const jsOps = Math.round(data.js.ops).toLocaleString();
  const rustOps = Math.round(data.rust.ops).toLocaleString();
  const speedup = (data.js.time / data.rust.time).toFixed(2) + "x";
  
  console.log(`| ${category.padEnd(8)} | JS    | ${jsTime.padStart(10)} | ${jsOps.padStart(12)} | -        |`);
  console.log(`| ${" ".padEnd(8)} | Rust  | ${rustTime.padStart(10)} | ${rustOps.padStart(12)} | ${speedup.padStart(8)} |`);
}

console.log("=".repeat(80));

// 将结果保存到文件
const resultJson = JSON.stringify(results, null, 2);
fs.writeFileSync(path.join(__dirname, 'benchmark-results.json'), resultJson);
console.log("\n结果已保存到 benchmark-results.json");