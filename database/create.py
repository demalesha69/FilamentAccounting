from database.db.db import engine, Base
from database.models.user import User
from database.models.material import Material
from database.models.consumption import Consumption

Base.metadata.create_all(bind=engine)