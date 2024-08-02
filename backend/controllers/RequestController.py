from fastapi import APIRouter, HTTPException
from typing import List, Dict
from models.Request import Request as RequestModel
from models.Employee import Employee as EmployeeModel
from models.ManagerEmployeeRelation import ManagerEmployeeRelation as ManagerEmployeeRelationModel
from database import database
from pydantic import BaseModel, validator, constr
from datetime import datetime, timedelta

router = APIRouter()

class RequestCreate(BaseModel):
    author_id: int
    status: constr(min_length=1, max_length=50, pattern='^(PENDING|APPROVED|DENIED)$') = 'PENDING' # type: ignore
    manager_id: int
    request_created_date: datetime = None
    vacation_start_date: datetime
    vacation_end_date: datetime

    @validator('vacation_start_date', 'vacation_end_date')
    def check_dates_in_november_2024(cls, v):
        if v.month != 11 or v.year != 2024:
            raise ValueError('Dates must be in November 2024')
        return v

    @validator('author_id')
    def check_author_manager_different(cls, v, values):
        if 'manager_id' in values and v == values['manager_id']:
            raise ValueError('author_id and manager_id must be different')
        return v

class RequestResponse(BaseModel):
    id: int
    author_id: int
    status: str
    manager_id: int
    request_created_date: datetime
    vacation_start_date: datetime
    vacation_end_date: datetime

class RequestUpdate(BaseModel):
    status: constr(min_length=1, max_length=50, pattern='^(PENDING|APPROVED|DENIED)$') = 'PENDING' # type: ignore
    manager_id: int = None
    vacation_start_date: datetime = None
    vacation_end_date: datetime = None

class EmployeeStatusDetails(BaseModel):
    working: List[Dict]
    on_leave: List[Dict]
    pending: List[Dict]
    working_count: int
    on_leave_count: int
    pending_count: int

def count_weekdays(start_date: datetime, end_date: datetime) -> int:
    count = 0
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5:  # Monday to Friday are 0-4
            count += 1
        current_date += timedelta(days=1)
    return count

@router.post("/requests", response_model=RequestResponse)
async def create_request(request: RequestCreate):
    # Check if start date is greater than end date
    if request.vacation_start_date > request.vacation_end_date:
        raise HTTPException(status_code=400, detail="Vacation start date cannot be later than vacation end date.")

    if request.status!='PENDING':
        raise HTTPException(status_code=400, detail="Request status must be PENDING")

    # Fetch the employee details to check holidays left
    employee_query = EmployeeModel.__table__.select().where(EmployeeModel.id == request.author_id)
    employee = await database.fetch_one(employee_query)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    # print("employee",employee.name)
    # Calculate the number of weekdays in the requested period

    manager_query = EmployeeModel.__table__.select().where(EmployeeModel.id == request.manager_id)
    manager = await database.fetch_one(manager_query)
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")
    

    #check if the manager is the manager of the employee
    manager_employee_relation_query = ManagerEmployeeRelationModel.__table__.select().where(
        (ManagerEmployeeRelationModel.manager_id == request.manager_id) & 
        (ManagerEmployeeRelationModel.employee_id == request.author_id)
    )
    manager_employee_relation = await database.fetch_one(manager_employee_relation_query)
    if not manager_employee_relation:
        raise HTTPException(status_code=400, detail="The manager is not the manager of the employee.")

    # Check for overlapping pending requests
    pending_query = RequestModel.__table__.select().where(
        (RequestModel.author_id == request.author_id) & 
        (RequestModel.status == 'PENDING') & 
        (
            (RequestModel.vacation_start_date <= request.vacation_end_date) & 
            (RequestModel.vacation_end_date >= request.vacation_start_date)
        )
    )
    overlapping_pending_requests = await database.fetch_all(pending_query)
    if overlapping_pending_requests:
        raise HTTPException(status_code=400, detail="There is an overlapping pending leave request for this employee.")
    
    # Check for overlapping approved requests
    approved_query = RequestModel.__table__.select().where(
        (RequestModel.author_id == request.author_id) & 
        (RequestModel.status == 'APPROVED') & 
        (
            (RequestModel.vacation_start_date <= request.vacation_end_date) & 
            (RequestModel.vacation_end_date >= request.vacation_start_date)
        )
    )
    overlapping_approved_requests = await database.fetch_all(approved_query)
    if overlapping_approved_requests:
        raise HTTPException(status_code=400, detail="There is an overlapping approved leave request for this employee.")
    
    

    days_requested = count_weekdays(request.vacation_start_date, request.vacation_end_date)
    if days_requested > employee.holidays_left:
        raise HTTPException(status_code=400, detail="Number of weekdays requested exceeds the number of holidays left")

    # Create the new request
    query = RequestModel.__table__.insert().values(
        author_id=request.author_id,
        status=request.status,
        manager_id=request.manager_id,
        request_created_date=request.request_created_date or datetime.utcnow(),
        vacation_start_date=request.vacation_start_date,
        vacation_end_date=request.vacation_end_date
    )
    last_record_id = await database.execute(query)

    # Update holidays_left for the employee
    update_holidays_query = EmployeeModel.__table__.update().where(EmployeeModel.id == request.author_id).values(
        holidays_left=EmployeeModel.holidays_left - days_requested
    )
    await database.execute(update_holidays_query)

    return {
        "id": last_record_id,
        "author_id": request.author_id,
        "status": request.status,
        "manager_id": request.manager_id,
        "request_created_date": request.request_created_date or datetime.utcnow(),
        "vacation_start_date": request.vacation_start_date,
        "vacation_end_date": request.vacation_end_date
    }

@router.get("/requests", response_model=List[RequestResponse])
async def get_requests():
    query = RequestModel.__table__.select()
    return await database.fetch_all(query)

@router.get("/requests/{request_id}", response_model=RequestResponse)
async def get_request(request_id: int):
    query = RequestModel.__table__.select().where(RequestModel.id == request_id)
    request = await database.fetch_one(query)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

@router.get("/requests/employee/{employee_id}", response_model=List[RequestResponse])
async def get_requests_by_employee_id(employee_id: int):
    #Check if the employee exists
    employee_query = EmployeeModel.__table__.select().where(EmployeeModel.id == employee_id)
    employee = await database.fetch_one(employee_query)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    query = RequestModel.__table__.select().where(RequestModel.author_id == employee_id)
    requests = await database.fetch_all(query)
    return requests

@router.put("/requests/{request_id}", response_model=RequestResponse)
async def update_request(request_id: int, request: RequestUpdate):
    current_request = await database.fetch_one(RequestModel.__table__.select().where(RequestModel.id == request_id))
    
    if current_request is None:
        raise HTTPException(status_code=404, detail="Request not found")

    if current_request.status == 'DENIED':
        raise HTTPException(status_code=400, detail="Denied requests cannot be updated")
    
    if current_request.status == 'APPROVED':
        raise HTTPException(status_code=400, detail="Approved requests cannot be updated")

    update_data = request.dict(exclude_unset=True)
    query = RequestModel.__table__.update().where(RequestModel.id == request_id).values(**update_data)
    await database.execute(query)

    # Initialize update_holidays_query variable
    update_holidays_query = None

    # Update holidays_left for the employee
    if 'status' in update_data and update_data['status'] == 'DENIED':
        days_requested = count_weekdays(current_request['vacation_start_date'], current_request['vacation_end_date'])
        update_holidays_query = EmployeeModel.__table__.update().where(EmployeeModel.id == current_request['author_id']).values(
            holidays_left=EmployeeModel.holidays_left + days_requested
        )

    if update_holidays_query is not None:
        await database.execute(update_holidays_query)

    updated_request = await database.fetch_one(RequestModel.__table__.select().where(RequestModel.id == request_id))
    return updated_request



@router.delete("/requests/{request_id}", response_model=dict)
async def delete_request(request_id: int):
    # Fetch the request to check its status
    request_query = RequestModel.__table__.select().where(RequestModel.id == request_id)
    request = await database.fetch_one(request_query)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")

    # Update the number of leaves if the request is pending
    if request.status == 'PENDING' or request.status == 'APPROVED':
        # Fetch the employee details
        employee_query = EmployeeModel.__table__.select().where(EmployeeModel.id == request.author_id)
        employee = await database.fetch_one(employee_query)
        if employee:
            updated_holidays_left = employee.holidays_left + count_weekdays(request.vacation_start_date, request.vacation_end_date)
            update_employee_query = EmployeeModel.__table__.update().where(EmployeeModel.id == request.author_id).values(
                holidays_left=updated_holidays_left
            )
            await database.execute(update_employee_query)

    # Delete the request
    query = RequestModel.__table__.delete().where(RequestModel.id == request_id)
    await database.execute(query)
    return {"message": "Request deleted successfully"}

@router.get("/manager/{manager_id}/employee-status/{date}", response_model=dict)
async def get_employee_status(manager_id: int, date: datetime):
    # Get employees under the given manager
    relation_query = ManagerEmployeeRelationModel.__table__.select().where(ManagerEmployeeRelationModel.manager_id == manager_id)
    employee_relations = await database.fetch_all(relation_query)
    employee_ids = [relation.employee_id for relation in employee_relations]

    if not employee_ids:
        return {"working": 0, "on_leave": 0, "pending_leave": 0}

    # Get requests for the given date
    request_query = RequestModel.__table__.select().where(
        (RequestModel.author_id.in_(employee_ids)) & 
        (
            (RequestModel.vacation_start_date <= date) & 
            (RequestModel.vacation_end_date >= date)
        )
    )
    requests = await database.fetch_all(request_query)

    # Calculate counts
    pending_leave_count = sum(1 for request in requests if request.status == 'PENDING')
    on_leave_count = sum(1 for request in requests if request.status == 'APPROVED')
    working_count = len(employee_ids) - pending_leave_count - on_leave_count

    return {
        "working": working_count,
        "on_leave": on_leave_count,
        "pending_leave": pending_leave_count
    }

@router.get("/manager/{manager_id}/employee-status-details/{date}", response_model=EmployeeStatusDetails)
async def get_employee_status_details(manager_id: int, date: datetime):
    # Ensure date is offset-naive
    date = date.replace(tzinfo=None).date()
    
    # check if the manager exists
    manager_query = EmployeeModel.__table__.select().where(EmployeeModel.id == manager_id)
    manager = await database.fetch_one(manager_query)
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    # Get employees under the given manager
    relation_query = ManagerEmployeeRelationModel.__table__.select().where(ManagerEmployeeRelationModel.manager_id == manager_id)
    employee_relations = await database.fetch_all(relation_query)
    employee_ids = [relation.employee_id for relation in employee_relations]

    if not employee_ids:
        return {"working": [], "on_leave": [], "pending": [],"working_count": 0,"on_leave_count": 0,"pending_count": 0}

    # Get requests for the given date
    request_query = RequestModel.__table__.select().where(
        (RequestModel.author_id.in_(employee_ids)) & 
        (
            (RequestModel.vacation_start_date <= date) & 
            (RequestModel.vacation_end_date >= date)
        )
    )
    requests = await database.fetch_all(request_query)

    working_employees = []
    on_leave_employees = []
    pending_employees = []

    for employee_id in employee_ids:
        employee_query = EmployeeModel.__table__.select().where(EmployeeModel.id == employee_id)
        employee = await database.fetch_one(employee_query)

        if employee:
            employee_dict = dict(employee)
            employee_dict['requests'] = []

            for request in requests:
                if request.author_id == employee_id:
                    # Ensure request dates are offset-naive
                    request_dict = dict(request)
                    request_dict['vacation_start_date'] = request_dict['vacation_start_date'].replace(tzinfo=None).date()
                    request_dict['vacation_end_date'] = request_dict['vacation_end_date'].replace(tzinfo=None).date()
                    employee_dict['requests'].append(request_dict)

            if any(request['status'] == 'APPROVED' and request['vacation_start_date'] <= date <= request['vacation_end_date'] for request in employee_dict['requests']):
                on_leave_employees.append(employee_dict)
            elif any(request['status'] == 'PENDING' and request['vacation_start_date'] <= date <= request['vacation_end_date'] for request in employee_dict['requests']):
                pending_employees.append(employee_dict)
            else:
                working_employees.append(employee_dict)

    return {
        "working": working_employees,
        "on_leave": on_leave_employees,
        "pending": pending_employees,
        "working_count": len(working_employees),
        "on_leave_count": len(on_leave_employees),
        "pending_count": len(pending_employees)
    }
