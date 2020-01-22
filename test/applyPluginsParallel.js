const YTapable = require('../lib/Tapable.js')

const t = new YTapable()

t.plugin('emit', (...args) => {
  // handler 的最后一个参数一定是 next 函数
  const next = args.pop()
  console.log('emit handler 1');
  setTimeout (() => {
    console.log('emit handler 1 async');
    next()
  }, 3000)
})

t.plugin('emit', (...args) => {
  // handler 的最后一个参数一定是 next
  const next = args.pop()
  console.log('emit handler 2');
  next()
})
t.plugin('emit', (...args) => {
  // handler 的最后一个参数一定是 next
  const next = args.pop()
  console.log('emit handler 3');
  Promise.resolve(1).then(res => {
    console.log('res',res);
    next()
  })
})

t.applyPluginsParallel('emit', '参数1', (...args) => {
  console.log('这是 applyPluginsParallel 的 callback')
})

// emit handler 1
// emit handler 2
// remaining 2
// emit handler 3
// res 1
// remaining 1
// emit handler 1 async
// remaining 0
// 这是 applyPluginsParallel 的 callback