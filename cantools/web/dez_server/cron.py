from rel import timeout
from dez.logging import get_logger_getter
from cantools import config
from cantools.util import read
from ..util import do_respond

secsPerUnit = {
    "hours": 60 * 60,
    "minutes": 60,
    "mins": 60,
    "seconds": 1
}

class Rule(object):
    def __init__(self, controller, url, rule):
        self.logger = logger_getter("Rule(%s -> %s)"%(rule, url))
        self.controller = controller
        self.url = url
        self.rule = rule
        self.words = rule.split(" ")
        self.timer = timeout(None, self.trigger)
        self.parse()

    def trigger(self):
        self.logger.info("trigger: %s %s"%(self.url, self.seconds))
        self.controller.trigger_handler(self.url, self.url[1:])
        return True

    def start(self):
        self.logger.info("start (%s seconds)"%(self.seconds,))
        self.timer.add(self.seconds)

    def parse(self):
        self.logger.info("parse")
        if len(self.words) == 3 and self.words[0] == "every": # every [NUMBER] [UNIT]
            num = int(self.words[1])
            unit = self.words[2]
            self.seconds = num * secsPerUnit[unit]
        else: # we can implement more later...
            self.logger.error("can't parse: %s"%(self.line,))

class Cron(object):
    def __init__(self, controller, logger_getter):
        self.logger = logger_getter("Cron")
        self.controller = controller
        self.timers = {}
        self.parse()
        self.start()

    def parse(self):
        self.logger.info("parse")
        url = None
        for line in read("cron.yaml", True):
            if line.startswith("  url: "):
                url = line[7:].strip()
            elif url:
                self.timers[url] = Rule(self.controller, url, line[12:].strip())
                url = None

    def start(self):
        self.logger.info("start")
        for rule in self.timers.values():
            rule.start()