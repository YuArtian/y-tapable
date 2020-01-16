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

