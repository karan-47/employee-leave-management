from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy import select
from models.Manager import Manager as ManagerModel
from models.ManagerEmployeeRelation import ManagerEmployeeRelation as ManagerEmployeeRelationModel
from models.Employee import Employee as EmployeeModel
from database import database

router = APIRouter()

class ManagerEmployeeRelationCreate(BaseModel):
    manager_id: int
    employee_id: int

@router.post("/manager_employee_relations", response_model=ManagerEmployeeRelationCreate)
async def create_manager_employee_relation(relation: ManagerEmployeeRelationCreate):

    employee_query = select(EmployeeModel).where(EmployeeModel.id == relation.employee_id)
    employee = await database.fetch_one(employee_query)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if manager_id exists in Manager table
    manager_query = select(ManagerModel).where(ManagerModel.id == relation.manager_id)
    manager = await database.fetch_one(manager_query)
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    query = ManagerEmployeeRelationModel.__table__.insert().values(
        manager_id=relation.manager_id,
        employee_id=relation.employee_id
    )
    try:
        await database.execute(query)
        return relation
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.get("/manager_employee_relations/{employee_id}")
async def get_manager_for_employee(employee_id: int):

    # Check if employee exists
    employee_query = select(EmployeeModel).where(EmployeeModel.id == employee_id)
    employee = await database.fetch_one(employee_query)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    query = ManagerEmployeeRelationModel.__table__.select().where(
        ManagerEmployeeRelationModel.employee_id == employee_id
    )
    result = await database.fetch_one(query)
    if result:
        return result
    raise HTTPException(status_code=404, detail="Manager not found for the employee")
