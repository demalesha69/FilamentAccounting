from database.db.db import engine, Base
from database.models import *

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)