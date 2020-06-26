//TICKER DOM ANIMATION

document.querySelectorAll('.accordionButton').forEach((button) => {
    button.addEventListener('click', () => {
        const accordionContent = button.nextElementSibling;

        button.classList.toggle('active');

        if (button.classList.contains('active')) {
            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px'; //scrollHeight gives back the auto height
            accordionContent.style.padding = "1em";
        } else {
            accordionContent.style.maxHeight = 0;
            accordionContent.style.padding = "0 1em";
        }
    });
});
// acordeon.forEach(function(i) {
// 	item[i].addEventListener('click', function(event) {
// 		this.nextElementSibling.classList.toggle('hidden');
// 	});
// });
// //TICKER DOM ANIMATION