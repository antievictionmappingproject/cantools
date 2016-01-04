from base64 import b64encode, b64decode
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base, DeclarativeMeta
from properties import *
from query import *

class CTMeta(DeclarativeMeta):
    def query(cls, *args, **kwargs):
        cls.metadata.create_all(engine) # ensure tables exist
        return Query(cls, *args, **kwargs)

    def __new__(cls, name, bases, attrs):
        lname = name.lower()
        attrs["__tablename__"] = lname
        if lname != "modelbase":
            attrs["__mapper_args__"] = {
                "polymorphic_identity": lname
            }
            attrs["key"] = ForeignKey(bases[0], primary_key=True)
        return super(CTMeta, cls).__new__(cls, name, bases, attrs)

class ModelBase(declarative_base()):
    key = Integer(primary_key=True)
    polytype = String()
    __metaclass__ = CTMeta
    __mapper_args__ = {
        "polymorphic_on": polytype,
        "polymorphic_identity": "modelbase",
        "with_polymorphic": "*"
    }

    def __eq__(self, other):
        return self.id() == (other and hasattr(other, "id") and other.id())

    def __ne__(self, other):
        return not self.__eq__(other)

    def put(self):
        for key, val in self.__class__.__dict__.items():
            # is "not self.key" how we check whether table is saved?
            if getattr(val, "is_dt_autostamper", False) and val.should_stamp(not self.key):
                setattr(self, key, datetime.now())
        session.add(self)

    def rm(self):
        session.delete(self)

    def collection(self, entity_model, property_name, fetch=True, keys_only=False, data=False):
        q = entity_model.query(getattr(entity_model, property_name) == self.key)
        if not fetch:
            return q
        if not data:
            return q.fetch(1000, keys_only=keys_only)
        return [d.data() for d in q.fetch(1000)]

    def modeltype(self):
        return self.__tablename__

    def id(self):
        return b64encode(json.dumps({
            "key": self.key,
            "model": self.polytype
        }))