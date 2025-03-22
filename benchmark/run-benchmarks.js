const { execSync } = require('child_process');
const path = require('path');

console.log('开始运行基准测试...\n');

try {
  console.log('1. 运行基本基准测试');
  execSync('node benchmark.js', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n2. 运行真实场景基准测试');
  execSync('node real-world-benchmark.js', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n所有基准测试完成！');
} catch (error) {
  console.error('基准测试运行失败:', error);
}