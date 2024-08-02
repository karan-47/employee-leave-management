from typing import List
from fastapi import APIRouter, HTTPException
from models.Manager import Manager as ManagerModel
from models.ManagerEmployeeRelation import ManagerEmployeeRelation as ManagerEmployeeRelationModel
from models.Employee import Employee as EmployeeModel
from models.Request import Request as RequestModel
from database import database
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ManagerCreate(BaseModel):
    employee_id: int

class RequestResponse(BaseModel):
    id: int
    author_id: int
    status: str
    manager_id: int
    request_created_date: datetime
    vacation_start_date: datetime
    vacation_end_date: datetime

class EmployeeWithRequests(BaseModel):
    id: int
    name: str
    age: int
    contact_details: str
    holidays_left: int
    requests: List[RequestResponse] = []

@router.post("/managers", response_model=ManagerCreate)
async def create_manager(manager: ManagerCreate):

    # Check if employee exists
    employee_query = EmployeeModel.__table__.select().where(EmployeeModel.id == manager.employee_id)
    employee = await database.fetch_one(employee_query)
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    query = ManagerModel.__table__.insert().values(
        employee_id=manager.employee_id
    )
    try:
        await database.execute(query)
        return manager
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/managers", response_model=List[ManagerCreate])
async def get_managers():
    query = ManagerModel.__table__.select()
    return await database.fetch_all(query)

@router.get("/managers/{manager_id}", response_model=ManagerCreate)
async def get_manager(manager_id: int):
    query = ManagerModel.__table__.select().where(ManagerModel.id == manager_id)
    manager = await database.fetch_one(query)
    if manager is None:
        raise HTTPException(status_code=404, detail="Manager not found")
    return manager

@router.put("/managers/{manager_id}", response_model=ManagerCreate)
async def update_manager(manager_id: int, manager: ManagerCreate):
    query = ManagerModel.__table__.update().where(ManagerModel.id == manager_id).values(
        employee_id=manager.employee_id
    )
    await database.execute(query)
    return {"message": "Manager updated successfully"}

@router.delete("/managers/{manager_id}", response_model=dict)
async def delete_manager(manager_id: int):
    query = ManagerModel.__table__.delete().where(ManagerModel.id == manager_id)
    await database.execute(query)
    return {"message": "Manager deleted successfully"}

@router.get("/manager/{manager_id}/employees", response_model=List[EmployeeWithRequests])
async def get_employees_by_manager(manager_id: int):

    # Check if the manager exists
    manager_query = ManagerModel.__table__.select().where(ManagerModel.id == manager_id)
    manager = await database.fetch_one(manager_query)
    
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    relation_query = ManagerEmployeeRelationModel.__table__.select().where(ManagerEmployeeRelationModel.manager_id == manager_id)
    employee_relations = await database.fetch_all(relation_query)
    employee_ids = [relation.employee_id for relation in employee_relations]

    if not employee_ids:
        return []
    # Fetching employees working for manager with given id and their requests 
    employees = []
    for employee_id in employee_ids:
        employee_query = EmployeeModel.__table__.select().where(EmployeeModel.id == employee_id)
        employee = await database.fetch_one(employee_query)

        if employee:
            request_query = RequestModel.__table__.select().where(RequestModel.author_id == employee_id)
            requests = await database.fetch_all(request_query)
            employee_dict = dict(employee)
            employee_dict['requests'] = requests
            employees.append(employee_dict)
    
    return employees
