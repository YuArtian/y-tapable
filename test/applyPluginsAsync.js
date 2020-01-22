const YTapable = require('../lib/Tapable.js')

const t = new YTapable()

t.plugin('emit', (...args) => {
  // handler 的最后一个参数一定是 next 函数
  const next = args.pop()
  console.log('emit handler 1');
  setTimeout (() => {
    console.log('emit handler 1 async');
    // 执行 next，函数才会执行到下面的 handler
    next()
  }, 3000)
})

t.plugin('emit', (...args) => {
  // handler 的最后一个参数一定是 next
  const next = args.pop()
  console.log('emit handler 2');
  // 执行 next，函数才会执行到 applyPluginsAsync 传入的 callback
  Promise.resolve(1).then(next)
})

t.applyPluginsAsync('emit', '参数1', (...args) => {
  console.log('这是 applyPluginsAsync 的 callback')
})

// emit handler 1
// emit handler 1 async
// emit handler 2
// 这是 applyPluginsAsync 的 callback
