import sys
import os
import time


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.orm import sessionmaker
from main import app  # Ensure your FastAPI app is imported correctly
from models.Employee import Employee as EmployeeModel
from models.Manager import Manager as ManagerModel
from sqlalchemy.orm import sessionmaker, declarative_base
from models.ManagerEmployeeRelation import ManagerEmployeeRelation as ManagerEmployeeRelationModel
from database import Base  # Assuming your Base is declared in database.py

def table_exists(engine, table_name):
    inspector = inspect(engine)
    return inspector.has_table(table_name)

client = TestClient(app)

# Create a test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"  # Using SQLite for simplicity

# Create an engine and session for the test database
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
@pytest.fixture(scope="module", autouse=True)
def setup_and_teardown():
    print("1")
    # Setup: Create the test database tables
    # Base.metadata.create_all(bind=engine)
    from models.Employee import Employee

    if not table_exists(engine, 'employee'):
        Base.metadata.create_all(engine, tables=[Employee.__table__])
        time.sleep(0.01)
    db = TestingSessionLocal()
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
        print("close insert")
        db.close()

    from models.Manager import Manager
    
    if not table_exists(engine, 'manager'):
        Base.metadata.create_all(engine, tables=[Manager.__table__])
        time.sleep(0.01)
    db = TestingSessionLocal()
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
        print("close insert")
        db.close()
    
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
    print("2")
    yield
    print(3)
    # Teardown: Drop all tables
    print("close drop")
    Base.metadata.drop_all(bind=engine)

# Override the get_db dependency to use the test database
def override_get_db():
    try:
        print(4)
        db = TestingSessionLocal()
        print(5)
        yield db
        print(6)
    finally:
        print("close6")
        db.close()
print("7 hua")
import database
app.dependency_overrides[database.get_db] = override_get_db

# Test creating an employee
def test_create_employee():
    response = client.post(
        "/employees",
        json={"name": "John Doe", "age": 30, "contact_details": "john.doe@example.com", "holidays_left": 10, "manager_id": 1},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "John Doe"
    assert response.json()["age"] == 30
    assert response.json()["contact_details"] == "john.doe@example.com"
    assert response.json()["holidays_left"] == 10


def test_create_employee_no_manager_exisiting():
    # Case manager not found
    response = client.post(
        "/employees",
        json={"name": "John Snow", "age": 30, "contact_details": "john.snow@example.com", "holidays_left": 12, "manager_id": 5},
    )
    assert response.status_code == 404

def test_create_employee_outofbounds_days():
    # days left should be between 0 and 30
    response = client.post(
        "/employees",
        json={"name": "Jon Snow", "age": "3", "contact_details": "jon.snow@example.com", "holidays_left": -32, "manager_id": 1},
    )
    assert response.status_code == 500

def test_create_employee_invalid_parameter():
    #Case wrong input
    response = client.post(
        "/employees",
        json={"name": "Jon Snow", "age": "3a", "contact_details": "jon.snow@example.com", "holidays_left": 3, "manager_id": 1},
    )
    assert response.status_code == 422

    
    



# Test getting all employees
def test_get_employees():
    response = client.get("/employees")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting a specific employee
def test_get_employee_not_present():
    response = client.get("/employees/5")
    if response.status_code == 200:
        assert response.json()["id"] == 1
    elif response.status_code == 404:
        assert response.json()["detail"] == "Employee not found"
    
    
# Case employee present
def test_get_employee():
    response = client.get("/employees/1")
    if response.status_code == 200:
        assert response.json()["id"] == 1
    elif response.status_code == 404:
        assert response.json()["detail"] == "Employee not found"

def test_create_manager():
    response = client.post(
        "/managers",
        json={"employee_id": 2},
    )
    assert response.status_code == 200
    assert response.json()["employee_id"] == 2




'''MANAGER TEST CASES'''

def test_create_manager():
    response = client.post(
        "/managers",
        json={"employee_id": 2},
    )
    assert response.status_code == 200
    assert response.json()["employee_id"] == 2


    # # Case employee not found 
def test_create_manager_no_employee_exisiting():
    response = client.post(
        "/managers",
        json={"employee_id": 25},
    )
    assert response.status_code == 404

    # Case wrong input
def test_create_manager_invalid_parameter():
    response = client.post(
        "/managers",
        json={"employee_id": "a2"},
    )
    assert response.status_code == 422

def test_get_managers():
    response = client.get("/managers")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_manager_not_present():
    response = client.get("/managers/1")
    if response.status_code == 200:
        assert response.json()["employee_id"] == 1
    elif response.status_code == 404:
        assert response.json()["detail"] == "Manager not found"

    # Case manager present
def test_get_manager_present():
    response = client.get("/managers/10")
    if response.status_code == 200:
        assert response.json()["employee_id"] == 1
    elif response.status_code == 404:
        assert response.json()["detail"] == "Manager not found"

def test_get_employees_by_manager():
    response = client.get("/manager/1/employees")
    assert response.status_code == 200
    assert isinstance(response.json()[0]["id"],int )

def test_get_employees_by_manager_not_present():
    response = client.get("/manager/10/employees")
    assert response.status_code == 404

def test_get_employees_by_manager_invalid_parameter():
    response = client.get("/manager/1a/employees")
    assert response.status_code == 422





'''TEST MANAGER EMPLOYEE RELATION'''

"""
def test_relation_creation():
    
    Tested while creating employee
    response = client.post(
        "/manager_employee_relations",
        json={"manager_id": 1, "employee_id": 2},
    )
    assert response.status_code == 200
    assert response.json()["manager_id"] == 1
    assert response.json()["employee_id"] == 2"""

    # Case manager not found
def test_relation_creation_manager_not_found():
    response = client.post(
        "/manager_employee_relations",
        json={"manager_id": 10, "employee_id": 2},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Manager not found"

    # Case employee not found

def test_relation_creation_employee_not_found():
    response = client.post(
        "/manager_employee_relations",
        json={"manager_id": 1, "employee_id": 10},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"

    # Case wrong input
def test_relation_creation_invalid_parameter():
    response = client.post(
        "/manager_employee_relations",
        json={"manager_id": "a", "employee_id": 2},
    )
    assert response.status_code == 422

    # Case wrong input
def test_relation_creation_invalid_parameter():
    response = client.post(
        "/manager_employee_relations",
        json={"manager_id": 1, "employee_id": "b"},
    )
    assert response.status_code == 422

def test_get_manager_for_employee():
    response = client.get("/manager_employee_relations/2")
    assert response.status_code == 200
    assert response.json()["employee_id"] == 2

def test_get_manager_for_employee_not_present():
    response = client.get("/manager_employee_relations/10")
    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"

def test_get_manager_for_employee_invalid_parameter():
    response = client.get("/manager_employee_relations/1")
    assert response.status_code == 404
    assert response.json()["detail"] == "Manager not found for the employee"

'''

REQUESTS

'''

def test_create_request_valid():
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "PENDING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-10T00:00:00",
        "vacation_end_date": "2024-11-14T00:00:00"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "PENDING"

def test_create_request_start_date_greater_than_end_date():
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "PENDING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-15T00:00:00",
        "vacation_end_date": "2024-11-10T00:00:00"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Vacation start date cannot be later than vacation end date."

def test_create_request_overlapping_pending_request():
    # client.post("/requests", json={
    #     "author_id": 2,
    #     "status": "PENDING",
    #     "manager_id": 1,
    #     "vacation_start_date": "2024-11-10T00:00:00",
    #     "vacation_end_date": "2024-11-14T00:00:00"
    # })
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "PENDING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-12T00:00:00",
        "vacation_end_date": "2024-11-16T00:00:00"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "There is an overlapping pending leave request for this employee."



def test_create_request_APPROVED_OR_DENIED_status():
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "APPROVED",
        "manager_id": 1,
        "vacation_start_date": "2024-11-10T00:00:00",
        "vacation_end_date": "2024-11-14T00:00:00"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Request status must be PENDING"


def test_create_request_NOT_PENDING_OR_APPROVED_OR_DENIED_status():
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "ANYTHING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-10T00:00:00",
        "vacation_end_date": "2024-11-14T00:00:00"
    })
    assert response.status_code == 422


def test_create_request_exceeds_holidays_left():
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "PENDING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-15T00:00:00",
        "vacation_end_date": "2024-11-30T00:00:00"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Number of weekdays requested exceeds the number of holidays left"


def test_create_request_employee_not_found():
    response = client.post("/requests", json={
        "author_id": 999,
        "status": "PENDING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-10T00:00:00",
        "vacation_end_date": "2024-11-14T00:00:00"
    })
    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"

def test_create_request_manager_not_found():
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "PENDING",
        "manager_id": 999,
        "vacation_start_date": "2024-11-10T00:00:00",
        "vacation_end_date": "2024-11-14T00:00:00"
    })
    assert response.status_code == 404
    assert response.json()["detail"] == "Manager not found"

def test_create_request_manager_not_manager_of_employee():
    response = client.post("/requests", json={
        "author_id": 1,
        "status": "PENDING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-10T00:00:00",
        "vacation_end_date": "2024-11-14T00:00:00"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "The manager is not the manager of the employee."


def test_get_requests():
    response = client.get("/requests")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_request():
    response = client.get("/requests/1")
    if response.status_code == 200:
        assert response.json()["id"] == 1
    elif response.status_code == 404:
        assert response.json()["detail"] == "Request not found"
    # Case request present
    response = client.get("/requests/2")
    if response.status_code == 200:
        assert response.json()["id"] == 2
    elif response.status_code == 404:
        assert response.json()["detail"] == "Request not found"


def test_get_requests_by_employee():
    response = client.get("/requests/employee/2")
    assert response.status_code == 200
    assert isinstance(response.json()[0]["id"],int )

    response = client.get("/requests/employee/10")
    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"

    response = client.get("/requests/employee/1a")
    assert response.status_code == 422

def test_update_request_status():
    response = client.put("/requests/1", json={
        "status": "APPROVED"
    })
    assert response.status_code == 200

def test_update_request_status_invalid():
    response = client.put("/requests/1", json={
        "status": "INVALID"
    })
    assert response.status_code == 422

def test_update_request_status_invalid_request():
    response = client.put("/requests/100", json={
        "status": "APPROVED"
    })
    assert response.status_code == 404

def test_update_approved_request():
    response = client.put("/requests/1", json={
        "status": "APPROVED"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Approved requests cannot be updated"

def test_delete_request_invalid():
    response = client.delete("/requests/100")
    assert response.status_code == 404

def test_delete_approved_request():
    response = client.delete("/requests/1")
    assert response.status_code == 200
    assert response.json()["message"] == "Request deleted successfully"

def test_create_request():
    response = client.post("/requests", json={
        "author_id": 2,
        "status": "PENDING",
        "manager_id": 1,
        "vacation_start_date": "2024-11-10T00:00:00",
        "vacation_end_date": "2024-11-14T00:00:00"
    })
    assert response.status_code == 200

def test_delete_request():
    response = client.delete("/requests/1")
    assert response.status_code == 200

def test_invalid_manager_access_to_date_reequests():
    response = client.get("/manager/5/employee-status-details/2024-11-10T00:00:00")
    assert response.status_code == 404
    assert response.json()["detail"] == "Manager not found"

def test_valid_manager_access_to_date_reequests():
    response = client.get("/manager/1/employee-status-details/2024-11-10T00:00:00")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)