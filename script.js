import supabase from "./supabase.js";

const gallery = document.getElementById("gallery");

/* ==========================
   LOAD PROJECTS
========================== */

async function loadProjects(category = "All") {

    if (!gallery) return;

    gallery.innerHTML = "<p>Loading projects...</p>";

    let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (category !== "All") {
        query = query.eq("category", category);
    }

    const { data: projects, error } = await query;

    if (error) {
        gallery.innerHTML = "<p>Unable to load projects.</p>";
        console.error(error);
        return;
    }

    if (!projects.length) {
        gallery.innerHTML = "<p>No projects found.</p>";
        return;
    }

    gallery.innerHTML = "";
  projects.forEach(project => {

    const card = document.createElement("div");
card.setAttribute("data-aos", "zoom-in");
    card.className = "project-card";

    card.innerHTML = `
        <img src="${project.image}" alt="${project.title}">

        <div class="project-info">

            <h3>${project.title}</h3>

            <p>${project.description || ""}</p>

            <span <span class="project-category">
    ${project.category}
</span>

        </div>
    `;

    gallery.appendChild(card);
const img = card.querySelector("img");

img.addEventListener("click", () => {

    document.getElementById("lightbox").style.display = "flex";

    document.getElementById("lightboxImage").src = img.src;
});
});

}

/* ==========================
   CATEGORY FILTER
========================== */

const filterButtons = document.querySelectorAll("[data-category]");

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active class
        filterButtons.forEach(btn => btn.classList.remove("active"));

        // Highlight selected button
        button.classList.add("active");

        // Load selected category
        loadProjects(button.dataset.category);

    });

});
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
});
  const lightbox = document.getElementById("lightbox");
const closeLightbox = document.getElementById("closeLightbox");

if (closeLightbox) {

    closeLightbox.addEventListener("click", () => {

        lightbox.style.display = "none";

    });

    lightbox.addEventListener("click", (e) => {

        if (e.target === lightbox) {

            lightbox.style.display = "none";

        }

    });

}
const contactForm = document.getElementById("contactForm");

if(contactForm){

contactForm.addEventListener("submit", async (e)=>{

e.preventDefault();

const status=document.getElementById("contactStatus");

status.textContent="Sending...";

const {error}=await supabase
.from("messages")
.insert([

{

name:document.getElementById("name").value,

email:document.getElementById("email").value,

phone:document.getElementById("phone").value,

subject:document.getElementById("subject").value,

message:document.getElementById("message").value

}

]);

if(error){

status.style.color="red";

status.textContent=error.message;

return;

}

status.style.color="green";

status.textContent="Message sent successfully.";

contactForm.reset();

});

}
/* ==========================
   LOAD SERVICES
========================== */

const servicesGrid = document.getElementById("servicesGrid");

async function loadServices(){

    if(!servicesGrid) return;

    const { data: services, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at");

    if(error){

        console.error(error);

        return;

    }

    servicesGrid.innerHTML = "";

    services.forEach(service=>{

        const card = document.createElement("div");

        card.className = "service-card";

        card.innerHTML = `

            <i class="fas ${service.icon}"></i>

            <h3>${service.title}</h3>

            <p>${service.description}</p>

        `;

        servicesGrid.appendChild(card);

    });
/* ==========================
   LOAD TESTIMONIALS
========================== */

const testimonialsGrid = document.getElementById("testimonialsGrid");

async function loadTestimonials() {

    if (!testimonialsGrid) return;

    const { data: testimonials, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    testimonialsGrid.innerHTML = "";

    testimonials.forEach(item => {

        const card = document.createElement("div");

        card.className = "testimonial-card";

        card.innerHTML = `
            <div class="stars">
                ${"⭐".repeat(item.rating)}
            </div>

            <p>"${item.message}"</p>

            <h4>${item.name}</h4>

            <small>${item.company || ""}</small>
        `;

        testimonialsGrid.appendChild(card);

    });

}
}
loadProjects();
loadServices();
loadTestimonials();