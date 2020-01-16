const YTapable = require('../lib/Tapable.js')

const t = new YTapable()

//注册插件
t.plugin('emit', (...args) => {
  console.log('emit handler 1', args);
  // return 'emit1'
})
t.plugin('emit', (...args) => {
  console.log('emit handler 2', args);
  return 'emit2'
})
t.plugin('emit', (...args) => {
  console.log('emit handler 3', args);
  return 'emit3'
})

//调用
const result = t.applyPluginsBailResult('emit', '参数1', '参数2', '参数3')

console.log('result',result);