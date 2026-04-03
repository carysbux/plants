function normalizeRoot(rootValue) {
  if (!rootValue || rootValue === ".") return ".";
  return rootValue.endsWith("/") ? rootValue.slice(0, -1) : rootValue;
}

function joinRoot(root, relativePath) {
  const cleanPath = String(relativePath || "").replace(/^\/+/, "");
  if (!cleanPath) return root === "." ? "." : root;
  return root === "." ? `./${cleanPath}` : `${root}/${cleanPath}`;
}

function getPageKey() {
  const bodyPage = document.body.dataset.page || "home";
  return bodyPage.toLowerCase();
}

function renderNavigation(nav, root) {
  const navEl = document.getElementById("main-nav");
  if (!navEl || !nav) return;

  const brandLink = nav.brand?.href || nav.brand?.link || "/";
  const brandName = nav.brand?.name || "Starter Garden";

  const linksHtml = (nav.links || [])
    .map((link) => {
      const href = joinRoot(root, link.href || "");
      return `<li class="nav-item"><a class="nav-link" href="${href}">${link.text || ""}</a></li>`;
    })
    .join("");

  navEl.innerHTML = `
    <nav class="navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <a class="navbar-brand" href="${joinRoot(root, brandLink)}">${brandName}</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            ${linksHtml}
          </ul>
        </div>
      </div>
    </nav>
  `;
}

function renderTitleAndDescription(title, description) {
  const titleEl = document.getElementById("page-title");
  const descEl = document.getElementById("page-description");
  if (titleEl) titleEl.textContent = title || "";
  if (descEl) {
    if (description) {
      descEl.textContent = description;
      descEl.classList.remove("d-none");
    } else {
      descEl.classList.add("d-none");
    }
  }
}

function renderSlideshow(slides, root) {
  const section = document.getElementById("slideshow-section");
  if (!section || !slides?.length) {
    if (section) section.innerHTML = "";
    return;
  }

  const carouselId = "carouselExampleControls";
  const itemsHtml = slides
    .map((slide, index) => {
      return `
        <div class="carousel-item ${index === 0 ? "active" : ""}">
          <img class="d-block w-100" src="${joinRoot(root, slide.url)}" alt="${slide.page || "slide"}">
        </div>
      `;
    })
    .join("");

  section.innerHTML = `
    <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
      <div class="carousel-inner">
        ${itemsHtml}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  `;
}

function renderGallery(images, root) {
  const section = document.getElementById("gallery-section");
  if (!section || !images?.length) {
    if (section) section.innerHTML = "";
    return;
  }

  const imageHtml = images
    .map((image) => {
      return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-3 gallery">
          <img class="img-fluid rounded" src="${joinRoot(root, image.url)}" alt="Garden photo">
        </div>
      `;
    })
    .join("");

  section.innerHTML = `<div class="row">${imageHtml}</div>`;
}

function renderPlants(plants, root) {
  const section = document.getElementById("plants-section");
  if (!section || !plants?.length) {
    if (section) section.innerHTML = "";
    return;
  }

  const cards = plants
    .map((plant) => {
      return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div class="card h-100">
            <img src="${joinRoot(root, plant.image)}" class="card-img-top" alt="${plant.name || "Plant"}">
            <div class="card-body">
              <h5 class="card-title">${plant.name || ""}</h5>
              <p class="card-text">${plant.description || ""}</p>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  section.innerHTML = `<div class="row">${cards}</div>`;
}

async function loadData(root) {
  const dataFiles = [
    "data/navigation.json",
    "data/slideshow.json",
    "data/gallery.json",
    "data/pages.json",
    "data/plants.json"
  ];

  const responses = await Promise.all(
    dataFiles.map((filePath) => fetch(joinRoot(root, filePath)))
  );

  for (const response of responses) {
    if (!response.ok) {
      throw new Error(`Failed to load ${response.url}`);
    }
  }

  const [navigation, slideshow, gallery, pages, plants] = await Promise.all(
    responses.map((response) => response.json())
  );

  return { navigation, slideshow, gallery, pages, plants };
}

async function initSite() {
  const root = normalizeRoot(document.body.dataset.root);
  const pageKey = getPageKey();

  try {
    const { navigation, slideshow, gallery, pages, plants } = await loadData(root);
    const pageData = (pages.pages || []).find((item) => item.page === pageKey);

    const title = pageKey === "home" ? "Starter Garden" : pageData?.title || "Starter Garden";
    const description = pageData?.description || "";
    const selectedSlides = (slideshow.slides || []).filter((slide) => (
      pageKey === "home" ? slide.home === true : slide.page === pageKey
    ));
    const selectedPlants = (plants.plants || []).filter((plant) => (
      String(plant.page || "").trim().toLowerCase() === pageKey
    ));

    renderNavigation(navigation, root);
    renderTitleAndDescription(title, description);
    renderSlideshow(selectedSlides, root);
    renderGallery(gallery.images || [], root);
    renderPlants(selectedPlants, root);
  } catch (error) {
    const main = document.querySelector("main");
    if (main) {
      main.innerHTML = `
        <h1>Starter Garden</h1>
        <p>There was a problem loading this page. Check that this site is being served over HTTP (for example, GitHub Pages).</p>
      `;
    }
    console.error(error);
  }
}

initSite();
