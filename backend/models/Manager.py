from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from database import Base

class Manager(Base):
    __tablename__ = 'manager'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employee.id'), unique=True)

    __table_args__ = (
        UniqueConstraint('employee_id', name='uq_manager_employee_id'),
    )
