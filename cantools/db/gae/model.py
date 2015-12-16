from properties import *

class ModelBase(db.Model):
    def __eq__(self, other):
        return self.id() == (other and hasattr(other, "id") and other.id())

    def __ne__(self, other):
        return not self.__eq__(other)

    def __hash__(self):
        return 0 # ensures proper set-uniquification

    def rm(self):
        self.key.delete()

    def collection(self, entity_model, property_name, fetch=True, keys_only=False, data=False):
        q = entity_model.query(db.GenericProperty(property_name) == self.key)
        if not fetch:
            return q
        if not data:
            return q.fetch(1000, keys_only=keys_only)
        return [d.data() for d in q.fetch(1000)]

    def modeltype(self):
        return self.__class__.__name__.lower()

    def id(self):
        return self.key.urlsafe()