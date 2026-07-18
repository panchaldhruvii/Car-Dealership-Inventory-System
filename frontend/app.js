/* ==========================================================================
   DriveSync Application Controller (Vanilla JS)
   ========================================================================== */

// Base API Configuration
const API_BASE = ""; // Relative paths as it's served on the same host/port

// State Manager
const AppState = {
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,
    vehicles: [],
    categories: new Set(),
    activeFilter: "all",
    searchQuery: ""
};

// Initial Setup & DOM Elements
document.addEventListener("DOMContentLoaded", () => {
    initApp();
    setupEventHandlers();
});

// ==========================================
// INITIALIZATION
// ==========================================
function initApp() {
    // Initialize icons
    lucide.createIcons();
    
    if (AppState.token && AppState.user) {
        showDashboard();
        fetchInventory();
    } else {
        showAuth();
    }
}

// ==========================================
// NAVIGATION & VIEW TOGGLING
// ==========================================
function showAuth() {
    document.getElementById("auth-view").classList.remove("hidden");
    document.getElementById("dashboard-view").classList.add("hidden");
    document.body.className = "";
}

function showDashboard() {
    document.getElementById("auth-view").classList.add("hidden");
    document.getElementById("dashboard-view").classList.remove("hidden");
    
    // Set user info
    document.getElementById("user-name").textContent = AppState.user.username;
    
    const roleBadge = document.getElementById("user-role-badge");
    roleBadge.textContent = AppState.user.role;
    
    // Apply role class to body for CSS role-based visibility
    document.body.className = "";
    if (AppState.user.role === "admin") {
        document.body.classList.add("role-admin");
        roleBadge.className = "role-badge text-primary";
    } else {
        roleBadge.className = "role-badge text-info";
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconName = "check-circle";
    if (type === "error") iconName = "alert-circle";
    if (type === "warning") iconName = "alert-triangle";
    
    toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons({ attrs: { class: "toast-icon" } });
    
    // Auto remove toast
    setTimeout(() => {
        toast.style.animation = "fadeIn 0.3s ease reverse";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// EVENT HANDLERS SETUP
// ==========================================
function setupEventHandlers() {
    // Auth Toggle links
    document.getElementById("to-register").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("login-card").classList.add("hidden");
        document.getElementById("register-card").classList.remove("hidden");
    });

    document.getElementById("to-login").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("register-card").classList.add("hidden");
        document.getElementById("login-card").classList.remove("hidden");
    });

    // Form Submissions
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("register-form").addEventListener("submit", handleRegister);
    document.getElementById("logout-btn").addEventListener("click", handleLogout);
    
    // Search & Filter
    const searchInput = document.getElementById("search-input");
    const clearBtn = document.getElementById("search-clear-btn");
    
    searchInput.addEventListener("input", (e) => {
        AppState.searchQuery = e.target.value.toLowerCase().trim();
        if (AppState.searchQuery.length > 0) {
            clearBtn.classList.remove("hidden");
        } else {
            clearBtn.classList.add("hidden");
        }
        renderInventory();
    });
    
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearBtn.classList.add("hidden");
        AppState.searchQuery = "";
        renderInventory();
    });
    
    document.getElementById("category-filter").addEventListener("change", (e) => {
        AppState.activeFilter = e.target.value;
        renderInventory();
    });

    // Modals control
    document.getElementById("add-vehicle-trigger").addEventListener("click", () => openVehicleModal());
    document.getElementById("modal-close").addEventListener("click", closeVehicleModal);
    document.getElementById("modal-cancel").addEventListener("click", closeVehicleModal);
    document.getElementById("vehicle-form").addEventListener("submit", saveVehicle);
    
    document.getElementById("restock-modal-close").addEventListener("click", closeRestockModal);
    document.getElementById("restock-modal-cancel").addEventListener("click", closeRestockModal);
    document.getElementById("restock-form").addEventListener("submit", saveRestock);
}

// ==========================================
// API & NETWORK HELPERS
// ==========================================
async function apiCall(endpoint, options = {}) {
    // Add auth token if present
    options.headers = options.headers || {};
    if (AppState.token) {
        options.headers["Authorization"] = `Bearer ${AppState.token}`;
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong");
        }
        
        return data;
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}

// ==========================================
// AUTHENTICATION LOGIC
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const loginBtn = document.getElementById("login-btn");
    
    // Set loading state
    loginBtn.disabled = true;
    loginBtn.querySelector("span").textContent = "Signing in...";
    
    try {
        // OAuth2 Password Request Form requires x-www-form-urlencoded
        const formParams = new URLSearchParams();
        formParams.append("username", email);
        formParams.append("password", password);
        
        const tokenData = await apiCall("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formParams
        });
        
        // Cache Token
        AppState.token = tokenData.access_token;
        localStorage.setItem("token", AppState.token);
        
        // Retrieve current user metadata (we do a quick request or parse token)
        // FastAPI oauth2 token has subject as email, we can query details by fetching vehicles,
        // or let's create a temporary user object since the login does not directly return user details.
        // Wait, backend router does not have a /auth/me endpoint, but it returns JWT token.
        // We can register details. Wait, where do we get the username and role?
        // Let's decode the JWT token payload or let's deduce it.
        // Since we don't have an auth/me endpoint in router auth.py, wait!
        // Let's look at router/auth.py again: it registers a new user with UserResponse.
        // Let's look at auth.py: get_current_user returns the user object.
        // Let's look if there is a way to get user info. There is no /auth/me endpoint.
        // But wait! We can decode the token or we can write a simple endpoint, or we can look up user in client registry, or we can fetch a dummy endpoint, or we can just parse the payload.
        // Let's check: the payload contains sub: email.
        // Can we just store the user information when registering or assume standard staff role if they log in?
        // Wait! Let's examine: how does the system know the user role?
        // If they register, we know the role. If they just login, they get a token.
        // Let's check if we can add a quick /auth/me endpoint to app.py / routers/auth.py or read it.
        // If we modify router/auth.py to add a GET /auth/me endpoint that depends on get_current_user,
        // we can fetch the user details (username, email, role) right after login!
        // That is an excellent, robust design! Let's do that in app.py or auth router.
        // For now, let's assume we can fetch it, and write the client-side logic to query `/auth/me`.
        
        const userData = await apiCall("/auth/me");
        AppState.user = userData;
        localStorage.setItem("user", JSON.stringify(AppState.user));
        
        showToast("Welcome back to DriveSync!");
        showDashboard();
        fetchInventory();
        
        // Reset form
        document.getElementById("login-form").reset();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        loginBtn.disabled = false;
        loginBtn.querySelector("span").textContent = "Sign In";
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const role = document.getElementById("register-role").value;
    const registerBtn = document.getElementById("register-btn");
    
    registerBtn.disabled = true;
    registerBtn.querySelector("span").textContent = "Creating Account...";
    
    try {
        await apiCall("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, role })
        });
        
        showToast("Registration successful! You can now log in.");
        
        // Toggle view back to login
        document.getElementById("register-card").classList.add("hidden");
        document.getElementById("login-card").classList.remove("hidden");
        document.getElementById("login-email").value = email;
        
        document.getElementById("register-form").reset();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        registerBtn.disabled = false;
        registerBtn.querySelector("span").textContent = "Create Account";
    }
}

function handleLogout() {
    AppState.token = null;
    AppState.user = null;
    AppState.vehicles = [];
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    showToast("Logged out successfully.");
    showAuth();
}

// ==========================================
// INVENTORY LOGIC (CRUD)
// ==========================================
async function fetchInventory() {
    document.getElementById("loading-state").classList.remove("hidden");
    document.getElementById("vehicle-grid").innerHTML = "";
    document.getElementById("empty-state").classList.add("hidden");
    
    try {
        const vehicles = await apiCall("/vehicles/");
        AppState.vehicles = vehicles;
        
        // Rebuild category list
        AppState.categories.clear();
        vehicles.forEach(car => {
            if (car.category) AppState.categories.add(car.category);
        });
        
        updateCategoryDropdown();
        updateStats();
        renderInventory();
    } catch (err) {
        showToast("Failed to fetch inventory: " + err.message, "error");
        if (err.message.includes("Invalid Token") || err.message.includes("Not authenticated")) {
            handleLogout();
        }
    } finally {
        document.getElementById("loading-state").classList.add("hidden");
    }
}

function updateCategoryDropdown() {
    const filterSelect = document.getElementById("category-filter");
    // Preserve first option (All)
    filterSelect.innerHTML = '<option value="all">All Categories</option>';
    
    AppState.categories.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        filterSelect.appendChild(opt);
    });
    
    // Set selection back if it exists
    filterSelect.value = AppState.activeFilter;
}

function updateStats() {
    const totalQty = AppState.vehicles.reduce((sum, c) => sum + c.quantity, 0);
    const totalVal = AppState.vehicles.reduce((sum, c) => sum + (c.price * c.quantity), 0);
    const lowStock = AppState.vehicles.filter(c => c.quantity < 3 && c.quantity > 0).length;
    
    document.getElementById("stat-total-vehicles").textContent = totalQty;
    document.getElementById("stat-categories").textContent = AppState.categories.size;
    document.getElementById("stat-low-stock").textContent = lowStock;
    
    // Format value in local format
    document.getElementById("stat-total-val").textContent = `$${totalVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function renderInventory() {
    const grid = document.getElementById("vehicle-grid");
    grid.innerHTML = "";
    
    // Filter vehicles
    const filtered = AppState.vehicles.filter(car => {
        const matchesCategory = AppState.activeFilter === "all" || car.category === AppState.activeFilter;
        
        const searchTarget = `${car.make} ${car.model} ${car.category}`.toLowerCase();
        const matchesSearch = AppState.searchQuery === "" || searchTarget.includes(AppState.searchQuery);
        
        return matchesCategory && matchesSearch;
    });
    
    if (filtered.length === 0) {
        document.getElementById("empty-state").classList.remove("hidden");
        return;
    }
    
    document.getElementById("empty-state").classList.add("hidden");
    
    // Create elements and append
    filtered.forEach(car => {
        const card = document.createElement("div");
        card.className = "vehicle-card";
        
        // Stock status badge
        let badgeClass = "badge-in-stock";
        let badgeText = "In Stock";
        if (car.quantity === 0) {
            badgeClass = "badge-out-of-stock";
            badgeText = "Out of Stock";
        } else if (car.quantity < 3) {
            badgeClass = "badge-low-stock";
            badgeText = "Low Stock";
        }
        
        card.innerHTML = `
            <div class="card-banner">
                <span class="card-badge ${badgeClass}">${badgeText}</span>
                <span class="card-category">${escapeHTML(car.category)}</span>
                <h3 class="card-title">${escapeHTML(car.make)} ${escapeHTML(car.model)}</h3>
            </div>
            <div class="card-body">
                <div class="card-info-row">
                    <div class="info-item">
                        <span class="info-label">Available</span>
                        <span class="info-value">${car.quantity} units</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Price</span>
                        <span class="info-value info-price">$${car.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-success purchase-car-btn" data-id="${car.id}" ${car.quantity === 0 ? "disabled" : ""}>
                        <i data-lucide="shopping-cart"></i>
                        <span>${car.quantity === 0 ? "Unavailable" : "Purchase"}</span>
                    </button>
                </div>
            </div>
            <div class="admin-card-bar admin-only">
                <button class="btn btn-secondary restock-car-btn" data-id="${car.id}">
                    <i data-lucide="plus-circle"></i>
                    <span>Restock</span>
                </button>
                <button class="btn btn-secondary edit-car-btn" data-id="${car.id}">
                    <i data-lucide="edit-3"></i>
                    <span>Edit</span>
                </button>
                <button class="btn btn-danger delete-car-btn" data-id="${car.id}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    // Re-trigger Lucide icons render on cards
    lucide.createIcons();
    
    // Add event listeners to card buttons
    grid.querySelectorAll(".purchase-car-btn").forEach(btn => {
        btn.addEventListener("click", () => handlePurchase(parseInt(btn.dataset.id)));
    });
    
    grid.querySelectorAll(".restock-car-btn").forEach(btn => {
        btn.addEventListener("click", () => openRestockModal(parseInt(btn.dataset.id)));
    });
    
    grid.querySelectorAll(".edit-car-btn").forEach(btn => {
        btn.addEventListener("click", () => openVehicleModal(parseInt(btn.dataset.id)));
    });
    
    grid.querySelectorAll(".delete-car-btn").forEach(btn => {
        btn.addEventListener("click", () => handleDelete(parseInt(btn.dataset.id)));
    });
}

// ==========================================
// CARD ACTIONS LOGIC
// ==========================================
async function handlePurchase(vehicleId) {
    try {
        const updatedCar = await apiCall(`/vehicles/${vehicleId}/purchase`, {
            method: "POST"
        });
        
        showToast(`Successfully purchased ${updatedCar.make} ${updatedCar.model}!`);
        
        // Update local item quantity
        const carIndex = AppState.vehicles.findIndex(c => c.id === vehicleId);
        if (carIndex !== -1) {
            AppState.vehicles[carIndex] = updatedCar;
            updateStats();
            renderInventory();
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function handleDelete(vehicleId) {
    const car = AppState.vehicles.find(c => c.id === vehicleId);
    if (!car) return;
    
    if (!confirm(`Are you sure you want to delete ${car.make} ${car.model} from inventory?`)) {
        return;
    }
    
    try {
        await apiCall(`/vehicles/${vehicleId}`, {
            method: "DELETE"
        });
        
        showToast("Vehicle deleted successfully.");
        
        // Remove item from local state list
        AppState.vehicles = AppState.vehicles.filter(c => c.id !== vehicleId);
        
        // Re-compile categories list if deleted item was the only one
        AppState.categories.clear();
        AppState.vehicles.forEach(c => {
            if (c.category) AppState.categories.add(c.category);
        });
        
        updateCategoryDropdown();
        updateStats();
        renderInventory();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// ADD/EDIT VEHICLE MODAL FORM
// ==========================================
function openVehicleModal(vehicleId = null) {
    const modal = document.getElementById("vehicle-modal");
    const title = document.getElementById("modal-title");
    const submitBtn = document.getElementById("modal-submit-btn");
    const form = document.getElementById("vehicle-form");
    
    form.reset();
    
    if (vehicleId) {
        // Edit Mode
        const car = AppState.vehicles.find(c => c.id === vehicleId);
        if (!car) return;
        
        title.textContent = `Edit: ${car.make} ${car.model}`;
        submitBtn.textContent = "Save Changes";
        
        document.getElementById("form-vehicle-id").value = car.id;
        document.getElementById("form-make").value = car.make;
        document.getElementById("form-model").value = car.model;
        document.getElementById("form-category").value = car.category;
        document.getElementById("form-price").value = car.price;
        document.getElementById("form-quantity").value = car.quantity;
        // Make quantity input editable for editing
        document.getElementById("form-quantity").disabled = false;
    } else {
        // Add Mode
        title.textContent = "Add New Vehicle";
        submitBtn.textContent = "Create Vehicle";
        
        document.getElementById("form-vehicle-id").value = "";
        document.getElementById("form-quantity").disabled = false;
    }
    
    modal.classList.remove("hidden");
    lucide.createIcons();
}

function closeVehicleModal() {
    document.getElementById("vehicle-modal").classList.add("hidden");
}

async function saveVehicle(e) {
    e.preventDefault();
    
    const id = document.getElementById("form-vehicle-id").value;
    const make = document.getElementById("form-make").value.trim();
    const model = document.getElementById("form-model").value.trim();
    const category = document.getElementById("form-category").value.trim();
    const price = parseFloat(document.getElementById("form-price").value);
    const quantity = parseInt(document.getElementById("form-quantity").value);
    
    const payload = { make, model, category, price, quantity };
    
    try {
        if (id) {
            // Edit request (API doesn't update quantity via PUT usually, but schemas.py has quantity as optional update field)
            const updated = await apiCall(`/vehicles/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ make, model, category, price, quantity })
            });
            
            showToast("Vehicle updated successfully.");
            
            const index = AppState.vehicles.findIndex(c => c.id === parseInt(id));
            if (index !== -1) AppState.vehicles[index] = updated;
        } else {
            // Add request
            const created = await apiCall("/vehicles/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            showToast("New vehicle registered successfully.");
            AppState.vehicles.push(created);
        }
        
        // Recompute lists & states
        AppState.categories.clear();
        AppState.vehicles.forEach(c => {
            if (c.category) AppState.categories.add(c.category);
        });
        
        updateCategoryDropdown();
        updateStats();
        renderInventory();
        closeVehicleModal();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// RESTOCK MODAL LOGIC
// ==========================================
function openRestockModal(vehicleId) {
    const car = AppState.vehicles.find(c => c.id === vehicleId);
    if (!car) return;
    
    document.getElementById("restock-vehicle-id").value = car.id;
    document.getElementById("restock-car-title").innerHTML = `Restock: <strong>${escapeHTML(car.make)} ${escapeHTML(car.model)}</strong>`;
    document.getElementById("restock-current-qty").textContent = car.quantity;
    document.getElementById("restock-qty-input").value = 5; // Default suggest adding 5
    
    document.getElementById("restock-modal").classList.remove("hidden");
    lucide.createIcons();
}

function closeRestockModal() {
    document.getElementById("restock-modal").classList.add("hidden");
}

async function saveRestock(e) {
    e.preventDefault();
    
    const id = document.getElementById("restock-vehicle-id").value;
    const qty = parseInt(document.getElementById("restock-qty-input").value);
    
    if (isNaN(qty) || qty <= 0) {
        showToast("Please enter a valid quantity.", "warning");
        return;
    }
    
    try {
        // POST /vehicles/{vehicle_id}/restock?quantity={quantity}
        const updated = await apiCall(`/vehicles/${id}/restock?quantity=${qty}`, {
            method: "POST"
        });
        
        showToast(`Stock replenished for ${updated.make} ${updated.model}!`);
        
        const index = AppState.vehicles.findIndex(c => c.id === parseInt(id));
        if (index !== -1) {
            AppState.vehicles[index] = updated;
            updateStats();
            renderInventory();
        }
        closeRestockModal();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ==========================================
// UTILITY HELPERS
// ==========================================
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
