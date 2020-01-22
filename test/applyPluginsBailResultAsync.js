const YTapable = require('../lib/Tapable.js')

const t = new YTapable()

t.plugin('emit', (value, next) => {
  console.log('emit handler 1');
  setTimeout (() => {
    console.log('emit handler 1 async');
    next()
  }, 3000)
})

t.plugin('emit', (value, next) => {
  console.log('emit handler 2');
  next('passby emit handler 2')
})

t.plugin('emit', (value, next) => {
  console.log('emit handler 3');
  next()
})

t.applyPluginsBailResultAsync('emit', '参数1', (err, value) => {
  console.log('callback: err',err);
  console.log('callback: value',value);
  console.log('callback: 这是 applyPluginsBailResultAsync 的 callback')
})

// emit handler 1
// emit handler 1 async
// emit handler 2
// callback: err null
// callback: value passby emit handler 2
// callback: 这是 applyPluginsWaterfallAsync 的 callback