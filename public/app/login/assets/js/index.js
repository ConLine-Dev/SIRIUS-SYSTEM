(function () {
    'use strict'

    // keyboard control
    var swiper = new Swiper(".keyboard-control", {
        slidesPerView: 1,
        spaceBetween: 30,
        keyboard: {
            enabled: true,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        loop: true,
        autoplay: {
            delay: 10000,
            disableOnInteraction: false
        }
    });

})();


function GenerateClicks(){
    const btnLoginGoogle = document.querySelector('.btnLoginGoogle')
    btnLoginGoogle.addEventListener('click', function(e){
        e.preventDefault();

        buttonDiv.click()
    })
}