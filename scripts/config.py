PUBSUB_PORT = 8099
PUBSUB_HIST = 10
PARSE_ERROR_SEGMENT_LENGTH = 100
DYNAMIC_DIR = "../html"
BUILD_DIRS = {
	"static": "../html-static",
	"production": "../html-production"
}
JSPATH = ""
JSFLAG = '<script src="/'
JSOFFSET = len('<script src="')
JSENDOFFSET = len('"></script>')
NOSCRIPT = """
<noscript>
 <div style="position: absolute; left:0px; top:0px;">
  This site requires Javascript to function properly. To enable Javascript in your browser, please follow <a href="http://www.google.com/support/bin/answer.py?answer=23852">these instructions</a>. Thank you, and have a nice day.
 </div>
</noscript>
"""
YPATH = "../app.yaml"
YSTART = "# START mode: "
YEND = "# END mode: "
CT_PY_PATH = "../cantools.py"
ENC_TOGGLE = "ENCODE = %s"
MODE_SWAP = 'MODE = "%s"'