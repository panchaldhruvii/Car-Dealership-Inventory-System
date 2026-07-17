# DriveSync - Car Dealership Inventory System

DriveSync is a premium, lightweight, single-port web application for managing car dealership inventories. It features a modern dark-themed dashboard, real-time inventory statistics, and role-based access controls.

The frontend is built using standard, framework-free **HTML, CSS, and Vanilla JavaScript**, and is served directly by a **FastAPI** backend backed by a **SQLite** database.

---

## ✨ Features

*   **🔒 Secure User Authentication**: JWT token-based login and password hashing using `bcrypt`.
*   **🛡️ Role-Based Access Control (RBAC)**:
    *   **User/Client**: Browse the inventory, search vehicles, and purchase cars (decrements stock by 1).
    *   **Admin/Staff**: Full inventory control (add new cars, update car specs, restock inventory, delete cars).
*   **📊 Live Dashboard Analytics**: Real-time counters showing total units, total inventory value in USD, low stock alerts, and unique categories.
*   **🔍 Interactive Filtering & Search**: Instant, zero-latency search by make, model, or category, combined with category dropdown filtering.
*   **🎨 Premium Glassmorphic Design**: Clean and responsive dark mode UI styling with background glow visuals, micro-animations, and styled toast notifications.

---

## 🛠️ Technology Stack

*   **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+), Lucide Icons
*   **Backend**: Python, FastAPI, SQLAlchemy (ORM), Uvicorn
*   **Database**: SQLite (`database.db`)

---

## 🚀 Setup & Installation

### Prerequisites
Make sure you have **Python 3.8+** installed on your system.

### 1. Clone & Navigate
```bash
git clone <repository-url>
cd Car-Dealership
```

### 2. Configure Backend
Navigate to the `backend` folder and activate the pre-configured virtual environment, then install dependencies if needed:

#### On Windows (PowerShell):
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### On macOS / Linux:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the Server
Launch the FastAPI development server:
```bash
python -m uvicorn app:app --reload --port 8000
```

Open your browser and navigate to:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## ⚙️ Folder Structure

```text
Car-Dealership/
├── backend/
│   ├── routers/
│   │   ├── auth.py              # Auth API routers
│   │   └── vehicles.py          # Vehicles CRUD API routers
│   ├── app.py                   # App entrypoint and static mount
│   ├── auth.py                  # JWT & password crypt helpers
│   ├── crud.py                  # Database queries layer
│   ├── database.db              # Active database file
│   ├── database.py              # Session configuration
│   ├── models.py                # User & Vehicle tables
│   ├── schemas.py               # Pydantic schemas
│   └── requirements.txt         # Required Python packages
│
├── frontend/
│   ├── app.js                   # Client controller and state manager
│   ├── index.html               # Main dashboard UI structure
│   └── styles.css               # Styling and design system
│
├── Knowledge.md                 # Detailed project code and flow documentation
└── README.md                    # Project README introduction
```

---

## 🔑 Quick Test Credentials
To run a test instantly, register a new account on the register screen and select either the **User** or **Admin** role! 

*Note: Passwords must be at least 6 characters long.*
