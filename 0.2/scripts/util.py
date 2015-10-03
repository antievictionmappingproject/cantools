def log(msg):
    print msg

def error(msg, *lines):
    log("error: %s"%(msg,))
    for line in lines:
        log(line)
    log("goodbye")
    import sys
    sys.exit()

def read(fname="_tmp", lines=False):
    f = open(fname, "r")
    if lines:
        text = f.readlines()
    else:
        text = f.read()
    f.close()
    return text

def write(text, fname="_tmp"):
    f = open(fname, "w")
    f.write(text)
    f.close()