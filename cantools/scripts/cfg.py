cfg = {
	"pubsub": {
		"port": 8888,
		"history": 10
	},
	"parse_error_segment_length": 100,
	"build": {
		"dynamic_dir": "html",
		"compiled_dirs": {
			"static": "html-static",
			"production": "html-production"
		}
	},
	"js": {
		"path": "js",
		"flag": '<script src="/',
		"offset": len('<script src="'),
		"endoffset": len('"></script>')
	},
	"yaml": {
		"path": "app.yaml",
		"start": "# START mode: ",
		"end": "# END mode: "
	},
	"py": {
		"path": "ctcfg.py",
		"enc": "ENCODE = %s",
		"mode": 'MODE = "%s"'
	},
	"noscript": """
		<noscript>
		 <div style="position: absolute; left:0px; top:0px;">
		  This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.
		 </div>
		</noscript>
	""",
	"init": {
		"yaml": """application: %s
version: 1
runtime: python27
api_version: 1
threadsafe: false

handlers:
- url: /remote_api
  script: $PYTHON_LIB/google/appengine/ext/remote_api/handler.py
  login: admin

## MODE SWITCHING -- DON'T MESS WITH (unless you know what you're doing)!
# START mode: dynamic
- url: /javascript
  static_dir: javascript
- url: /.*\.(html|css)
  static_dir: html
# END mode: dynamic
# START mode: static
#- url: /javascript
#  static_dir: javascript
#- url: /.*\.(html|css)
#  static_dir: html-static
# END mode: static
# START mode: production
#- url: /.*\.(html|css)
#  static_dir: html-production
# END mode: production""",
		"html": """<!doctype html>
<html>
  <head>
    <title>%s</title>
    <link rel="stylesheet" href="ct.css">
    <script src="CT/ct.js"></script>
  </head>
  <body>
  </body>
</html>""",
		"ctcfg": 'ENCODE = False\nMODE = "dynamic"'
	}
}