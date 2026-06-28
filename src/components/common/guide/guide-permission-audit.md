# Lotus Guide Permission Audit

Quet tu `src/config/permissions.ts` va cac lan dung `ALL_PERMISSIONS.*.*` trong `src`.

## Tong Ket

- Nhom permission: 49
- Tong permission khai bao: 343
- Permission dang duoc UI su dung: 175
- Permission nen co huong dan theo nghiep vu: 213
- Permission nen co huong dan va dang duoc UI su dung: 118
- Permission CRUD/trang thai cot loi: 157
- Permission CRUD/trang thai cot loi dang duoc UI su dung: 90

## Pham Vi Guide Da Gan Target

Da bo sung guide CRUD/action theo permission cho cac module co UI quan tri ro rang:

- USERS: them, xem chi tiet, cap nhat.
- ROLES: them, cap nhat phan quyen, xoa.
- PERMISSIONS: them, cap nhat, xoa.
- EMPLOYEES: xem chi tiet, cap nhat, xoa.
- SECTIONS: them, xem chi tiet, cap nhat.
- POSITION_LEVELS: them, xem chi tiet, cap nhat, xoa.
- JOB_TITLES: them, xem chi tiet, cap nhat.
- PROCESS_ACTIONS: them, xem chi tiet, cap nhat.
- PERMISSION_CATEGORY: them, xem chi tiet, cap nhat, ngung su dung.
- DOCUMENT_CATEGORIES: them, xem chi tiet, cap nhat, bat/tat trang thai.
- ACCOUNTING_DOCUMENT_CATEGORIES: them, cap nhat, bat/tat trang thai, xoa.
- DOCUMENTS: xem chi tiet, mo menu cap nhat/trang thai.
- ACCOUNTING_DOSSIERS: tao, xem chi tiet, cap nhat, xoa.
- PROCEDURE_COMPANY: them, xem chi tiet, cap nhat, tao version moi, xoa.
- PROCEDURE_DEPARTMENT: them, xem chi tiet, cap nhat, tao version moi, xoa.
- PROCEDURE_CONFIDENTIAL: them, xem chi tiet, cap nhat, tao version moi, xoa.
- JOB_DESCRIPTIONS/JD_FLOW: tao JD, xem chi tiet, cap nhat, xoa, duyet, tu choi, ban hanh.

Ghi chu UI/UX: guide moi chi target vao nut, o tim kiem hoac modal co class on dinh. Khong dung target rong nhu `.ant-layout-content` de tranh highlight ca trang va gay cam giac lag/lech.

Cap nhat tiep theo: cac guide cap nhat co form/modal da duoc nang thanh luong 3 buoc hoac 4 buoc neu thao tac nam trong menu ba cham: tim ban ghi -> mo menu/nut thao tac -> chon thao tac -> xu ly tren form/modal.

## Theo Module

| Module | Tong permission | Dang dung UI | Nen co guide | Nen co guide dang dung UI | CRUD/trang thai | CRUD/trang thai dang dung UI |
|---|---:|---:|---:|---:|---:|---:|
| DASHBOARD | 1 | 1 | 0 | 0 | 0 | 0 |
| PERMISSIONS | 4 | 3 | 3 | 2 | 3 | 2 |
| ACCOUNTING_DOCUMENTS | 5 | 5 | 4 | 4 | 4 | 4 |
| ACCOUNTING_DOSSIERS | 17 | 4 | 12 | 3 | 4 | 3 |
| ACCOUNTING_DOCUMENT_CATEGORIES | 7 | 4 | 5 | 3 | 5 | 3 |
| ROLES | 4 | 3 | 3 | 2 | 3 | 2 |
| USERS | 5 | 4 | 4 | 3 | 4 | 3 |
| USER_POSITIONS | 3 | 0 | 2 | 0 | 2 | 0 |
| COMPANIES | 6 | 6 | 5 | 5 | 5 | 5 |
| DEPARTMENTS | 7 | 5 | 4 | 4 | 4 | 4 |
| DEPARTMENT_JOB_TITLES | 8 | 3 | 4 | 2 | 4 | 2 |
| SECTIONS | 8 | 4 | 6 | 3 | 6 | 3 |
| POSITION_LEVELS | 6 | 5 | 5 | 4 | 5 | 4 |
| JOB_TITLES | 5 | 4 | 4 | 3 | 4 | 3 |
| COMPANY_PROCEDURES | 5 | 1 | 4 | 0 | 4 | 0 |
| CAREER_PATHS | 8 | 6 | 3 | 3 | 3 | 3 |
| SECTION_JOB_TITLES | 6 | 1 | 4 | 0 | 4 | 0 |
| COMPANY_JOB_TITLES | 3 | 0 | 2 | 0 | 2 | 0 |
| COMPANY_SALARY_GRADES | 7 | 0 | 4 | 0 | 4 | 0 |
| SALARY_GRADES | 4 | 0 | 3 | 0 | 3 | 0 |
| DEPARTMENT_SALARY_GRADES | 7 | 4 | 4 | 3 | 4 | 3 |
| SECTION_SALARY_GRADES | 7 | 0 | 4 | 0 | 4 | 0 |
| JOB_TITLE_PERFORMANCE_CONTENT | 6 | 5 | 5 | 4 | 5 | 4 |
| SALARY_RANGE | 2 | 2 | 2 | 2 | 0 | 0 |
| SALARY_STRUCTURE | 2 | 0 | 1 | 0 | 0 | 0 |
| PERFORMANCE_CONTENT | 3 | 0 | 2 | 0 | 1 | 0 |
| PROCESS_ACTIONS | 5 | 4 | 4 | 3 | 4 | 3 |
| PERMISSION_CATEGORY | 5 | 5 | 4 | 4 | 4 | 4 |
| PERMISSION_CONTENT | 5 | 5 | 4 | 4 | 4 | 4 |
| PERMISSION_ASSIGNMENT | 2 | 1 | 1 | 0 | 0 | 0 |
| JOB_DESCRIPTIONS | 8 | 8 | 4 | 4 | 4 | 4 |
| DEPARTMENT_OBJECTIVES | 6 | 2 | 5 | 2 | 4 | 1 |
| DEPARTMENT_PROCEDURES | 5 | 0 | 4 | 0 | 4 | 0 |
| ORG_CHARTS | 4 | 1 | 3 | 0 | 3 | 0 |
| ORG_NODES | 5 | 3 | 3 | 3 | 3 | 3 |
| JD_FLOW | 8 | 6 | 4 | 4 | 0 | 0 |
| PROCEDURES | 22 | 3 | 12 | 1 | 5 | 0 |
| EMPLOYEE_CAREER_PATHS | 9 | 5 | 4 | 3 | 1 | 1 |
| CAREER_PATH_TEMPLATES | 7 | 1 | 3 | 0 | 3 | 0 |
| USER_INFO | 3 | 0 | 2 | 0 | 2 | 0 |
| PROCEDURE_COMPANY | 5 | 5 | 5 | 5 | 4 | 4 |
| PROCEDURE_DEPARTMENT | 5 | 5 | 5 | 5 | 4 | 4 |
| PROCEDURE_CONFIDENTIAL | 11 | 8 | 6 | 5 | 4 | 4 |
| EMPLOYEES | 5 | 5 | 4 | 4 | 4 | 4 |
| POSITION_CHART | 1 | 1 | 1 | 1 | 0 | 0 |
| DOCUMENT_CATEGORIES | 5 | 4 | 4 | 3 | 4 | 3 |
| DOCUMENTS | 14 | 5 | 9 | 4 | 5 | 3 |
| EVALUATION | 51 | 27 | 19 | 13 | 0 | 0 |
| DOCUMENT_FOLDERS | 6 | 1 | 4 | 0 | 4 | 0 |

## Permission Nen Co Guide Theo Module

### PERMISSIONS
CREATE, UPDATE, DELETE

### ACCOUNTING_DOCUMENTS
GET_BY_ID, CREATE, UPDATE, DELETE

### ACCOUNTING_DOSSIERS
GET_BY_ID, CREATE, UPDATE, DELETE, SUBMIT, REQUEST_RETURN, CREATE_CATEGORY, UPDATE_CATEGORY, TOGGLE_CATEGORY_ACTIVE, CREATE_DOCUMENT, UPDATE_DOCUMENT, DELETE_DOCUMENT

### ACCOUNTING_DOCUMENT_CATEGORIES
GET_BY_ID, CREATE, UPDATE, TOGGLE_ACTIVE, DELETE

### ROLES
CREATE, UPDATE, DELETE

### USERS
GET_BY_ID, CREATE, UPDATE, DELETE

### USER_POSITIONS
CREATE, DELETE

### COMPANIES
GET_BY_ID, CREATE, UPDATE, INACTIVE, ACTIVE

### DEPARTMENTS
GET_BY_ID, CREATE, UPDATE, DELETE

### DEPARTMENT_JOB_TITLES
GET_BY_ID, CREATE, DELETE, RESTORE

### SECTIONS
GET_BY_ID, CREATE, UPDATE, DELETE, ACTIVE, INACTIVE

### POSITION_LEVELS
GET_BY_ID, CREATE, UPDATE, DELETE, ACTIVE

### JOB_TITLES
GET_BY_ID, CREATE, UPDATE, DELETE

### COMPANY_PROCEDURES
GET_BY_ID, CREATE, UPDATE, ACTIVE

### CAREER_PATHS
CREATE, UPDATE, GET_BY_ID

### SECTION_JOB_TITLES
GET_BY_ID, CREATE, DELETE, RESTORE

### COMPANY_JOB_TITLES
CREATE, DELETE

### COMPANY_SALARY_GRADES
CREATE, UPDATE, DELETE, RESTORE

### SALARY_GRADES
GET_BY_ID, CREATE, DELETE

### DEPARTMENT_SALARY_GRADES
CREATE, UPDATE, DELETE, RESTORE

### SECTION_SALARY_GRADES
CREATE, UPDATE, DELETE, RESTORE

### JOB_TITLE_PERFORMANCE_CONTENT
GET_BY_ID, CREATE, UPDATE, DISABLE, RESTORE

### SALARY_RANGE
VIEW, VIEW_MY

### SALARY_STRUCTURE
VIEW_DETAIL

### PERFORMANCE_CONTENT
VIEW, DELETE

### PROCESS_ACTIONS
GET_BY_ID, CREATE, UPDATE, DELETE

### PERMISSION_CATEGORY
GET_BY_ID, CREATE, UPDATE, DELETE

### PERMISSION_CONTENT
GET_BY_ID, CREATE, UPDATE, DELETE

### PERMISSION_ASSIGNMENT
ASSIGN

### JOB_DESCRIPTIONS
GET_BY_ID, CREATE, UPDATE, DELETE

### DEPARTMENT_OBJECTIVES
VIEW, CREATE, UPDATE, DELETE, GET_BY_ID

### DEPARTMENT_PROCEDURES
GET_BY_ID, CREATE, UPDATE, DELETE

### ORG_CHARTS
CREATE, UPDATE, DELETE

### ORG_NODES
CREATE, UPDATE, DELETE

### JD_FLOW
SUBMIT, APPROVE, REJECT, ISSUE

### PROCEDURES
GET_BY_ID, CREATE, UPDATE, DELETE, TOGGLE_ACTIVE, CREATE_COMPANY, CREATE_DEPARTMENT, CREATE_CONFIDENTIAL, REVISE, CREATE_SHARE_TOKEN, REVOKE_SHARE_TOKEN, SEND_SHARE_EMAIL

### EMPLOYEE_CAREER_PATHS
ASSIGN, UPDATE, PROMOTE, SET_STATUS

### CAREER_PATH_TEMPLATES
CREATE, UPDATE, GET_BY_ID

### USER_INFO
CREATE, UPDATE

### PROCEDURE_COMPANY
CREATE, GET_BY_ID, UPDATE, REVISE, DELETE

### PROCEDURE_DEPARTMENT
CREATE, GET_BY_ID, UPDATE, REVISE, DELETE

### PROCEDURE_CONFIDENTIAL
CREATE, GET_BY_ID, UPDATE, REVISE, DELETE, REVOKE

### EMPLOYEES
GET_BY_ID, CREATE, UPDATE, DELETE

### POSITION_CHART
VIEW

### DOCUMENT_CATEGORIES
GET_BY_ID, CREATE, UPDATE, TOGGLE_ACTIVE

### DOCUMENTS
GET_BY_ID, CREATE, UPDATE, TOGGLE_ACTIVE, DELETE, CREATE_SHARE_TOKEN, REVOKE_SHARE_TOKEN, SEND_SHARE_EMAIL, MARK_READ

### EVALUATION
CREATE_TEMPLATE, UPDATE_TEMPLATE, PUBLISH_TEMPLATE, CREATE_SECTION, UPDATE_SECTION, DELETE_SECTION, CREATE_CRITERIA, UPDATE_CRITERIA, DELETE_CRITERIA, CREATE_LEVEL, UPDATE_LEVEL, CREATE_PERIOD, UPDATE_PERIOD, EMPLOYEE_SUBMIT, EMPLOYEE_SELF_REVIEW, MANAGER_SUBMIT, APPROVE_RECORD, REJECT_RECORD, BATCH_APPROVE_RECORDS

### DOCUMENT_FOLDERS
CREATE, GET_BY_ID, UPDATE, DELETE
