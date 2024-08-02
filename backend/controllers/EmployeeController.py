from fastapi import APIRouter, HTTPException
from typing import List
from models.Employee import Employee as EmployeeModel
from models.ManagerEmployeeRelation import ManagerEmployeeRelation as ManagerEmployeeRelationModel
from models.Manager import Manager as ManagerModel
from database import database
from pydantic import BaseModel
router = APIRouter()

class EmployeeCreate(BaseModel):
    name: str
    age: int
    contact_details: str
    holidays_left: int
    manager_id: int

class EmployeeResponse(BaseModel):
    id: int
    name: str
    age: int
    contact_details: str
    holidays_left: int

# Create an employee
@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeCreate):
    # Check if the manager exists
    manager_query = ManagerModel.__table__.select().where(ManagerModel.employee_id == employee.manager_id)
    manager = await database.fetch_one(manager_query)
    if manager is None:
        raise HTTPException(status_code=404, detail="Manager not found")

    if employee.holidays_left < 0 or employee.holidays_left > 30:
        raise HTTPException(status_code=500, detail="Holidays left should be between 0 and 30")

    # Create the employee
    employee_query = EmployeeModel.__table__.insert().values(
        name=employee.name,
        age=employee.age,
        contact_details=employee.contact_details,
        holidays_left=employee.holidays_left
    )
    last_record_id = await database.execute(employee_query)

    # Create the manager-employee relation
    relation_query = ManagerEmployeeRelationModel.__table__.insert().values(
        manager_id=employee.manager_id,
        employee_id=last_record_id
    )
    await database.execute(relation_query)

    return {**employee.dict(), "id": last_record_id, "manager_id": employee.manager_id}

# Get all employees
@router.get("/employees", response_model=List[EmployeeResponse])
async def get_employees():
    query = EmployeeModel.__table__.select()
    return await database.fetch_all(query)

# Get a specific employee
@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int):
    query = EmployeeModel.__table__.select().where(EmployeeModel.id == employee_id)
    employee = await database.fetch_one(query)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

# Update an employee
@router.put("/employees/{employee_id}", response_model=EmployeeCreate)
async def update_employee(employee_id: int, employee: EmployeeCreate):
    query = EmployeeModel.__table__.update().where(EmployeeModel.id == employee_id).values(
        name=employee.name,
        age=employee.age,
        contact_details=employee.contact_details,
        holidays_left=employee.holidays_left,
    )
    await database.execute(query)
    return {"message": "Employee updated successfully"}

# Delete an employee
@router.delete("/employees/{employee_id}", response_model=dict)
async def delete_employee(employee_id: int):
    query = EmployeeModel.__table__.delete().where(EmployeeModel.id == employee_id)
    await database.execute(query)
    return {"message": "Employee deleted successfully"}
