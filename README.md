# Employee Leave Request Platform
This project is an employee manager leave request platform, consisting of two sub-projects: the frontend and the backend.



## Frontend
The frontend is built using React and consists of three major components: Admin, Manager, and Employee.

### Admin

- Create Employee: Admin can create an employee by providing details such as name, age, contact details, holidays left, and manager ID. All these fields have constraints on the backend (e.g., age must be a number, holidays left must be between 0 and 30, manager with the given ID must exist).
- Create Manager: Admin can create a manager by providing an employee ID.
- All APIs for creating, deleting, and updating are tested on the backend.

### Employee

- Login: Employees log in using their employee ID.
- Dashboard: Displays a calendar for November 2024 and a table with a filter option to filter requests (APPROVED, DENIED, PENDING). Requests are highlighted on the calendar.
- Delete Requests: Employees can delete requests that have been approved or are pending.
- Create Requests: Employees can create a new request with a start and end date. Constraints and conditions for the request are checked via the API.
- Holidays Left: The number of holidays left is always updated and displayed at the top of the screen.


### Manager 
- Login: Managers log in using their manager ID.
- Dashboard: Consists of three views:
- - Comprehensive Calendar: Clicking any date provides the status of employees working, on leave, or with pending leave requests for that day.
- - Request Table: Displays all requests for the manager, with the ability to filter requests and approve or deny pending requests.
- - Employee Status: Shows which employees are working for the selected day, with a clickable interface to open a modal. The modal contains:
- - - Calendar for the selected employee with a display of leave requests and their status (color-coded).
- - - Table with action buttons for approving or denying requests.

#### Running the Frontend 
To run the frontend, navigate to the root directory and run:

### `npm start`

The backend is built using FastAPI and MySQL.

#### Environment Setup
- Install all the packages from 'requirements.txt'
- Set up the database in config.py. It is preferable to use MySQL XAMPP.
- Create a table and use the database link in the config file. The config file also has a testing URL that should remain unchanged and a testing variable that changes to True when testing APIs.


### Models
Following the MVC architecture, there are four models:

- Employee: Contains employee details (id, name, age, contact_details, holidays_left).
- Manager: Contains a foreign key from the employee table (id, employee_id).
- EmployeeManagerRelation: Contains id, manager_id, employee_id.- 
Request: Contains id, employee_id, manager_id, date_created, start_date, end_date, status.

All constraints on the database are present in the models, and the controllers contain task APIs for respective models.

#### Running the Backend Server
To run the backend server, use:

### `uvicorn main:app --reload`

### Testing
For testing:

- Change the TESTING variable in config.py to True.
- Run the server:

### `uvicorn main:app --reload`

- In the root location, run the command

### `pytest tests\test_controllers.py`

### Note
For simplicity and logical purposes, an employee is already added to the system and made a manager, as one cannot create an employee without having a manager in the system