require('../waka3/waka.js')
var Config = require('./config.json')

Waka.connect(Config.SignalServer)

Wakahost = {
  Router: function() {
    params = window.location.hash.split('#')
    if (params[1]) {
      console.log(params[1])
      Waka.api.Get(params[1], function(e,r){
        Wakahost.InjectHTML(r.content)
      })
    } else {
      window.location.hash = '#' + Config.Homepage
    }
  },
  InitRouter: function() {
    window.onhashchange = function() {
      Wakahost.Router()
    }
  },
  InjectJavascript: function(code) {
    // todo security
    eval(code)
  },
  InjectCSS: function(code) {
    var style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = code
    document.getElementsByTagName('head')[0].appendChild(style)
  },
  InjectHTML: function(code) {
    // jquery seems to create shadow dom and not create a real document.head
    //$("html").html(code)

    document.open('text/html')
    document.write(code)
    document.close()
    Wakahost.InitRouter()
  },
  ReadFile: function(e) {
    var file = e.target.files[0]
    if (!file) {
      return
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result
      Waka.api.Set(file.name, contents, {}, function(e, r) {
        Wakahost.DisplayContents(contents)
      })
    };
    reader.readAsText(file);
  },
  DisplayContents: function(contents) {
    var element = document.getElementById('file-content');
    element.innerHTML = contents;
  }
}

Wakahost.InitRouter()

Waka.api.Emitter.on('connected', listener = function(){
  Wakahost.Router()
})
