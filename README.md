# 🔬 LabTrack - Academic Laboratory & Assignment Management System

**LabTrack** is a specialized full-stack platform designed to digitize and secure the workflow of academic laboratories. Unlike generic classroom tools, it implements a "Zero-Trust" environment for practical exams and assignments, ensuring academic integrity through location-based and time-sensitive access.



## 🌟 Key Features

### 🔐  Integrated Security & Compliance
* **Location-Based Access (IP Filtering):** Restricts student workspaces to specific college lab IP addresses (e.g., `10.249.x.x`), preventing off-campus submissions.
* **Timetable Synchronization:** Assignments are dynamically "locked" and only accessible during scheduled lab hours for a specific Grade and Batch.
* **Automated Submission Engine:** An integrated countdown timer triggers an auto-submission when the lab session expires, ensuring no student misses the deadline.


### 👨‍🏫 Faculty Control Center
* **Resource Distribution:** Faculty can upload documents or links via `faculty_resources` targeted at specific classes.
* **Role-Based Control:** Distinct privileges for `Faculty` and `HOD` roles defined within the schema.
* **Live Evaluation:** Manage marks and feedback for `Practical` and `Theory` assignments directly through the `submissions` table.


### 👨‍🎓 Student Workspace
* **Role-Based Filtering:** Students receive a curated dashboard based strictly on their Year (Grade) and Batch.
* **Multi-Modal Submissions:** Support for direct code input (with live execution), file uploads (PDF/Docs), and external project links.

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Lucide React, Axios |
| **Backend** | PHP (RESTful API), PDO for secure SQL queries |
| **Database** | MySQL (Relational Schema) |
| **Compiler** | Judge0 Community Edition API (Replacing Piston API for stability) |






## ⚙️ Installation & Setup

### 1. Database Setup
* Create a MySQL database named `labtrack`.

### 2. Backend Configuration
* Navigate to `server/config/database.php` and update your MySQL credentials.
* **Note:** This project is designed to run without Firebase for database management.
* Ensure the `server/uploads/submissions` directory has write permissions.

### 3. Frontend Setup
* Navigate to the `client` directory.
```bash
npm install
npm run dev
