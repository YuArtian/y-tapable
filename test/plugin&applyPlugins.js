const YTapable = require('../lib/Tapable.js')

const t = new YTapable()

//注册插件
t.plugin('emit', (...args) => {
  console.log('emit handler 1', args);
})
t.plugin('emit', (...args) => {
  console.log('emit handler 2', args);
})
t.plugin('emit', (...args) => {
  console.log('emit handler 3', args);
})
//调用
t.applyPlugins('emit', '参数1', '参数2', '参数3')
