import supabase from "./supabase.js";

/* ==========================================
   DOM ELEMENTS
========================================== */

const gallery = document.getElementById("gallery");

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const closeLightbox = document.getElementById("closeLightbox");

const contactForm = document.getElementById("contactForm");

const servicesGrid = document.getElementById("servicesGrid");
const testimonialsGrid = document.getElementById("testimonialsGrid");

const scrollTop = document.getElementById("scrollTop");

/* ==========================================
   HELPER FUNCTIONS
========================================== */

function refreshAOS() {
    if (window.AOS) {
        AOS.refresh();
    }
}

function openLightbox(imageUrl) {
    if (!lightbox || !lightboxImage) return;

    lightbox.style.display = "flex";
    lightboxImage.src = imageUrl;
}

function closeLightboxModal() {
    if (!lightbox) return;

    lightbox.style.display = "none";
}

/* ==========================================
   MOBILE MENU
========================================== */

if (menuToggle && navMenu) {

    menuToggle.addEventListener("click", () => {

        navMenu.classList.toggle("active");

    });

    document.querySelectorAll("#navMenu a").forEach(link => {

        link.addEventListener("click", () => {

            navMenu.classList.remove("active");

        });

    });

}

/* ==========================================
   LIGHTBOX
========================================== */

if (closeLightbox) {

    closeLightbox.addEventListener("click", closeLightboxModal);

}

if (lightbox) {

    lightbox.addEventListener("click", (event) => {

        if (event.target === lightbox) {

            closeLightboxModal();

        }

    });

}

/* ==========================================
   SCROLL TO TOP
========================================== */

if (scrollTop) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 500) {

            scrollTop.classList.add("show");

        } else {

            scrollTop.classList.remove("show");

        }

    });

    scrollTop.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}


/* ==========================================
   LOAD PROJECTS & PORTFOLIO FILTERS
========================================== */

const portfolioButtons = document.querySelectorAll(
    ".portfolio-filter [data-category]"
);

let allProjects = [];
let currentCategory = "All";

function normalizeCategory(category = "") {
    const value = category
        .toLowerCase()
        .trim()
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ");

    const categories = {
        "all": "All",

        "branding": "Branding",
        "brand identity": "Branding",
        "brand design": "Branding",

        "logo": "Logo Design",
        "logos": "Logo Design",
        "logo design": "Logo Design",

        "print": "Print Design",
        "print design": "Print Design",
        "business card": "Print Design",
        "business cards": "Print Design",
        "brochure": "Print Design",
        "brochures": "Print Design",

        "social media": "Social Media",
        "social media design": "Social Media",
        "social media flyer": "Social Media",
        "social media flyers": "Social Media",
        "instagram post": "Social Media",
        "facebook post": "Social Media",

        "advertising": "Advertising",
        "advert": "Advertising",
        "ad design": "Advertising",
        "advert design": "Advertising",
        "advertisement": "Advertising",
        "advertisements": "Advertising"
    };

    return categories[value] || category.trim();
}

async function loadProjects() {
    if (!gallery) return;

    gallery.innerHTML = "<p>Loading projects...</p>";

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Unable to load projects:", error);
        gallery.innerHTML =
            "<p>Unable to load projects. Please try again later.</p>";
        return;
    }

    allProjects = data || [];
    renderProjects(currentCategory);
}

function renderProjects(category = "All") {
    if (!gallery) return;

    currentCategory = category;
    gallery.innerHTML = "";

    const filteredProjects = category === "All"
        ? allProjects
        : allProjects.filter(project =>
            normalizeCategory(project.category) === category
        );

    if (!filteredProjects.length) {
        gallery.innerHTML = `
            <p class="portfolio-empty">
                No projects found in ${category}.
            </p>
        `;
        return;
    }

    filteredProjects.forEach(project => {
        const card = document.createElement("div");

        card.className = "project-card";
        card.setAttribute("data-aos", "zoom-in");

        const image = document.createElement("img");
        image.src = project.image;
        image.alt = project.title || "Portfolio design";
        image.loading = "lazy";

        const info = document.createElement("div");
        info.className = "project-info";

        const title = document.createElement("h3");
        title.textContent = project.title || "Untitled Project";

        const description = document.createElement("p");
        description.textContent = project.description || "";

        const categoryLabel = document.createElement("span");
        categoryLabel.className = "project-category";
        categoryLabel.textContent =
            normalizeCategory(project.category) || "Uncategorized";

        info.append(title, description, categoryLabel);
        card.append(image, info);

        image.addEventListener("click", () => {
            openLightbox(project.image);
        });

        gallery.appendChild(card);
    });

    refreshAOS();
}

portfolioButtons.forEach(button => {
    button.addEventListener("click", () => {
        portfolioButtons.forEach(item =>
            item.classList.remove("active")
        );

        button.classList.add("active");

        renderProjects(button.dataset.category);
    });
});


/* ==========================================
   CONTACT FORM
========================================== */

if (contactForm) {

    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const contactStatus =
            document.getElementById("contactStatus");

        contactStatus.style.color = "#5B1020";
        contactStatus.textContent = "Sending...";

        const message = {

            name:
                document.getElementById("name").value.trim(),

            email:
                document.getElementById("email").value.trim(),

            phone:
                document.getElementById("phone").value.trim(),

            subject:
                document.getElementById("subject").value.trim(),

            message:
                document.getElementById("message").value.trim()

        };

        const { error } = await supabase
            .from("messages")
            .insert([message]);

        if (error) {

            console.error(error);

            contactStatus.style.color = "red";
            contactStatus.textContent = error.message;

            return;

        }

        contactStatus.style.color = "green";
        contactStatus.textContent =
            "Message sent successfully.";

        contactForm.reset();

    });

}
/* ==========================================
   LOAD SERVICES
========================================== */

async function loadServices() {

    if (!servicesGrid) return;

    const { data: services, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {

        console.error(error);

        servicesGrid.innerHTML =
            "<p>Unable to load services.</p>";

        return;

    }

    servicesGrid.innerHTML = "";

    services.forEach(service => {

        const card = document.createElement("div");

        card.className = "service-card";
        card.setAttribute("data-aos", "fade-up");

        card.innerHTML = `
            <i class="fas ${service.icon}"></i>

            <h3>${service.title}</h3>

            <p>${service.description || ""}</p>
        `;

        servicesGrid.appendChild(card);

    });

    refreshAOS();

}

/* ==========================================
   LOAD TESTIMONIALS
========================================== */

async function loadTestimonials() {

    if (!testimonialsGrid) return;

    const { data: testimonials, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {

        console.error(error);

        testimonialsGrid.innerHTML =
            "<p>Unable to load testimonials.</p>";

        return;

    }

    if (!testimonials.length) {

        testimonialsGrid.innerHTML =
            "<p>No testimonials available yet.</p>";

        return;

    }

    testimonialsGrid.innerHTML = "";

    testimonials.forEach(item => {

        const card = document.createElement("div");

        card.className = "testimonial-card";
        card.setAttribute("data-aos", "fade-up");

        card.innerHTML = `
            <div class="stars">
                ${"⭐".repeat(item.rating || 5)}
            </div>

            <p>"${item.message}"</p>

            <h4>${item.name}</h4>

            <small>${item.company || ""}</small>
        `;

        testimonialsGrid.appendChild(card);

    });

    refreshAOS();

}

/* ==========================================
   LOAD PROFILE
========================================== */

async function loadProfile() {

    const { data: profile, error } = await supabase
        .from("profile")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (error || !profile) {

        console.error(error);

        return;

    }

    const setText = (id, value = "") => {

        const element = document.getElementById(id);

        if (element) {

            element.textContent = value;

        }

    };

    const setLink = (id, value = "#") => {

        const element = document.getElementById(id);

        if (element) {

            element.href = value || "#";

        }

    };

    setText("profileName", profile.full_name);
    setText("profileProfession", profile.profession);
    setText("profileBio", profile.bio);
    setText("profileLocation", profile.location);

    setText("profileEmail", profile.email);
    setLink("profileEmail", `mailto:${profile.email}`);

    setText("profilePhone", profile.phone);
    setLink("profilePhone", `tel:${profile.phone}`);

    setLink("facebookLink", profile.facebook);
    setLink("instagramLink", profile.instagram);
    setLink("linkedinLink", profile.linkedin);
    setLink("behanceLink", profile.behance);
    setLink("whatsappLink", profile.whatsapp);
    setLink("tiktokLink", profile.tiktok);
/* ==========================
   LOAD PROFILE IMAGES
========================== */

const siteLogo = document.getElementById("siteLogo");
const profileImage = document.getElementById("profileImage");
const aboutImage = document.getElementById("aboutImage");

if (siteLogo && profile.logo) {
    siteLogo.src = profile.logo;
}

if (profileImage && profile.profile_image) {
    profileImage.src = profile.profile_image;
}

if (aboutImage && profile.about_image) {
    aboutImage.src = profile.about_image;
}
}

/* ==========================================
   INITIALIZE WEBSITE
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        // Initialize AOS
        if (window.AOS) {

            AOS.init({
                duration: 800,
                once: true,
                easing: "ease-in-out"
            });

        }

        // Load all website data
        await Promise.all([

            loadProjects(),
            loadServices(),
            loadTestimonials(),
            loadProfile()

        ]);

        console.log("✅ Website loaded successfully.");

    } catch (error) {

        console.error("Initialization Error:", error);

    }

});

/* ==========================================
   WINDOW LOAD
========================================== */

window.addEventListener("load", () => {

    document.body.classList.add("loaded");

});

/* ==========================================
   ACTIVE NAVIGATION
========================================== */

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("#navMenu a");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 120;
        const sectionHeight = section.offsetHeight;

        if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight
        ) {

            current = section.getAttribute("id");

        }

    });

    navLinks.forEach(link => {

        link.classList.remove("active");

        if (
            link.getAttribute("href") === `#${current}`
        ) {

            link.classList.add("active");

        }

    });

});

/* ==========================================
   STICKY NAVBAR EFFECT
========================================== */

const navbar = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (!navbar) return;

    if (window.scrollY > 50) {

        navbar.classList.add("scrolled");

    } else {

        navbar.classList.remove("scrolled");

    }

});

console.log("🚀 Mr Naths Concept is running.");