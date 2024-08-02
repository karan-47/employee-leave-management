from sqlalchemy import Column, Integer, String, UniqueConstraint, CheckConstraint
from database import Base

class Employee(Base):
    __tablename__ = 'employee'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    age = Column(Integer)
    contact_details = Column(String(100))
    holidays_left = Column(Integer, CheckConstraint('holidays_left >= 0 AND holidays_left <= 30'))

    __table_args__ = (
        UniqueConstraint('name', name='uq_employee_name'),
    )
