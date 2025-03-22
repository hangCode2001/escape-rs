const jsEscape = require('./js-impl');
const { escapeTextForBrowser: rustEscape } = require('../index');
const fs = require('fs');
const path = require('path');

// 生成更真实的测试数据
function generateRealWorldData() {
  // 模拟 HTML 内容
  const htmlContent = `
    <div class="container">
      <header>
        <h1>欢迎访问我的网站</h1>
        <nav>
          <ul>
            <li><a href="/">首页</a></li>
            <li><a href="/about">关于</a></li>
            <li><a href="/contact">联系我们</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <article>
          <h2>文章标题</h2>
          <p>这是一段包含 <strong>加粗</strong> 和 <em>斜体</em> 的文本。</p>
          <p>这里有一些特殊字符: &amp; &lt; &gt; &quot; &#x27;</p>
          <code>const x = "Hello World";</code>
        </article>
      </main>
    </div>
  `;

  // 模拟用户输入
  const userInputs = [
    "普通文本",
    "包含<script>alert('XSS攻击')</script>的恶意输入",
    "包含 & < > \" ' 特殊字符的输入",
    "用户名: admin",
    "密码: p@ssw0rd!",
    "评论: 这个产品真的很好用！推荐大家购买！<3",
  ];

  // 模拟 JSON 数据
  const jsonData = JSON.stringify({
    name: "产品名称",
    description: "这是一个\"很棒\"的产品，它能解决你的<问题>。",
    price: 99.99,
    features: ["特性1", "特性2", "特性3 & 更多"],
    reviews: [
      { user: "用户1", comment: "很好用！" },
      { user: "用户2", comment: "不错，但有改进空间。" }
    ]
  });

  // 生成大量文本的混合
  const mixedTexts = [];
  for (let i = 0; i < 100; i++) {
    // 随机选择一种类型的文本
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      mixedTexts.push(htmlContent);
    } else if (type === 1) {
      mixedTexts.push(userInputs[Math.floor(Math.random() * userInputs.length)]);
    } else {
      mixedTexts.push(jsonData);
    }
  }

  return {
    htmlContent: [htmlContent],
    userInputs,
    jsonData: [jsonData],
    mixedTexts
  };
}

// 运行基准测试
function runBenchmark() {
  const testData = generateRealWorldData();
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
    const iterations = category === 'mixedTexts' ? 1000 : 10000; // 混合文本测试次数少一些
    
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
console.log("开始真实场景性能测试...");
const results = runBenchmark();

console.log("\n真实场景性能测试结果:");
console.log("=".repeat(80));
console.log("| 测试类别      | 实现 | 耗时 (ms) | 每秒操作数 | 性能比较 |");
console.log("|" + "-".repeat(14) + "|" + "-".repeat(8) + "|" + "-".repeat(12) + "|" + "-".repeat(14) + "|" + "-".repeat(10) + "|");

for (const [category, data] of Object.entries(results)) {
  const jsTime = data.js.time.toFixed(2);
  const rustTime = data.rust.time.toFixed(2);
  const jsOps = Math.round(data.js.ops).toLocaleString();
  const rustOps = Math.round(data.rust.ops).toLocaleString();
  const speedup = (data.js.time / data.rust.time).toFixed(2) + "x";
  
  console.log(`| ${category.padEnd(12)} | JS    | ${jsTime.padStart(10)} | ${jsOps.padStart(12)} | -        |`);
  console.log(`| ${" ".padEnd(12)} | Rust  | ${rustTime.padStart(10)} | ${rustOps.padStart(12)} | ${speedup.padStart(8)} |`);
}

console.log("=".repeat(80));

// 将结果保存到文件
const resultJson = JSON.stringify(results, null, 2);
fs.writeFileSync(path.join(__dirname, 'real-world-benchmark-results.json'), resultJson);
console.log("\n结果已保存到 real-world-benchmark-results.json");

// 生成图表数据
const chartData = {
  categories: Object.keys(results),
  js: Object.values(results).map(data => Math.round(data.js.ops)),
  rust: Object.values(results).map(data => Math.round(data.rust.ops)),
  speedup: Object.values(results).map(data => parseFloat((data.js.time / data.rust.time).toFixed(2)))
};

// 将图表数据保存到文件，可以用于后续生成可视化图表
fs.writeFileSync(path.join(__dirname, 'chart-data.json'), JSON.stringify(chartData, null, 2));
console.log("图表数据已保存到 chart-data.json");