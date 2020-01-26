const YTapable = require('../lib/Tapable.js')

const t = new YTapable()

t.plugin('emit', (next) => {
  console.log('emit handler 1');
  setTimeout (() => {
    console.log('emit handler 1 async');
    next('passby emit handler 1')
  }, 3000)
})

t.plugin('emit', (next) => {
  console.log('emit handler 2');
  next('passby emit handler 2')
})

t.plugin('emit', (next) => {
  console.log('emit handler 3');
  next()
})

t.applyPluginsBailResultParallel('emit', (result) => {
  console.log('callback: result',result);
  console.log('callback: 这是 applyPluginsBailResultParallel 的 callback')
})

// emit handler 1
// emit handler 2
// emit handler 3
// emit handler 1 async
// callback: result passby emit handler 1
// callback: 这是 applyPluginsBailResultParallel 的 callback

//虽然 handler 1 的 next 在3秒之后才执行，但是由于注册在 handler2 的前面 所以 callback 的参数还是 handler1 的