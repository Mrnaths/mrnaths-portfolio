import supabase from "./supabase.js";

/* ==========================================
   AUTHENTICATION
========================================== */

const {
    data: { session }
} = await supabase.auth.getSession();

if (!session) {
    window.location.href = "login.html";
}

/* ==========================================
   DOM ELEMENTS
========================================== */

// Project
const title = document.getElementById("title");
const description = document.getElementById("description");
const category = document.getElementById("category");
const image = document.getElementById("image");

const previewImage = document.getElementById("previewImage");
const previewText = document.getElementById("previewText");

const uploadBtn = document.getElementById("uploadBtn");
const status = document.getElementById("status");
const gallery = document.getElementById("gallery");

let editingId = null;
let currentImage = "";

// Logout
const logoutBtn = document.getElementById("logoutBtn");

/* ==========================================
   LOGOUT
========================================== */

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "login.html";
    });
}

/* ==========================================
   IMAGE PREVIEW
========================================== */

if (image) {

    image.addEventListener("change", () => {

        const file = image.files[0];

        if (!file) {
            previewImage.style.display = "none";
            previewText.style.display = "block";
            return;
        }

        const reader = new FileReader();

        reader.onload = e => {

            previewImage.src = e.target.result;
            previewImage.style.display = "block";
            previewText.style.display = "none";

        };

        reader.readAsDataURL(file);

    });

}

/* ==========================================
   SAVE / UPDATE PROJECT
========================================== */

if (uploadBtn) {

    uploadBtn.addEventListener("click", async () => {

        status.style.color = "#5B1020";
        status.textContent = "Processing...";

        const projectTitle = title.value.trim();
        const projectDescription = description.value.trim();
        const projectCategory = category.value;
        const file = image.files[0];

        if (!projectTitle) {
            status.style.color = "red";
            status.textContent = "Project title is required.";
            return;
        }

        let imageUrl = currentImage;

        if (file) {

            const fileName =
                `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

            const { error: uploadError } = await supabase.storage
                .from("portfolio")
                .upload(fileName, file);

            if (uploadError) {
                status.style.color = "red";
                status.textContent = uploadError.message;
                return;
            }

            const { data } = supabase.storage
                .from("portfolio")
                .getPublicUrl(fileName);

            imageUrl = data.publicUrl;

        }

        let result;

        if (editingId) {

            result = await supabase
                .from("projects")
                .update({
                    title: projectTitle,
                    description: projectDescription,
                    category: projectCategory,
                    image: imageUrl
                })
                .eq("id", editingId);

        } else {

            result = await supabase
                .from("projects")
                .insert([
                    {
                        title: projectTitle,
                        description: projectDescription,
                        category: projectCategory,
                        image: imageUrl
                    }
                ]);

        }

        if (result.error) {
            status.style.color = "red";
            status.textContent = result.error.message;
            return;
        }

        status.style.color = "green";
        status.textContent = editingId
            ? "Project updated successfully."
            : "Project uploaded successfully.";

        editingId = null;
        currentImage = "";

        title.value = "";
        description.value = "";
        category.selectedIndex = 0;
        image.value = "";

        previewImage.style.display = "none";
        previewText.style.display = "block";

        uploadBtn.textContent = "Upload Project";

        loadProjects();

    });

}

/* ==========================================
   LOAD PROJECTS
========================================== */

async function loadProjects() {

    if (!gallery) return;

    gallery.innerHTML = "<p>Loading projects...</p>";

    const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        gallery.innerHTML = `<p>${error.message}</p>`;
        return;
    }

    if (!projects.length) {

        gallery.innerHTML = `
            <div class="card">
                <h3>No projects uploaded yet.</h3>
            </div>
        `;

        return;
    }

    gallery.innerHTML = "";

    projects.forEach(project => {

        const card = document.createElement("div");

        card.className = "project";

        card.innerHTML = `
            <img src="${project.image}" alt="${project.title}">

            <div class="project-content">

                <h3>${project.title}</h3>

                <p>${project.description || ""}</p>

                <small>${project.category}</small>

                <div style="display:flex;gap:10px;margin-top:15px;">

                    <button
                        class="editBtn"
                        data-id="${project.id}">
                        Edit
                    </button>

                    <button
                        class="deleteBtn"
                        data-id="${project.id}"
                        data-image="${project.image}">
                        Delete
                    </button>

                </div>

            </div>
        `;

        gallery.appendChild(card);

    });

    document.querySelectorAll(".editBtn").forEach(button => {
        button.addEventListener("click", editProject);
    });

    document.querySelectorAll(".deleteBtn").forEach(button => {
        button.addEventListener("click", deleteProject);
    });

}
/* ==========================================
   MESSAGE ELEMENTS
========================================== */

const messagesContainer = document.getElementById("messages");
const filterButtons = document.querySelectorAll(".filter-btn");

/* ==========================================
   EDIT PROJECT
========================================== */

async function editProject(event) {

    const id = event.target.dataset.id;

    const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    editingId = project.id;
    currentImage = project.image;

    title.value = project.title;
    description.value = project.description || "";
    category.value = project.category || "";

    if (project.image) {
        previewImage.src = project.image;
        previewImage.style.display = "block";
        previewText.style.display = "none";
    }

    uploadBtn.textContent = "Update Project";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* ==========================================
   DELETE PROJECT
========================================== */

async function deleteProject(event) {

    if (!confirm("Delete this project?")) return;

    const id = event.target.dataset.id;
    const imageUrl = event.target.dataset.image;

    if (imageUrl) {

        const fileName = imageUrl.split("/").pop();

        await supabase.storage
            .from("portfolio")
            .remove([fileName]);

    }

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    status.style.color = "green";
    status.textContent = "Project deleted successfully.";

    loadProjects();
    loadStats();

}

/* ==========================================
   LOAD MESSAGES
========================================== */

async function loadMessages(messageStatus = "All") {

    if (!messagesContainer) return;

    messagesContainer.innerHTML = "<p>Loading messages...</p>";

    let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

    if (messageStatus !== "All") {
        query = query.eq("status", messageStatus);
    }

    const { data: messages, error } = await query;

    if (error) {
        messagesContainer.innerHTML = `<p>${error.message}</p>`;
        return;
    }

    if (!messages.length) {

        messagesContainer.innerHTML = `
            <div class="message-card">
                <h3>No messages found.</h3>
            </div>
        `;

        return;
    }

    messagesContainer.innerHTML = "";

    messages.forEach(message => {

        const card = document.createElement("div");

        card.className = "message-card";

        card.innerHTML = `
            <div class="message-header">
                <h3>${message.name}</h3>
                <span class="status ${message.status.toLowerCase()}">
                    ${message.status}
                </span>
            </div>

            <p><strong>Email:</strong> ${message.email}</p>
            <p><strong>Phone:</strong> ${message.phone || "Not provided"}</p>
            <p><strong>Subject:</strong> ${message.subject || "No Subject"}</p>

            <p>${message.message}</p>

            <small>
                ${new Date(message.created_at).toLocaleString()}
            </small>

            <div class="message-actions">

                <button
                    class="markRead"
                    data-id="${message.id}">
                    Mark Read
                </button>

                <button
                    class="markReplied"
                    data-id="${message.id}">
                    Mark Replied
                </button>

                <button
                    class="deleteMessage"
                    data-id="${message.id}">
                    Delete
                </button>

            </div>
        `;

        messagesContainer.appendChild(card);

    });

    document.querySelectorAll(".markRead").forEach(button => {

        button.addEventListener("click", () => {
            updateStatus(button.dataset.id, "Read");
        });

    });

    document.querySelectorAll(".markReplied").forEach(button => {

        button.addEventListener("click", () => {
            updateStatus(button.dataset.id, "Replied");
        });

    });

    document.querySelectorAll(".deleteMessage").forEach(button => {

        button.addEventListener("click", deleteMessage);

    });

}

/* ==========================================
   UPDATE MESSAGE STATUS
========================================== */

async function updateStatus(id, newStatus) {

    const { error } = await supabase
        .from("messages")
        .update({
            status: newStatus
        })
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    loadMessages();
    loadStats();

}

/* ==========================================
   DELETE MESSAGE
========================================== */

async function deleteMessage(event) {

    if (!confirm("Delete this message?")) return;

    const id = event.target.dataset.id;

    const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    loadMessages();
    loadStats();

}

/* ==========================================
   DASHBOARD STATISTICS
========================================== */

async function loadStats() {

    const { data: projects } = await supabase
        .from("projects")
        .select("id, category, created_at");

    const { data: messages } = await supabase
        .from("messages")
        .select("id");

    document.getElementById("projectCount").textContent =
        projects?.length || 0;

    document.getElementById("messageCount").textContent =
        messages?.length || 0;

    const categories = new Set();

    projects?.forEach(project => {
        categories.add(project.category);
    });

    document.getElementById("categoryCount").textContent =
        categories.size;

    const today = new Date().toDateString();

    const todayProjects = projects?.filter(project =>
        new Date(project.created_at).toDateString() === today
    ) || [];

    document.getElementById("todayCount").textContent =
        todayProjects.length;

}

/* ==========================================
   MESSAGE FILTER
========================================== */

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        loadMessages(button.dataset.status);

    });

});
/* ==========================================
   SERVICES
========================================== */

const serviceTitle = document.getElementById("serviceTitle");
const serviceDescription = document.getElementById("serviceDescription");
const serviceIcon = document.getElementById("serviceIcon");

const saveService = document.getElementById("saveService");
const servicesList = document.getElementById("servicesList");

let editingServiceId = null;

/* ==========================================
   LOAD SERVICES
========================================== */

async function loadServices() {

    if (!servicesList) return;

    servicesList.innerHTML = "<p>Loading services...</p>";

    const { data: services, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        servicesList.innerHTML = `<p>${error.message}</p>`;
        return;
    }

    if (!services.length) {
        servicesList.innerHTML = `
            <div class="card">
                <h3>No services added yet.</h3>
            </div>
        `;
        return;
    }

    servicesList.innerHTML = "";

    services.forEach(service => {

        const card = document.createElement("div");

        card.className = "project";

        card.innerHTML = `
            <div class="project-content">

                <h3>${service.title}</h3>

                <p>${service.description || ""}</p>

                <small>${service.icon}</small>

                <div style="display:flex;gap:10px;margin-top:15px;">

                    <button
                        class="editService"
                        data-id="${service.id}">
                        Edit
                    </button>

                    <button
                        class="deleteService"
                        data-id="${service.id}">
                        Delete
                    </button>

                </div>

            </div>
        `;

        servicesList.appendChild(card);

    });

    document.querySelectorAll(".editService").forEach(button => {

        button.addEventListener("click", () => {
            editService(button.dataset.id);
        });

    });

    document.querySelectorAll(".deleteService").forEach(button => {

        button.addEventListener("click", () => {
            deleteService(button.dataset.id);
        });

    });

}

/* ==========================================
   SAVE / UPDATE SERVICE
========================================== */

if (saveService) {

    saveService.addEventListener("click", async () => {

        const serviceTitleValue = serviceTitle.value.trim();
        const serviceDescriptionValue = serviceDescription.value.trim();
        const serviceIconValue = serviceIcon.value.trim();

        if (!serviceTitleValue || !serviceIconValue) {
            alert("Please enter the service title and icon.");
            return;
        }

        let result;

        if (editingServiceId) {

            result = await supabase
                .from("services")
                .update({
                    title: serviceTitleValue,
                    description: serviceDescriptionValue,
                    icon: serviceIconValue
                })
                .eq("id", editingServiceId);

        } else {

            result = await supabase
                .from("services")
                .insert([
                    {
                        title: serviceTitleValue,
                        description: serviceDescriptionValue,
                        icon: serviceIconValue
                    }
                ]);

        }

        if (result.error) {
            alert(result.error.message);
            return;
        }

        serviceTitle.value = "";
        serviceDescription.value = "";
        serviceIcon.value = "";

        editingServiceId = null;

        saveService.textContent = "Save Service";

        loadServices();

    });

}

/* ==========================================
   EDIT SERVICE
========================================== */

async function editService(id) {

    const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    editingServiceId = data.id;

    serviceTitle.value = data.title;
    serviceDescription.value = data.description || "";
    serviceIcon.value = data.icon;

    saveService.textContent = "Update Service";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* ==========================================
   DELETE SERVICE
========================================== */

async function deleteService(id) {

    if (!confirm("Delete this service?")) return;

    const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    if (editingServiceId === id) {
        editingServiceId = null;

        serviceTitle.value = "";
        serviceDescription.value = "";
        serviceIcon.value = "";

        saveService.textContent = "Save Service";
    }

    loadServices();

}
/* ==========================================
   TESTIMONIALS
========================================== */

const clientName = document.getElementById("clientName");
const clientCompany = document.getElementById("clientCompany");
const clientMessage = document.getElementById("clientMessage");
const clientRating = document.getElementById("clientRating");

const saveTestimonial = document.getElementById("saveTestimonial");
const testimonialsList = document.getElementById("testimonialsList");

let editingTestimonialId = null;

/* ==========================================
   LOAD TESTIMONIALS
========================================== */

async function loadTestimonials() {

    if (!testimonialsList) return;

    testimonialsList.innerHTML = "<p>Loading testimonials...</p>";

    const { data: testimonials, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        testimonialsList.innerHTML = `<p>${error.message}</p>`;
        return;
    }

    if (!testimonials.length) {
        testimonialsList.innerHTML = `
            <div class="card">
                <h3>No testimonials yet.</h3>
            </div>
        `;
        return;
    }

    testimonialsList.innerHTML = "";

    testimonials.forEach(testimonial => {

        const card = document.createElement("div");

        card.className = "project";

        card.innerHTML = `
            <div class="project-content">

                <h3>${testimonial.name}</h3>

                <small>${testimonial.company || ""}</small>

                <p>${testimonial.message}</p>

                <strong>${"⭐".repeat(testimonial.rating || 5)}</strong>

                <div style="display:flex;gap:10px;margin-top:15px;">

                    <button
                        class="editTestimonial"
                        data-id="${testimonial.id}">
                        Edit
                    </button>

                    <button
                        class="deleteTestimonial"
                        data-id="${testimonial.id}">
                        Delete
                    </button>

                </div>

            </div>
        `;

        testimonialsList.appendChild(card);

    });

    document.querySelectorAll(".editTestimonial").forEach(button => {

        button.addEventListener("click", () => {
            editTestimonial(button.dataset.id);
        });

    });

    document.querySelectorAll(".deleteTestimonial").forEach(button => {

        button.addEventListener("click", () => {
            deleteTestimonial(button.dataset.id);
        });

    });

}

/* ==========================================
   SAVE / UPDATE TESTIMONIAL
========================================== */

if (saveTestimonial) {

    saveTestimonial.addEventListener("click", async () => {

        const name = clientName.value.trim();
        const company = clientCompany.value.trim();
        const message = clientMessage.value.trim();
        const rating = parseInt(clientRating.value, 10) || 5;

        if (!name || !message) {
            alert("Please enter the client's name and testimonial.");
            return;
        }

        let result;

        if (editingTestimonialId) {

            result = await supabase
                .from("testimonials")
                .update({
                    name,
                    company,
                    message,
                    rating
                })
                .eq("id", editingTestimonialId);

        } else {

            result = await supabase
                .from("testimonials")
                .insert([
                    {
                        name,
                        company,
                        message,
                        rating
                    }
                ]);

        }

        if (result.error) {
            alert(result.error.message);
            return;
        }

        clientName.value = "";
        clientCompany.value = "";
        clientMessage.value = "";
        clientRating.value = "5";

        editingTestimonialId = null;

        saveTestimonial.textContent = "Save Testimonial";

        loadTestimonials();

    });

}

/* ==========================================
   EDIT TESTIMONIAL
========================================== */

async function editTestimonial(id) {

    const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    editingTestimonialId = data.id;

    clientName.value = data.name;
    clientCompany.value = data.company || "";
    clientMessage.value = data.message;
    clientRating.value = data.rating || 5;

    saveTestimonial.textContent = "Update Testimonial";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* ==========================================
   DELETE TESTIMONIAL
========================================== */

async function deleteTestimonial(id) {

    if (!confirm("Delete this testimonial?")) return;

    const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    if (editingTestimonialId === id) {
        editingTestimonialId = null;

        clientName.value = "";
        clientCompany.value = "";
        clientMessage.value = "";
        clientRating.value = "5";

        saveTestimonial.textContent = "Save Testimonial";
    }

    loadTestimonials();

}

/* ==========================================
   INITIALIZE APPLICATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadProjects();
    loadMessages();
    loadStats();
    loadServices();
    loadTestimonials();

});
