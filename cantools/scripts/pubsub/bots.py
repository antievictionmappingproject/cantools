import json
from cantools import config
from cantools.util import log

class BotMeta(type):
	def __new__(cls, name, bases, attrs):
		bc = type.__new__(cls, name, bases, attrs)
		if name is not "Bot":
			log("Initializing Bot Class: %s"%(name,), important=True)
			config.pubsub.bots.update(name.lower(), bc)
		return bc

class Bot(object):
	num = 0
	__metaclass__ = BotMeta
	def __init__(self, server, channel, name=None):
		Bot.num += 1
		self.name = name or (self.__class__.__name__ + str(Bot.num))
		self.server = server
		self.channels = set()
		log("Bot Spawned: '%s'"%(self.name,), 2)
		channel.join(self)
		self.server.bots[self.name] = self

	def join(self, channel):
		log("Bot '%s' Joined '%s'"%(self.name, channel.name), 2)
		self.channels.add(channel)

	def leave(self, channel):
		if channel in self.channels:
			log("Bot '%s' Left '%s'"%(self.name, channel.name), 2)
			self.channels.remove(channel)

	def write(self, obj): # receive message from channel
		log('Bot %s handling: "%s"'%(self.name, json.dumps(obj)), 3)
		getattr(self, "on_%s"%(obj["action"],))(obj["data"])

	def _default_handler(self, data): pass
	on_channel = _default_handler
	on_publish = _default_handler
	on_subscribe = _default_handler
	on_unsubscribe = _default_handler
	on_pm = _default_handler