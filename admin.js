import supabase from "./supabase.js";

/* ==========================================
   AUTHENTICATION
========================================== */

const {
    data: { session }
} = await supabase.auth.getSession();

if (!session) {
    window.location.replace("login.html");
}

/* ==========================================
   SIDEBAR NAVIGATION
========================================== */

const navLinks = document.querySelectorAll("[data-page]");
const sections = document.querySelectorAll(".section");

navLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        navLinks.forEach(item => item.classList.remove("active"));
        sections.forEach(section => section.classList.remove("active"));

        link.classList.add("active");

        const page = document.getElementById(link.dataset.page);

        if (page) {
            page.classList.add("active");
        }

    });

});

/* ==========================================
   LOGOUT
========================================== */

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", async (e) => {

        e.preventDefault();

        await supabase.auth.signOut();

        window.location.replace("login.html");

    });

}

/* ==========================================
   PORTFOLIO ELEMENTS
========================================== */

const title = document.getElementById("title");
const description = document.getElementById("description");
const category = document.getElementById("category");
const image = document.getElementById("image");

const previewImage = document.getElementById("previewImage");
const previewText = document.getElementById("previewText");

const uploadBtn = document.getElementById("uploadBtn");
const status = document.getElementById("status");
const gallery = document.getElementById("gallery");

/* ==========================================
   SERVICE ELEMENTS
========================================== */

const serviceTitle = document.getElementById("serviceTitle");
const serviceDescription = document.getElementById("serviceDescription");
const serviceIcon = document.getElementById("serviceIcon");

const saveService = document.getElementById("saveService");
const servicesList = document.getElementById("servicesList");

/* ==========================================
   TESTIMONIAL ELEMENTS
========================================== */

const clientName = document.getElementById("clientName");
const clientCompany = document.getElementById("clientCompany");
const clientMessage = document.getElementById("clientMessage");
const clientRating = document.getElementById("clientRating");

const saveTestimonial = document.getElementById("saveTestimonial");
const testimonialsList = document.getElementById("testimonialsList");

/* ==========================================
   PROFILE ELEMENTS
========================================== */

const fullName = document.getElementById("fullName");
const profession = document.getElementById("profession");
const bio = document.getElementById("bio");

const aboutEmail = document.getElementById("aboutEmail");
const aboutPhone = document.getElementById("aboutPhone");
const aboutLocation = document.getElementById("aboutLocation");

const facebook = document.getElementById("facebook");
const instagram = document.getElementById("instagram");
const linkedin = document.getElementById("linkedin");
const behance = document.getElementById("behance");
const whatsapp = document.getElementById("whatsapp");
const tiktok = document.getElementById("tiktok");

const logoImage = document.getElementById("logoImage");
const heroImage = document.getElementById("heroImage");
const aboutImageUpload = document.getElementById("aboutImageUpload");

const saveProfile = document.getElementById("saveProfile");

/* ==========================================
   MESSAGE ELEMENTS
========================================== */

const messagesContainer = document.getElementById("messages");
const filterButtons = document.querySelectorAll(".filter-btn");

/* ==========================================
   DASHBOARD ELEMENTS
========================================== */

const projectCount = document.getElementById("projectCount");
const messageCount = document.getElementById("messageCount");
const categoryCount = document.getElementById("categoryCount");
const todayCount = document.getElementById("todayCount");

/* ==========================================
   GLOBAL VARIABLES
========================================== */

let editingId = null;
let currentImage = "";

let editingServiceId = null;

let editingTestimonialId = null;

/* ==========================================
   DASHBOARD STATISTICS
========================================== */

async function loadStats() {

    try {

        const { data: projects } = await supabase
            .from("projects")
            .select("id, category, created_at");

        const { data: messages } = await supabase
            .from("messages")
            .select("id");

        projectCount.textContent = projects?.length || 0;

        messageCount.textContent = messages?.length || 0;

        const categories = new Set();

        projects?.forEach(project => {

            if (project.category) {
                categories.add(project.category);
            }

        });

        categoryCount.textContent = categories.size;

        const today = new Date().toDateString();

        const uploadsToday = projects?.filter(project =>
            new Date(project.created_at).toDateString() === today
        );

        todayCount.textContent = uploadsToday?.length || 0;

    } catch (err) {

        console.error(err);

    }

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

        reader.onload = (e) => {

            previewImage.src = e.target.result;
            previewImage.style.display = "block";
            previewText.style.display = "none";

        };

        reader.readAsDataURL(file);

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

        gallery.innerHTML = "<p>No projects uploaded.</p>";
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
                        class="editProject"
                        data-id="${project.id}">
                        Edit
                    </button>

                    <button
                        class="deleteProject"
                        data-id="${project.id}"
                        data-image="${project.image}">
                        Delete
                    </button>

                </div>

            </div>

        `;

        gallery.appendChild(card);

    });

    document.querySelectorAll(".editProject").forEach(btn => {

        btn.addEventListener("click", () => {

            editProject(btn.dataset.id);

        });

    });

    document.querySelectorAll(".deleteProject").forEach(btn => {

        btn.addEventListener("click", () => {

            deleteProject(btn.dataset.id, btn.dataset.image);

        });

    });

}

/* ==========================================
   SAVE PROJECT
========================================== */

if (uploadBtn) {

    uploadBtn.addEventListener("click", saveProject);

}

async function saveProject() {

    status.textContent = "Processing...";
    status.style.color = "#5B1020";

    let imageUrl = currentImage;

    if (image.files.length) {

        const file = image.files[0];

        const fileName =
            `${Date.now()}-${file.name.replace(/\s+/g,"-")}`;

        const { error: uploadError } = await supabase.storage
            .from("portfolio")
            .upload(fileName, file);

        if (uploadError) {

            status.textContent = uploadError.message;
            status.style.color = "red";
            return;

        }

        const { data } = supabase.storage
            .from("portfolio")
            .getPublicUrl(fileName);

        imageUrl = data.publicUrl;

    }

    const project = {

        title: title.value.trim(),
        description: description.value.trim(),
        category: category.value,
        image: imageUrl

    };

    let result;

    if (editingId) {

        result = await supabase
            .from("projects")
            .update(project)
            .eq("id", editingId);

    } else {

        result = await supabase
            .from("projects")
            .insert([project]);

    }

    if (result.error) {

        status.textContent = result.error.message;
        status.style.color = "red";
        return;

    }

    status.textContent = editingId
        ? "Project updated successfully."
        : "Project uploaded successfully.";

    status.style.color = "green";

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
    loadStats();

}

/* ==========================================
   EDIT PROJECT
========================================== */

async function editProject(id) {

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {

        alert(error.message);
        return;

    }

    editingId = data.id;
    currentImage = data.image;

    title.value = data.title;
    description.value = data.description || "";
    category.value = data.category || "";

    previewImage.src = data.image;
    previewImage.style.display = "block";
    previewText.style.display = "none";

    uploadBtn.textContent = "Update Project";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* ==========================================
   DELETE PROJECT
========================================== */

async function deleteProject(id, imageUrl) {

    if (!confirm("Delete this project?")) return;

    if (imageUrl) {

        const fileName = imageUrl.split("/").pop();

        await supabase.storage
            .from("portfolio")
            .remove([fileName]);

    }

    await supabase
        .from("projects")
        .delete()
        .eq("id", id);

    loadProjects();
    loadStats();

}
/* ==========================================
   SERVICES
========================================== */


async function loadServices() {

    if (!servicesList) return;

    servicesList.innerHTML = "<p>Loading services...</p>";

    const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        servicesList.innerHTML = `<p>${error.message}</p>`;
        return;
    }

    servicesList.innerHTML = "";

    data.forEach(service => {

        const card = document.createElement("div");

        card.className = "project";

        card.innerHTML = `
            <div class="project-content">

                <h3>${service.title}</h3>

                <p>${service.description || ""}</p>

                <small>${service.icon}</small>

                <div style="display:flex;gap:10px;margin-top:15px;">

                    <button class="editService"
                        data-id="${service.id}">
                        Edit
                    </button>

                    <button class="deleteService"
                        data-id="${service.id}">
                        Delete
                    </button>

                </div>

            </div>
        `;

        servicesList.appendChild(card);

    });

    document.querySelectorAll(".editService").forEach(btn => {

        btn.onclick = () => editService(btn.dataset.id);

    });

    document.querySelectorAll(".deleteService").forEach(btn => {

        btn.onclick = () => deleteService(btn.dataset.id);

    });

}

if (saveService) {

    saveService.onclick = async () => {

        const service = {

            title: serviceTitle.value.trim(),
            description: serviceDescription.value.trim(),
            icon: serviceIcon.value.trim()

        };

        let result;

        if (editingServiceId) {

            result = await supabase
                .from("services")
                .update(service)
                .eq("id", editingServiceId);

        } else {

            result = await supabase
                .from("services")
                .insert([service]);

        }

        if (result.error) {

            alert(result.error.message);
            return;

        }

        editingServiceId = null;

        serviceTitle.value = "";
        serviceDescription.value = "";
        serviceIcon.value = "";

        saveService.textContent = "Save Service";

        loadServices();

    };

}

async function editService(id) {

    const { data } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();

    editingServiceId = id;

    serviceTitle.value = data.title;
    serviceDescription.value = data.description;
    serviceIcon.value = data.icon;

    saveService.textContent = "Update Service";

}

async function deleteService(id) {

    if (!confirm("Delete this service?")) return;

    await supabase
        .from("services")
        .delete()
        .eq("id", id);

    loadServices();

}

/* ==========================================
   TESTIMONIALS
========================================== */

async function loadTestimonials() {

    if (!testimonialsList) return;

    testimonialsList.innerHTML = "<p>Loading...</p>";

    const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {

        testimonialsList.innerHTML = error.message;
        return;

    }

    testimonialsList.innerHTML = "";

    data.forEach(item => {

        const card = document.createElement("div");

        card.className = "project";

        card.innerHTML = `

            <div class="project-content">

                <h3>${item.name}</h3>

                <small>${item.company || ""}</small>

                <p>${item.message}</p>

                <strong>${"⭐".repeat(item.rating)}</strong>

                <div style="display:flex;gap:10px;margin-top:15px;">

                    <button class="editTestimonial"
                        data-id="${item.id}">
                        Edit
                    </button>

                    <button class="deleteTestimonial"
                        data-id="${item.id}">
                        Delete
                    </button>

                </div>

            </div>

        `;

        testimonialsList.appendChild(card);

    });

    document.querySelectorAll(".editTestimonial").forEach(btn => {

        btn.onclick = () => editTestimonial(btn.dataset.id);

    });

    document.querySelectorAll(".deleteTestimonial").forEach(btn => {

        btn.onclick = () => deleteTestimonial(btn.dataset.id);

    });

}

if (saveTestimonial) {

    saveTestimonial.onclick = async () => {

        const testimonial = {

            name: clientName.value.trim(),
            company: clientCompany.value.trim(),
            message: clientMessage.value.trim(),
            rating: Number(clientRating.value)

        };

        let result;

        if (editingTestimonialId) {

            result = await supabase
                .from("testimonials")
                .update(testimonial)
                .eq("id", editingTestimonialId);

        } else {

            result = await supabase
                .from("testimonials")
                .insert([testimonial]);

        }

        if (result.error) {

            alert(result.error.message);
            return;

        }

        editingTestimonialId = null;

        clientName.value = "";
        clientCompany.value = "";
        clientMessage.value = "";
        clientRating.value = "5";

        saveTestimonial.textContent = "Save Testimonial";

        loadTestimonials();

    };

}

async function editTestimonial(id) {

    const { data } = await supabase
        .from("testimonials")
        .select("*")
        .eq("id", id)
        .single();

    editingTestimonialId = id;

    clientName.value = data.name;
    clientCompany.value = data.company;
    clientMessage.value = data.message;
    clientRating.value = data.rating;

    saveTestimonial.textContent = "Update Testimonial";

}

async function deleteTestimonial(id) {

    if (!confirm("Delete this testimonial?")) return;

    await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

    loadTestimonials();

}
/* ==========================================
   PROFILE
========================================== */

async function loadProfile() {

    const { data } = await supabase
        .from("profile")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (!data) return;

    fullName.value = data.full_name || "";
    profession.value = data.profession || "";
    bio.value = data.bio || "";

    aboutEmail.value = data.email || "";
    aboutPhone.value = data.phone || "";
    aboutLocation.value = data.location || "";

    facebook.value = data.facebook || "";
    instagram.value = data.instagram || "";
    linkedin.value = data.linkedin || "";
    behance.value = data.behance || "";
    whatsapp.value = data.whatsapp || "";
    tiktok.value = data.tiktok || "";

}

async function uploadImage(file, prefix) {

    if (!file) return null;

    const filename = `${prefix}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
        .from("portfolio")
        .upload(filename, file);

    if (error) throw error;

    return supabase.storage
        .from("portfolio")
        .getPublicUrl(filename)
        .data.publicUrl;

}

if (saveProfile) {

    saveProfile.onclick = async () => {

        try {

            const profile = {

                full_name: fullName.value.trim(),
                profession: profession.value.trim(),
                bio: bio.value.trim(),

                email: aboutEmail.value.trim(),
                phone: aboutPhone.value.trim(),
                location: aboutLocation.value.trim(),

                facebook: facebook.value.trim(),
                instagram: instagram.value.trim(),
                linkedin: linkedin.value.trim(),
                behance: behance.value.trim(),
                whatsapp: whatsapp.value.trim(),
                tiktok: tiktok.value.trim()

            };

            if (logoImage.files[0])
                profile.logo = await uploadImage(logoImage.files[0], "logo");

            if (heroImage.files[0])
                profile.profile_image = await uploadImage(heroImage.files[0], "hero");

            if (aboutImageUpload.files[0])
                profile.about_image = await uploadImage(aboutImageUpload.files[0], "about");

            const { data: existing } = await supabase
                .from("profile")
                .select("id")
                .limit(1)
                .maybeSingle();

            let result;

            if (existing) {

                result = await supabase
                    .from("profile")
                    .update(profile)
                    .eq("id", existing.id);

            } else {

                result = await supabase
                    .from("profile")
                    .insert([profile]);

            }

            if (result.error) {

                alert(result.error.message);
                return;

            }

            alert("Profile updated successfully.");

        } catch (err) {

            alert(err.message);

        }

    };

}

/* ==========================================
   CONTACT MESSAGES
========================================== */

async function loadMessages(status = "All") {

    if (!messagesContainer) return;

    let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

    if (status !== "All")
        query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {

        messagesContainer.innerHTML = error.message;
        return;

    }

    messagesContainer.innerHTML = "";

    data.forEach(message => {

        messagesContainer.innerHTML += `

        <div class="card">

            <h3>${message.name}</h3>

            <p><strong>Email:</strong> ${message.email}</p>

            <p>${message.message}</p>

            <small>${new Date(message.created_at).toLocaleString()}</small>

        </div>

        `;

    });

}

filterButtons.forEach(btn => {

    btn.onclick = () => {

        filterButtons.forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        loadMessages(btn.dataset.status);

    };

});

/* ==========================================
   FINAL INITIALIZATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadStats();

    loadProjects();

    loadServices();

    loadTestimonials();

    loadProfile();

    loadMessages();

});