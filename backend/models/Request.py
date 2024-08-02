import datetime
from sqlalchemy import Column, DateTime, Integer, ForeignKey, String, CheckConstraint
from database import Base

class Request(Base):
    __tablename__ = 'request'

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey('employee.id'))
    status = Column(String(50))
    manager_id = Column(Integer, ForeignKey('employee.id'))
    request_created_date = Column(DateTime, default=datetime.datetime.utcnow)
    vacation_start_date = Column(DateTime)
    vacation_end_date = Column(DateTime)
    status = Column(String(50))

    __table_args__ = (
        CheckConstraint('author_id != manager_id', name='check_author_manager_different'),
        CheckConstraint('vacation_end_date >= vacation_start_date', name='check_end_date_after_start_date'),
    )
