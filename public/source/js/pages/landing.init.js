/*
Template Name: Blightstone - Responsive Bootstrap 5 Admin Dashboard
Author: Blightstone
Version: 1.0.0
Website: https://blightstone.com/
File: Landing Page
*/

// Landing Page Menu Navbar
function windowScroll() {
    const navbar = document.getElementById("navbar");
    if (
        document.body.scrollTop >= 50 ||
        document.documentElement.scrollTop >= 50
    ) {
        navbar.classList.add("nav-sticky");
    } else {
        navbar.classList.remove("nav-sticky");
    }
}
window.addEventListener("scroll", (ev) => {
    ev.preventDefault();
    windowScroll();
});