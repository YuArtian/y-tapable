/* Tapable */

function Tapable () {
  this._plugins = {}
}

module.exports = Tapable

/* 对指定的名称注册处理函数 */
Tapable.prototype.plugin = function plugin (name, fn) {
  //允许注册多个 plugin
  if (Array.isArray(name)) {
    name.forEach(function(item){
      this.plugin(item, fn)
    }, this)
  }
  //未注册过 则新建 handlers 数组
  if (!this._plugins[name]) {
    this._plugins[name] = [fn]
  }
  //已注册 加入handler
  else {
    this._plugins[name].push(fn)
  }
}

/* 同步 */
/* 根据 name 依次调用注册的 plugins */
Tapable.prototype.applyPlugins = function applyPlugins (name, ...args) {
  if (!this._plugins[name]) return
  let plugins = this._plugins[name]
  plugins.forEach(plugin => plugin.apply(this, args))
}

/* 依次调用 handler, 其返回值会作为下一个 handler 的第一个参数 */
Tapable.prototype.applyPluginsWaterfall = function applyPluginsWaterfall (name, ...args) {
  if(!this._plugins[name]) return
  const plugins = this._plugins[name]
  let [ current, ...others ] = args
  plugins.forEach(plugin => {
    current = plugin.apply(this, [current, ...others])
  })
  return current
}

/* 依次调用 handler, 直到有 handler 返回不为 undefined 的值, 剩余的 handler 不再执行 */
Tapable.prototype.applyPluginsBailResult = function applyPluginsBailResult (name, ...args) {
  if(!this._plugins[name]) return
  const plugins = this._plugins[name]
  for (let index = 0; index < plugins.length; index++) {
    const result = plugins[index].apply(this, args)
    if (typeof result !== 'undefined') {
      return result
    }
  }
}

/* 异步 */
/* 根据 name 依次调用注册的 plugins 支持异步的版本 */
Tapable.prototype.applyPluginsAsync = function applyPluginsAsync (name, ...args) {
  //默认选最后一个参数 作为错误回调
  const callback = args.pop()
  const plugins = this._plugins[name]
  //没有对应 plugin 直接执行 callback
  if(!plugins || plugins.length === 0) return callback()
  let i = 0
  let _this = this
  // 将 next 函数放入 handler 参数列表的最后一项
  args.push(function next (err) {
    if(err) return callback(err)
    //保证 handler 中 next 调用次序
    i++
    if(i >= plugins.length) {
      return callback()
    }
    plugins[i].apply(_this, args)
  })
  //主动调用第一个 handler
  plugins[0].apply(this, args);
}

/*
  依次调用 handler, 其返回值会作为下一个 handler 的第一个参数 支持异步的版本
  next 固定2个参数 err 和 要传递给下一级的参数 value, 不支持其他参数
  handler 的参数也固定为 value 和 next函数
  callback 的参数固定为 err 和 value
*/
Tapable.prototype.applyPluginsWaterfallAsync = function applyPluginsWaterfallAsync (name, init, callback) {
  if(!this._plugins[name] || this._plugins[name].length === 0) return callback(null, init);
  let plugins = this._plugins[name]
  let i = 0
  let _this = this
  function next (err, value) {
    if(err) return callback(err, value)
    i++
    if(i >= plugins.length) {
      return callback(err, value)
    }
    plugins[i].call(_this, value, next)
  }
  plugins[0].call(this, init, next)
}
/*
  依次调用 handler, 调用 next 执行下一个 handler, next 函数如果传参则直接执行 callback
*/
Tapable.prototype.applyPluginsBailResultAsync = function applyPluginsBailResultAsync (name, ...args) {
  let plugins = this._plugins[name]
  let callback = args.pop()
  if(!plugins || plugins.length === 0) return callback(...args)
  let i = 0
  let _this = this
  args.push(function next () {
    // next 传入参数则执行 callback
    if(arguments.length > 0) return callback.apply(null, arguments)
    i++
    if(i >= plugins.length) {
      return callback()
    }
    plugins[i].apply(_this, args)
  })
  plugins[0].apply(this, args)
}

/* 并行 */
/* 并行调用 handler, 维护 remaining 变量, 必须调用 next 函数告知回调结束, 否则永远不会执行 callback */
Tapable.prototype.applyPluginsParallel = function applyPluginsParallel (name, ...args) {
  let plugins = this._plugins[name]
  let callback = args.pop()
  if(!plugins || plugins.length === 0) return callback();
  let remaining = plugins.length
  //注入 check 函数
  args.push(function next (err) {
    if(remaining < 0) return
    if (err) {
      remaining = -1
      return callback(err)
    }
    remaining--
    console.log('remaining',remaining);
    if (remaining === 0) {
      return callback()
    }
  })
  // 并行调用 handler
  for(let i = 0; i < plugins.length; i++) {
    plugins[i].apply(this, args)
    if (remaining < 0) return
  }
}

/*
  并行调用 handler, next 函数有参数则直接调用 callback, callback 的执行与 handler 的注册顺序相关
  与 next 的执行时机无关
*/
Tapable.prototype.applyPluginsBailResultParallel = function applyPluginsBailResultParallel (name, ...args) {
  let plugins = this._plugins[name]
  let callback = args[args.length - 1]
  if(!plugins || plugins.length === 0) return callback()
  let currentPos = plugins.length
  let currentResult //当前 handler 的结果 也就是传递给 next 函数的参数
  let done = [] //运行过的 handler 的 id 合集
  //并行执行所有 handler
  for(let i = 0; i < plugins.length; i++){
    //匿名函数 闭包记住 handler 执行顺序
    args[args.length - 1] = (function(i){
      //next 函数作为最后的参数
      return function next (...err) {
        if(i >= currentPos) return //边界处理
        done.push(i) // 执行 next 函数，认为 handler 执行完毕，将其放入 done 数组中，标识以执行完
        //如果 next 有参数则停止并执行 callback
        if(err.length > 0) {
          //当前执行的 handler 的位置
          currentPos = i + 1
          //筛选出执行过 next 的 handler，包括当前的 handler
          done = done.filter(function (item) {
            return item <= i
          })
          //保存当前 handler 结果，next 的参数
          currentResult = err
        }
        //以下两种情况都会进入执行 callback 的逻辑
        //发生错误时（有 currentPos = i + 1）
        //或者全部执行完毕（currentPos = plugins.length）, 因为规定执行 next 才会向下执行，所以全部执行完毕时 handler 的个数应该和 next 的执行次数相等
        if (currentPos === done.length ) {
          callback.apply(null, currentResult)
          //currentPos 归零
          currentPos = 0
        }
      }
    })(i)
    //并行执行所有 handler
    plugins[i].apply(this, args)
  }
}
