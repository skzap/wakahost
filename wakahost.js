require('../waka2/waka.js')
var parseDataUri = require('parse-data-uri')
var download = require('./download.js')
var Config = require('./config.json')

Waka.connect(Config.SignalServer)

Wakahost = {
  Router: function() {
    params = window.location.hash.split('#')
    if (params[1]) {
      console.log(params[1])
      Waka.api.Search(params[1])
      Waka.api.Get(params[1], function(e,r){
        if (e) throw e
        Wakahost.Display(r)
      })
    } else {
      window.location.hash = '#' + Config.Homepage
    }
  },
  Display: function(r) {
    try {
      var file = parseDataUri(r.content)
      switch (file.mimeType) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/svg+xml':
        case 'image/gif':
          var html = '<img src="'+r.content+'" alt="'+r.title+'">'
          break;
        case 'video/mp4':
          var html = '<video controls autoplay loop><source type="video/mp4" src="'+r.content+'"></video>'
          break;
        case 'video/webm':
          var html = '<video controls autoplay loop><source type="video/webm" src="'+r.content+'"></video>'
          break;
        case 'audio/mp3':
          var html = '<audio controls src="'+r.content+'" />'
          break;
        default:
          require("downloadjs")(file.data, r.title, file.mimeType);
          //window.open('data:application/octet-stream;base64,'+r.content.split(',')[1])
          return;
      }
      Wakahost.InjectHTML(html)
    } catch(e) {
      if (e != 'TypeError: `uri` does not appear to be a Data URI (must begin with "data:")') console.log(e)
      // if content is not a dataUri
      // display raw text into the window
      // good for raw html
      Wakahost.InjectHTML(r.content)
    }
  },
  InitRouter: function() {
    window.onhashchange = function() {
      Wakahost.Router()
    }
  },
  InjectJavascript: function(code) {
    // todo security
    // unused
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
    if (!file) return
    console.log("Filename: " + file.name);
    console.log("MIME Type: " + file.type);
    console.log("Size: " + file.size + " bytes");
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      var contents = reader.result
      Waka.api.Set(file.name, contents, {}, function(e, r) {
        window.location.hash = '#' + file.name
      })
    }, false)
    if (Wakahost.IsText(file.type)) {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
  },
  IsText: function(mimeType) {
    switch (mimeType) {
      case 'text/css':
      case 'text/csv':
      case 'text/html':
      case 'text/calendar':
      case 'text/plain':
      case 'application/javascript':
      case 'application/json':
      case 'application/xhtml+xml':
        return true
      default:
        return false
    }
  },
  IsImage: function(mimeType) {
    var type = mimeType.split('/')[0]
    switch (type) {
      case 'image':
        return true
      default:
        return false
    }
  }
}

Wakahost.InitRouter()

Waka.api.Emitter.on('connected', listener = function(){
  Wakahost.Router()
})
Waka.api.Emitter.on('newshare', listener = function(r){
  Wakahost.Display(r)
})
