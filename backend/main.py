from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from controllers.EmployeeController import router as employee_router
from controllers.ManagerController import router as manager_router

from controllers.ManagerEmployeeRelationController import router as relation_router
from controllers.RequestController import router as request_router
from database import database, create_db_and_tables

from fastapi import Depends
from sqlalchemy import text

from sqlalchemy.orm import Session
from database import get_db

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(employee_router)
app.include_router(manager_router)
app.include_router(relation_router)
app.include_router(request_router)



@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Execute a simple query to test the connection
        result = db.execute(text("SELECT 1"))
        return {"status": "success", "result": result.scalar()}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    

@app.on_event("startup")
async def startup():
    await database.connect()
    create_db_and_tables()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
