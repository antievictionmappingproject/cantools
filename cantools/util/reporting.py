import sys
from datetime import datetime

LOG_FILE = None

def set_log(fname):
	global LOG_FILE
	LOG_FILE = open(fname, "w")

def close_log():
	global LOG_FILE
	if LOG_FILE:
		LOG_FILE.close()
		LOG_FILE = None

def log(msg, level=0, important=False):
    s = "* %s : %s %s"%(datetime.now(), "  " * level, msg)
    if important:
        s = "\n%s"%(s,)
    if LOG_FILE:
    	LOG_FILE.write("%s\n"%(s,))
    print s

def error(msg, *lines):
    log("error: %s"%(msg,), important=True)
    for line in lines:
        log(line, 1)
    log("goodbye")
    sys.exit()