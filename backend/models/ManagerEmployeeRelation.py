from sqlalchemy import Column, Integer, ForeignKey, CheckConstraint
from database import Base

class ManagerEmployeeRelation(Base):
    __tablename__ = 'manager_employee_relation'

    id = Column(Integer, primary_key=True, index=True)
    manager_id = Column(Integer, ForeignKey('manager.employee_id'), nullable=True)
    employee_id = Column(Integer, ForeignKey('employee.id'), nullable=False, unique=True)

    __table_args__ = (
        CheckConstraint('manager_id != employee_id', name='check_manager_employee_different'),
    )
