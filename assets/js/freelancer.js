(function() {
  "use strict"; // Start of use strict

  var scrollToTop = document.querySelector('.scroll-to-top');
  
  if (scrollToTop) {
    
    // Scroll to top button appear
    window.addEventListener('scroll', function() {
      var scrollDistance = window.pageYOffset;

      if (scrollDistance > 100) {
        scrollToTop.style.display = 'block';
      } else {
        scrollToTop.style.display = 'none';
      }
    });
  }

  var mainNav = document.querySelector('#mainNav');

  if (mainNav) {

    var navbarCollapse = mainNav.querySelector('.navbar-collapse');
    
    if (navbarCollapse) {
      
      var collapse = new bootstrap.Collapse(navbarCollapse, {
        toggle: false
      });
      
      var navbarItems = navbarCollapse.querySelectorAll('a');
      
      // Closes responsive menu when a scroll trigger link is clicked
      for (var item of navbarItems) {
        item.addEventListener('click', function (event) {
          collapse.hide();
        });
      }
    }

    // Collapse Navbar
    var collapseNavbar = function() {

      var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

      if (scrollTop > 100) {
        mainNav.classList.add("navbar-shrink");
      } else {
        mainNav.classList.remove("navbar-shrink");
      }
    };
    // Collapse now if page is not at top
    collapseNavbar();
    // Collapse the navbar when page is scrolled
    document.addEventListener("scroll", collapseNavbar);
  }

})(); // End of use strict

function createNavbar() {
  // Your HTML code snippet here
  var navbarHtml = `
      <nav class="navbar navbar-light navbar-expand-lg fixed-top bg-secondary text-uppercase" id="mainNav">
          <div class="container">
              <a class="navbar-brand" href="index.html#page-top">Abhas Dudeja</a>
              <button data-bs-toggle="collapse" data-bs-target="#navbarResponsive" class="navbar-toggler text-white bg-primary navbar-toggler-right text-uppercase rounded" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
                  <i class="fa fa-bars"></i>
              </button>
              <div class="collapse navbar-collapse" id="navbarResponsive">
                  <ul class="navbar-nav ms-auto">
                      <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="index.html#about">About</a></li>
                      <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="index.html#proficiency-skills">Proficiency &amp; Skills</a></li>
                      <li class="nav-item mx-0 mx-lg-1"><a class="nav-link active py-3 px-0 px-lg-3 rounded" href="projects.html">Projects</a></li>
                      <li class="nav-item mx-0 mx-lg-1"><a class="nav-link py-3 px-0 px-lg-3 rounded" href="index.html#footer">Contact Me</a></li>
                  </ul>
              </div>
          </div>
      </nav>`;

  // Append the HTML to the body or any other desired location
  document.body.innerHTML += navbarHtml;
  }