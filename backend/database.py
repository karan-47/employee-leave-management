import time
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.orm import sessionmaker, declarative_base
from databases import Database
from config import DATABASE_URL, TEST_DATABASE_URL, TESTING

DATABASE_URL = DATABASE_URL if not TESTING else TEST_DATABASE_URL

database = Database(DATABASE_URL)
metadata = MetaData()

Base = declarative_base()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def table_exists(engine, table_name):
    inspector = inspect(engine)
    return inspector.has_table(table_name)

def create_db_and_tables():
    from models.Employee import Employee
     

    if not table_exists(engine, 'employee'):
        Base.metadata.create_all(engine, tables=[Employee.__table__])
        time.sleep(0.01)
        insert_initial_employee_data()

    from models.Manager import Manager
    
    if not table_exists(engine, 'manager'):
        Base.metadata.create_all(engine, tables=[Manager.__table__])
        time.sleep(0.01)
        insert_initial_manager_data()

    from models.ManagerEmployeeRelation import ManagerEmployeeRelation
   
    if not table_exists(engine, 'manager_employee_relation'):
        Base.metadata.create_all(engine, tables=[ManagerEmployeeRelation.__table__])
        time.sleep(0.01)

    from models.Request import Request
    if not table_exists(engine, 'request'):
        Base.metadata.create_all(engine, tables=[Request.__table__])
        time.sleep(0.01)
        from models.RequestConstraints import RequestConstraint
        Base.metadata.create_all(engine, tables=[RequestConstraint.__table__])


def insert_initial_employee_data():
    from models.Employee import Employee

    db = SessionLocal()
    try:
        # Insert data into Employee table
        if not db.query(Employee).filter_by(name="Karan").first():
            employee = Employee(name="Karan", age=23, contact_details="9842867161", holidays_left=30)
            db.add(employee)
            db.commit()
            time.sleep(0.01)
    except Exception as e:
        db.rollback()
        print(f"Error inserting initial data: {e}")
    finally:
        db.close()

def insert_initial_manager_data():
    from models.Manager import Manager

    db = SessionLocal()
    try:
        # Insert data into Manager table
        if not db.query(Manager).filter_by(employee_id=1).first():
            manager = Manager(employee_id=1)  # Using employee_id as reference
            db.add(manager)
            db.commit()
            time.sleep(0.01)
    except Exception as e:
        db.rollback()
        print(f"Error inserting initial data: {e}")
    finally:
        db.close()
